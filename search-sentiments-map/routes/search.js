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

const json = require('./../public/country-code.json');
global.Headers = fetch.Headers;


// Multiplier for sentiment scores.
const SCORE_SCALE_MULTIPLIER = 100;
// The default score assigned to countries with not search results.
const NO_RESULTS_DEFAULT_SCORE = -500;
const STALE_SEARCH_RESULT_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;
// TODO(carmenbenitez): Set this to be 12 hours when we want data to be
// updated every 12 hours.
const CURRENT_SEARCH_RESULT_THRESHOLD_24_HOURS_MS = 24 * 60 * 60000;
const PAUSE_TO_PREVENT_REACHING_QUOTA_1_MIN_MS = 60000;

/** 
 * Renders a JSON array of the top search results for all countries with API
 * data obtained every 12 hours for the specified topic.
 */
router.get('/:topic', (req, res) => {
  let topic = req.params.topic;
  retrieveSearchResultFromDatastore(topic).then(customSearchTopicJsonArray => {
    res.setHeader('Content-Type', 'application/json');
    res.send(customSearchTopicJsonArray);
  });
});

/** 
 * Renders a JSON array of the top search results for requested countries with
 * API data from within the last
 * `CURRENT_SEARCH_RESULT_THRESHOLD_24_HOURS_MS` for the specified topic.
 */
router.get('/:topic/:countries', (req, res) => {
  let topic = req.params.topic;
  let countries = JSON.parse(req.params.countries);
  retrieveUserSearchResultFromDatastore(topic, countries).then(userSearchTopicJsonArray => {
    res.setHeader('Content-Type', 'application/json');
    res.send(userSearchTopicJsonArray);
  });
});

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
  const query = datastore.createQuery('CustomSearchTopic').order('timestamp', {
    descending: true,
  }).filter('lowercaseTopic', topic.toLowerCase()).limit(1);
  const [customSearchTopic] = await datastore.runQuery(query);

  let countriesDataToReturn = [];
  let timestamp;
  if (customSearchTopic.length !== 0 &&
      Date.now() - customSearchTopic[0].timestamp <
      CURRENT_SEARCH_RESULT_THRESHOLD_24_HOURS_MS) {
        timestamp = customSearchTopic[0].timestamp;
        let countriesToAddDataFor = [];
        let countriesData = customSearchTopic[0].countries;

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
          let newCountriesData = await getSearchResultsForArrayOfCountries(
            countriesToAddDataFor, topic);
          await addNewCountryData(newCountriesData, customSearchTopic[0]);
          countriesDataToReturn = countriesDataToReturn.concat(newCountriesData);
        }
  } else {
    // Get data for all of the requested countries when there is no existing
    // entity and create a new entity with this data.
    countriesDataToReturn = await getSearchResultsForArrayOfCountries(
      countries, topic);
    await addCustomSearchTopicEntityToDatastore(topic, countriesDataToReturn);
    timestamp = Date.now();
  }

  try {
    let customSearchTopicJsonArray = {
      topic: topic,
      countries: countriesDataToReturn,
      timestamp: timestamp,
    };
    return customSearchTopicJsonArray;
  } catch (err) {
    console.error('ERROR: ', err);
  }
}

/** 
 * Retrieves search result data for given countries for a given topic and 
 * returns it.
 * @param {Array} countries Array of 2 letter country codes for search results
 *     to be written in.
 * @param {string} topic Search query.
 * @return {Object} Formatted object with country search result data and
 *     country overall score for all given countries.
 */
async function getSearchResultsForArrayOfCountries(countries, topic) {
  let countriesSearchResultData = [];
  for (let i = 0; i < countries.length; i++) {
    const countryResults =
        await getCustomSearchResultsForCountry(countries[i], topic);
    countriesSearchResultData.push({
      country: countries[i],
      averageSentiment: countryResults.score,
      results: countryResults.results,
    });
  }
  return countriesSearchResultData;
}

/** 
 * Adds country data for specific topic to a `CustomSearchTopic` entity.
 * @param {string} countriesData Search results for countries to add to the
 *     Datastore.
 * @param {Object} customSearchEntity The entity we are adding search results to.
 */
async function addNewCountryData(countriesData, customSearchEntity) {
  // Do not update timestamp to make sure the oldest data is from within the
  // last `CURRENT_SEARCH_RESULT_THRESHOLD_24_HOURS_MS` hours. 
  customSearchEntity.countries =
      customSearchEntity.countries.concat(countriesData);
  await datastore.save(customSearchEntity);
}

/** 
 * Returns a JSON-formatted array of search results for countries retrieved
 * from the Datastore.
 * @param {string} topic Search topic to get data for.
 */
async function retrieveSearchResultFromDatastore(topic) {
  // Request latest entity with a topic matching the given topic.
  const query = datastore.createQuery('CustomSearchTopic').order('timestamp', {
    descending: true,
  }).filter('lowercaseTopic', topic.toLowerCase()).limit(1);

  try {
    const [customSearchTopic] = await datastore.runQuery(query);
    let customSearchTopicJsonArray = {
      topic: customSearchTopic[0].topic,
      countries: customSearchTopic[0].countries,
      timestamp: customSearchTopic[0].timestamp,
    };
    return customSearchTopicJsonArray;
  } catch (err) {
    console.error('ERROR: ', err);
  }
}

/** 
 * Updates daily search results (accumulated by day) in the Datastore.
 * Deletes stale data from Datastore.
 */
async function updateSearchResults() {
  await deleteAncientResults();
  retrieveGlobalTrends().then(async trends => {
    // When testing ,use i < 1 to test for only one trend, and comment out
    // `await new Promise` line to avoid 1 minute pauses.
    for (let i = 0; i < trends.length; i++) {
      updateSearchResultsForTopic(trends[i].trendTopic);
      // 100 queries per minute limit for Custom Search API. Pause to prevent
      // surpassing limit.
      await new Promise(resolve =>
          setTimeout(resolve, PAUSE_TO_PREVENT_REACHING_QUOTA_1_MIN_MS));
    }
  });
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

  // TODO(carmenbenitez): Delete comment on for each when finished with this
  // function.
  // Note: We can't use forEach with await.
  // When testing, make i < 3 countries.
  for (let i = 0; i < json.length; i++) {
    // Use 100 queries per minute limit for the Custom Search API, and include
    // a pause of 1 minute to prevent surpassing limit.
    if (i !== 0 && i % 100 === 0) {
      await new Promise(resolve =>
          setTimeout(resolve, PAUSE_TO_PREVENT_REACHING_QUOTA_1_MIN_MS));
    }
    // Update `countryData` within the functions called.
    const countryResults =
        await getCustomSearchResultsForCountry(json[i].id, query);
    countriesData.push({
      country: json[i].id,
      averageSentiment: countryResults.score,
      results: countryResults.results,
    });
  }
  addCustomSearchTopicEntityToDatastore(query, countriesData);
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
  let response =
    await fetch('https://www.googleapis.com/customsearch/v1?key=AIzaSyDszWv1aGP7Q1uOt74CqBpx87KpkhDR6Io&cx=017187910465527070415:o5pur9drtw0&q=' + query + '&cr=country' + countryCode + '&num=10&safe=active&dateRestrict=d1&fields=items(title,snippet,htmlTitle,link)');
  let searchResults = await response.json();
  return await formatCountryResults(searchResults);
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
          await formatSearchResults(currentSearchResults[i]);
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
 * @param {Object} searchResult Object with information for one search result.
 * @return {Object} Formatted search result data in JSON form.
 */
function formatSearchResults(searchResult) {
  return getSentiment(searchResult)
      .then(response => response.json())
      .then((result) => {
        return {
          title: searchResult.title,
          snippet: searchResult.snippet,
          htmlTitle: searchResult.htmlTitle,
          link: searchResult.link,
          score: SCORE_SCALE_MULTIPLIER * result.score,
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
  const query = datastore.createQuery('CustomSearchTopic').order('timestamp');
  const [searchResults] = await datastore.runQuery(query);

  // TODO(carmenbenitez): Delete comment on for each when finished with this
  // function.
  // Note: We can't use forEach with await.
  // Loop through sorted data beginnning with oldest results, delete if older
  // than a week. Stop when reach results from within a week.
  for (let i = 0; i < searchResults.length; i++) {
    if (Date.now() - searchResults[i].timestamp >
        STALE_SEARCH_RESULT_THRESHOLD_7_DAYS_MS) {
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
 * @param {string} topic The seach topic the search results are for.
 * @param {Object} countriesData Object holding all searchResults for all
 *      countries.
 */
async function addCustomSearchTopicEntityToDatastore(topic, countriesData) {
  const customSearchTopicKey = datastore.key('CustomSearchTopic');
  // Get the current timestamp in milliseconds.
  let timestamp = Date.now();
  const entity = {
    key: customSearchTopicKey,
    data: {
      topic: topic,
      lowercaseTopic: topic.toLowerCase(),
      countries: countriesData,
      timestamp: Date.now(),
    },
  };
  try {
    await datastore.save(entity);
    console.log(`Custom Search Result ${customSearchTopicKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR: ', err);
  }
}

module.exports.router = router;
module.exports.updateSearchResults = updateSearchResults;