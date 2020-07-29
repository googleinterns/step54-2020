// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

/** Server-side script that gets search results from the custom search api. */

const express = require('express');
// Use Router to divide the app into modules.
let router = express.Router();

const fetch = require('node-fetch'); // Used to access custom search.
const sentiment = require('./sentiment.js')
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
const WORLD_DATA_KIND = 'WorldDataByTopic';

const searchInterestsModule = require('./search-interests.js');
const countriesJson = require('./../public/country-code.json');
global.Headers = fetch.Headers;

const STALE_DATA_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;
// Time interval between data updates.
const CURRENT_DATA_TIME_RANGE_12_HOURS_MS = 12 * 60 * 60000;
const PAUSE_ONE_MIN_MS = 60000;
const QUERIES_PER_MIN = 100;

// Multiplier for sentiment scores.
const SCORE_SCALE_MULTIPLIER = 100;
// The default score assigned to countries with not search results or interest
// data.
const NO_RESULTS_DEFAULT_SCORE = -500;

/** 
 * Renders a JSON array of the top search results for all countries with API
 * data obtained every 12 hours for the specified topic.
 */
router.get('/:topic&:timeRange', (req, res) => {
  let topic = req.params.topic;
  let timeRange = parseInt(req.params.timeRange);
  search.retrieveSearchResultFromDatastore(topic, timeRange)
      .then(topicDataJsonArray => {
        res.setHeader('Content-Type', 'application/json');
        res.send(topicDataJsonArray);
      });
});

/** 
 * Renders a JSON array of the top search results for requested countries with
 * API data from within the last
 * `CURRENT_DATA_TIME_RANGE_12_HOURS_MS` for the specified topic.
 */
router.get('/:topic/:countries', (req, res) => {
  let topic = req.params.topic;
  let countries = JSON.parse(req.params.countries);
  search.retrieveUserSearchResultFromDatastore(topic, countries)
      .then(userSearchTopicJsonArray => {
        res.setHeader('Content-Type', 'application/json');
        res.send(userSearchTopicJsonArray);
      });
});

/** 
 * Returns a JSON-formatted array of search results from specified time range
 * for all countries retrieved from the Datastore.
 * @param {string} topic Search topic to get data for.
 * @param {number} timeRange An integer representing how many 
 *     `CURRENT_DATA_TIME_RANGE_12_HOURS_MS` ranges previous to get data from.
 * @return {Object} A JSON array of search results for all countries for
 *     given topic.
 */
async function retrieveSearchResultFromDatastore(topic, timeRange) {
  // Request latest entity with a topic matching the given topic.
  const query = datastore.createQuery(WORLD_DATA_KIND)
      .order('timestamp', {descending: true})
      .limit(1)
      .filter('topic', topic)
      .filter('timestamp', '<',
          Date.now() - CURRENT_DATA_TIME_RANGE_12_HOURS_MS * timeRange);

  try {
    const [worldDataByTopic] = await datastore.runQuery(query);
    console.log(worldDataByTopic);
    return {
      topic: worldDataByTopic[0].topic,
      timestamp: worldDataByTopic[0].timestamp,
      dataByCountry: worldDataByTopic[0].dataByCountry,
    };
  } catch (err) {
    console.error('Error: retrieving data for topic', topic, err);
  }
}

/** 
 * Retrieves search result data for specified countries for a given topic.
 *   - Obtains and formats search results from Custom Search API if the data
 *         is not currently stored.
 *   - Saves any new search results to the datastore.
 *   - Retrieves any relevant existing search results from datastore.
 *   - Returns all requested search results on the topic from the countries.
 * @param {string} topic Search topic to get data for.
 * @param {Array} countries Countries to get search topic data for.
 * @return {Object} JSON-formatted array of search results from requested
 *     countries.
 */
async function retrieveUserSearchResultFromDatastore(topic, countries) {
  // Request latest entity with a topic matching the given topic.
  const query = datastore.createQuery(WORLD_DATA_KIND).order('timestamp', {
    descending: true,
  }).filter('lowercaseTopic', topic.toLowerCase()).limit(1);
  const [worldDataByTopic] = await datastore.runQuery(query);

  let countriesDataToReturn = [];
  let timestamp;
  if (worldDataByTopic.length !== 0 &&
      Date.now() - worldDataByTopic[0].timestamp <
      CURRENT_DATA_TIME_RANGE_12_HOURS_MS) {
    timestamp = worldDataByTopic[0].timestamp;
    let countriesToAddDataFor = [];
    let countriesData = worldDataByTopic[0].dataByCountry;

    // Determine whether a country has existing data or data needs to be
    // retrieved from Custom Search API for this topic.
    countries.forEach(country => {
      let countryData = countriesData
          .filter(countries => countries.country === country);
      if (countryData.length === 0) {
        countriesToAddDataFor.push(country);
      } else {
        countriesDataToReturn.push(countryData[0]);
      }
    });

    // Obtain custom search data for countries without current data.     
    // Add new custom search data to existing entity and to the data to
    // send back to the frontend.
    if (countriesToAddDataFor.length !== 0) {
      let newCountriesData = await search.getSearchResultsForCountriesForTopic(
        countriesToAddDataFor, topic);
      await search.addNewCountryData(newCountriesData, worldDataByTopic[0]);
      countriesDataToReturn = countriesDataToReturn.concat(newCountriesData);
    }
  } else {
    // Get data for all of the requested countries when there is no existing
    // entity and create a new entity with this data.
    countriesDataToReturn = await search.getSearchResultsForCountriesForTopic(
        countries, topic);
    await search.addWorldDataByTopicToDatastore(topic, countriesDataToReturn);
    timestamp = Date.now();
  }

  return {
    topic: topic,
    timestamp: timestamp,
    dataByCountry: countriesDataToReturn,
  };
}

/** 
 * Adds country data for specific topic to a WorldDataByTopic entity.
 * @param {string} countriesData Search results for countries to add to the
 *     Datastore.
 * @param {Object} worldDataEntity Entity we are adding search results to.
 */
async function addNewCountryData(countriesData, worldDataEntity) {
  // Do not update timestamp to make sure the oldest data is from within the
  // last `CURRENT_SEARCH_RESULT_THRESHOLD_24_HOURS_MS` hours.
  worldDataEntity.dataByCountry =
      worldDataEntity.dataByCountry.concat(countriesData);
  await datastore.save(worldDataEntity);
}

/** 
 * Updates daily search results (accumulated by day) in the Datastore.
 * Deletes stale data from Datastore.
 */
async function updateSearchResults() {
  await search.deleteAncientResults();
  let countries = countriesJson.map(country => country.id);

  const trends = await search.retrieveGlobalTrends();
  for (let i = 0; i < trends.length; i++) {
    let topic = trends[i].trendTopic;
    console.log('Creating WorldDataByTopic entity for', topic)
    let countriesData = await search.getSearchResultsForCountriesForTopic(
        countries, topic);
    search.addWorldDataByTopicToDatastore(topic, countriesData);

    // Note: When testing, use i < 1 to test for only one trend, and comment 
    // out `await new Promise` line to avoid 1 minute pauses.
    await search.sleep(PAUSE_ONE_MIN_MS);
  }
}

/** 
 * Obtains the most recent global trends by querying the Datastore.
 * @return {!Array<JSON>} A JSON array of global trends and their originating
 *     countries.
 */
async function retrieveGlobalTrends() {
  const query = datastore.createQuery('TrendsEntry').order('timestamp', {
    descending: true,
  });
  const [trendsEntry] = await datastore.runQuery(query);
  return trendsEntry[0].globalTrends;
}

/** 
 * Retrieves search result data for given countries for a given topic. Returns
 * this data.
 * @param {Array} countries Array of 2 letter country codes for search results
 *     to be written in.
 * @param {string} topic Search query.
 * @return {Object} Formatted object with country search result data and
 *     country overall score for all given countries.
 */
async function getSearchResultsForCountriesForTopic(countries, topic) {
  let countriesData = [];
  await searchInterestsModule.getGlobalSearchInterests(topic)
      .then(async (searchInterests) => {
    // Note: Use i < 3 countries when testing.
    for (let i = 0; i < countries.length; i++) {
      let countryCode = countries[i];
      let interest = searchInterests.filter(interestsByCountry => 
          interestsByCountry.geoCode === countryCode);
      let interestScore = interest.length === 0 ? 
          SCORE_NO_RESULTS : interest[0].value[0];

      // Use a limited number of queries per minute for the Custom Search API, 
      // and include a pause to prevent surpassing limit.
      if (i !== 0 && i % QUERIES_PER_MIN === 0) {
        await search.sleep(PAUSE_ONE_MIN_MS);
      }
      let countryResults = await search.getCustomSearchResultsForCountry(
          countryCode, topic);
      countriesData.push({
        country: countryCode,
        results: countryResults.results,
        averageSentiment: countryResults.score,
        interest: interestScore,
      });
    }
  });
  return countriesData;
}

/** 
 * Gets top 10 search results for specified country and query from Custom
 * Search API and passes them to be saved in countryData object.
 * @param {string} countryCode 2 letter country code for search results to be
 *     written in.
 * @param {string} query Search query.
 * @return {Object} Formatted object with country search result data and
 *     country overall score.
 */
async function getCustomSearchResultsForCountry(countryCode, query) {
  const {searchApiKey} = require('./config.js');
  let response = 
      await fetch('https://www.googleapis.com/customsearch/v1?key='
          + searchApiKey + '&cx=017187910465527070415:o5pur9drtw0&q=' + query
          + '&cr=country' + countryCode
          + '&num=10&safe=active&dateRestrict=d1'
          + '&fields=items(title,snippet,htmlTitle,link)');
  let searchResults =  await response.json();
  return await search.formatCountryResults(searchResults);
}

/**
 * Formats the current results given the JSON results obtained from theAPI.
 * @param {Object} searchResultsJson Object with information about the top 10
 *     search results.
 * @return {Object} Formatted object with country's search result data and
 *      average sentiment score of all search result of that country.
 */
async function formatCountryResults(searchResultsJson) {
  // Parse the JSON string and pass each search result to add to the
  // `countryData` object.
  let currentSearchResults = searchResultsJson.items;
  let countryData = [];
  let totalScore = 0;
  if (currentSearchResults == undefined) {
    return {score: NO_RESULTS_DEFAULT_SCORE, results: countryData};
  }
  for (let i = 0; i < currentSearchResults.length; i++) {
    let formattedResults =
        await search.formatSearchResult(currentSearchResults[i]);
    countryData.push(formattedResults);
    totalScore += formattedResults.score;
  }
  let avgScore = NO_RESULTS_DEFAULT_SCORE;
  if (currentSearchResults.length !== 0) {
    avgScore = totalScore / currentSearchResults.length;
  }
  return {score: avgScore, results: countryData};
}

/**
 * Formats search result object.
 * @param {!Object} searchResult Object with information for one search result.
 * @return {Object} Formatted search result data in JSON form.
 */
function formatSearchResult(searchResult) {
  return sentiment.getSentimentScore(searchResult.title + searchResult.snippet)
      .then((result) => {
        return {
          title: searchResult.title,
          snippet: searchResult.snippet,
          htmlTitle: searchResult.htmlTitle,
          link: searchResult.link,
          score: SCORE_SCALE_MULTIPLIER * result,
        };
      });
}

/** Deletes stale search results. */
async function deleteAncientResults() {
  const query = datastore.createQuery(WORLD_DATA_KIND).order('timestamp');
  const [searchResults] = await datastore.runQuery(query);

  // TODO(carmenbenitez): Delete comment on for each when finished with this
  // function.
  // Note: We can't use forEach with await.
  // Loop through sorted data beginnning with oldest results, delete if older
  // than a week. Stop when reach results from within a week.
  for (let i = 0; i < searchResults.length; i++) {
    if (Date.now() - searchResults[i].timestamp >
        STALE_DATA_THRESHOLD_7_DAYS_MS) {
      const searchResultKey = searchResults[i][datastore.KEY];
      await datastore.delete(searchResultKey);
      console.log(`Custom Search Result ${searchResultKey.id} deleted.`)
    } else {
      break;
    }
  }
}

/** 
 * Creates Datastore item for given topic and country search results. 
 * @param {string} topic The search topic the search results are for.
 * @param {Object} countriesData Object holding all searchResults for all
 *      countries.
 * Example data structure for a `WorldDataByTopic` entity:
 * {topic: Donald Trump,
    timestamp: 1443242341,
    dataByCountry: [{
      country: US,
      results: [{
        title: content, 
        snippet: content, 
        htmlTitle: content, 
        htmlSnippet: content, 
        link: content, 
        score: 0.9,},
      {...}, {...} … (10 articles)],
      averageSentiment: 0.5,
      interest: 80,
    }, {
      country: France,
      results: [{...}{...}...],
      averageSentiment: 0.6,
      interest: 35,}...]}
 */
async function addWorldDataByTopicToDatastore(topic, countriesData) {
  const worldDataByTopicKey = datastore.key(WORLD_DATA_KIND);
  const entity = {
    key: worldDataByTopicKey,
    data: {
      topic: topic,
      lowercaseTopic: topic.toLowerCase(),
      timestamp: Date.now(),  // Get the current timestamp in milliseconds.
      dataByCountry: countriesData,
    },
  };
  try {
    await datastore.save(entity);
    console.log(
      `Custom Search Result ${worldDataByTopicKey.id} created successfully.`
    );
  } catch (err) {
    console.error('ERROR:', err);
  }
}

/** Sleep for one minute. */
function sleep(sleepTime) {
  return new Promise(resolve => setTimeout(resolve, sleepTime));
}

// Necessary for unit testing.
const search = {
  retrieveSearchResultFromDatastore,
  retrieveUserSearchResultFromDatastore,
  addNewCountryData,
  updateSearchResults,
  retrieveGlobalTrends,
  getSearchResultsForCountriesForTopic,
  getCustomSearchResultsForCountry,
  formatCountryResults,
  formatSearchResult,
  deleteAncientResults,
  addWorldDataByTopicToDatastore,
  sleep,
}
module.exports.search = search;

module.exports.router = router;