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
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
const WORLD_DATA_KIND = 'WorldDataByTopic';

const searchInterestsModule = require('./search-interests.js');
const countriesJson = require('./../public/country-code.json');
global.Headers = fetch.Headers;

const STALE_DATA_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;
const PAUSE_ONE_MIN_MS = 60000;
const QUERIES_PER_MIN = 100;

/** 
 * Renders a JSON array of the top search results for all countries with API data
 * obtained every 12 hours for the specified topic.
 */
router.get('/:topic', (req, res) => {
  console.log("here");
  let topic = req.params.topic;
  search.retrieveSearchResultFromDatastore(topic).then(topicDataJsonArray => {
    res.setHeader('Content-Type', 'application/json');
    res.send(topicDataJsonArray);
  });
});

/** 
 * Returns a JSON-formatted array of search results for all countries retrieved
 * from the Datastore.
 * @param {string} topic Search topic to get data for.
 */
async function retrieveSearchResultFromDatastore(topic) {
  // Request latest entity with a topic matching the given topic.
  const query = datastore.createQuery(WORLD_DATA_KIND).order('timestamp', {
    descending: true,
  }).filter('topic', topic).limit(1);

  try {
    const [worldDataByTopic] = await datastore.runQuery(query);
    return {
      topic: worldDataByTopic[0].topic,
      timestamp: worldDataByTopic[0].timestamp,
      dataByCountry: worldDataByTopic[0].dataByCountry,
    };
  } catch (err) {
    console.error('ERROR: retrieving data for topic', topic, err);
  }
}

/** 
 * Updates daily search results (accumulated by day) in the Datastore.
 * Deletes stale data from Datastore.
 */
async function updateSearchResults() {
  await search.deleteAncientResults();
  const trends = await search.retrieveGlobalTrends();
  for (let i = 0; i < trends.length; i++) {
    await search.updateSearchResultsForTopic(trends[i].trendTopic);
    // Note: when testing ,use i < 1 to test for only one trend, and comment 
    // out `await new Promise` line to avoid 1 minute pauses.
    await search.sleepForOneMinute();
  }
}

/** 
 * Obtains the most recent global trends by querying the Datastore.
 * @return {!Array<JSON>} A JSON array of global trends and their originating countries.
 */
async function retrieveGlobalTrends() {
  const query = datastore.createQuery('TrendsEntry').order('timestamp', {
    descending: true,
  });
  const [trendsEntry] = await datastore.runQuery(query);
  return trendsEntry[0].globalTrends;
}

/** 
 * Updates search result data for all countries for a given topic.
 *   - Retrieves and formats search result data for each country.
 *   - Saves the search results for all countries to the datastore.
 * @param {string} query Search query.
 */
async function updateSearchResultsForTopic(query) {
  let countriesData = [];
  await searchInterestsModule.getGlobalSearchInterests(query)
      .then(async (searchInterests) => {
    // Note: Use i < 3 countries when testing.
    for (let i = 0; i < countriesJson.length; i++) {
      let countryCode = countriesJson[i].id;
      let interest = searchInterests.filter(interestsByCountry => 
          interestsByCountry.geoCode === countryCode);
      let interestScore = interest.length === 0 ? 0 : interest[0].value[0];

      // Use a limited number of queries per minute for the Custom Search API, 
      // and include a pause to prevent surpassing limit.
      if (i !== 0 && i % QUERIES_PER_MIN === 0) {
        await search.sleepForOneMinute();
      }
      let countryResults = await search.getCustomSearchResultsForCountry(
          countryCode, query);
      countriesData.push({
        country: countryCode,
        results: countryResults.results,
        averageSentiment: countryResults.score,
        interest: interestScore,
      });
    }
  });
  search.addWorldDataByTopicToDatastore(query, countriesData);
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
      await fetch('https://www.googleapis.com/customsearch/v1?key=' + searchApiKey
          + '&cx=017187910465527070415:o5pur9drtw0&q='  + query
          + '&cr=country' + countryCode
          + '&num=10&safe=active&dateRestrict=d1&fields=items(title,snippet,htmlTitle,link)');
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
  let currentSearchResults = searchResultsJson.items;
  let countryData = [];
  let totalScore = 0;
  if (currentSearchResults == undefined) {
    return {score: 0, results: countryData};
  }
  for (let i = 0; i < currentSearchResults.length; i++) {
    let formattedResults =
        await search.formatSearchResult(currentSearchResults[i]);
    countryData.push(formattedResults);
    totalScore += formattedResults.score;
  }
  let avgScore = 0;
  if (currentSearchResults.length !== 0) {
    avgScore = totalScore / currentSearchResults.length;
  }
  return {score: avgScore, results: countryData};
}

/**
 * Formats search result object.
 * @param {Object} searchResult Object with information for one search result.
 * @return {Object} Formatted search result data in JSON form.
 */
function formatSearchResult(searchResult) {
  return search.getSentiment(searchResult)
      .then(response => response.json())
      .then((result) => {
        return {
          title: searchResult.title,
          snippet: searchResult.snippet,
          htmlTitle: searchResult.htmlTitle,
          link: searchResult.link,
          score: result.score,
        };
      });
}

/** 
 * Gets the sentiment score of a search result. 
 * @param {Object} searchResult Object for one search result.
 */
function getSentiment(searchResult) {
  return fetch('https://trending-search-sentiments.ue.r.appspot.com/sentiment', {
    method: 'POST',  // Send a request to the URL.
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
    body: searchResult.title + searchResult.snippet
  }).catch(err => {
    console.log(err);
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
      timestamp: Date.now(),  // Get the current timestamp in milliseconds.
      dataByCountry: countriesData,
    },
  };
  try {
    await datastore.save(entity);
    console.log(topic);
    console.log(`Custom Search Result ${worldDataByTopicKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

/** Sleep for one minute. */
function sleepForOneMinute() {
  return new Promise(resolve => setTimeout(resolve, PAUSE_ONE_MIN_MS));
}

const search = {
  retrieveSearchResultFromDatastore,
  updateSearchResults,
  retrieveGlobalTrends,
  updateSearchResultsForTopic,
  getCustomSearchResultsForCountry,
  formatCountryResults,
  formatSearchResult,
  getSentiment,
  deleteAncientResults,
  addWorldDataByTopicToDatastore,
  sleepForOneMinute,
}

module.exports.router = router;
module.exports.search = search;