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
let router = express.Router();  // Using Router to divide the app into modules.

const fetch = require('node-fetch'); // Used to access custom search.
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const json = require('./../public/country-code.json');
global.Headers = fetch.Headers;

/** 
 * Renders a JSON array of the top search results for all countries with API data
 * obtained every 12 hours for the specified topic.
 */
router.get('/:topic', (req, res) => {
  let topic = req.params.topic;
  retrieveSearchResultFromDatastore(topic).then(customSearchTopicJsonArray => {
    res.setHeader('Content-Type', 'application/json');
    res.send(customSearchTopicJsonArray);
  });
});


/** 
 * Returns a JSON-formatted array of search results for countries retrieved
 * from the Datastore.
 * @param {string} topic Search topic to get data for.
 */
async function retrieveSearchResultFromDatastore(topic) {
  // Request latest entity with a topic matching the given topic.
  const query = datastore.createQuery('CustomSearchTopic').order('timestamp', {
    descending: true,
  }).filter('topic',topic).limit(1);

  try {
    const [customSearchTopic] = await datastore.runQuery(query);
    let customSearchTopicJsonArray = {
      topic: customSearchTopic[0].topic,
      countries: customSearchTopic[0].countries,
      timestamp: customSearchTopic[0].timestamp,
    };
    return customSearchTopicJsonArray;
  } catch (err) {
    console.error('ERROR:', err);
  }
}

/** 
 * Updates daily search results (accumulates by day) in the Datastore.
 */
// TODO(carmenbenitez): Update this to instead loop through top 10 trending
// searches and get that data instead.
function updateSearchResults() {
  updateSearchResultsForTopic("trump");
}

/** 
 * Retrieves search result data for all countries for a given topic. Passes
 * this data to be saved in Datastore.
 * @param {string} query Search query.
 */
// TODO(ntarn): Add in average score for search results of a country.
async function updateSearchResultsForTopic(query) {
  let countriesData = [];

  // Note: Can't use forEach with await.
  for (let i = 0; i < json.length; i++) {
    var set =0;
    // 100 queries per minute limit for Custom Search API. Pause to prevent
    // surpassing limit.
    if (i !== 0 && i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    let countryData = [];
    // Update countryData within the functions called.
    const avg = await getSearchResultsForCountryFromAPI(
        "country" + json[i].id, query, countryData);
    countriesData.push({
      country: json[i].id,
      average: avg,
      results: countryData,
    });
  }
  addTopicToDatastore(query, countriesData);
}

/** 
 * Gets top 10 search results for specified country and query from Custom
 * Search API and passes them to be saved in countryData object.
 * @param {string} countryCode 2 letter country code for search results to be
 *     written in.
 * @param {string} query Search query.
 * @param {Object} countryData Object holding all searchResults for a country.
 */
async function getSearchResultsForCountryFromAPI(countryCode, query, countryData) {
  let response = 
      await fetch('https://www.googleapis.com/customsearch/v1?key=AIzaSyDszWv1aGP7Q1uOt74CqBpx87KpkhDR6Io&cx=017187910465527070415:o5pur9drtw0&q='+query+'&cr='+countryCode+'&num=10&safe=active&dateRestrict=d1&fields=items(title,snippet,htmlTitle,link)');
  let searchResults =  await response.json();
  // console.log(searchResults);
  return await saveResultsAndDeletePrevious(searchResults, countryData);
}

/**
 * Deletes previous search results and saves the current results in the
 * Datastore, given the results JSON obtained from the API.
 * @param {Object} searchResultsJson Object with information for top 10 search
 *     results.
 * @param {Object} countryData Object holding all searchResults for a country.
 */
async function saveResultsAndDeletePrevious(searchResultsJson, countryData) {
  await deleteAncientResults();

  // Parse the JSON string and pass each search result to add to the
  // countryData object.
  var currentSearchResults = searchResultsJson.items;
  try {
    let avg = 0;
    for (var i = 0; i < currentSearchResults.length; i++) {
      avg = avg + await addSearchResultToCountryData(currentSearchResults[i], countryData);
    }
    return avg / currentSearchResults.length;
  } catch (err) { // Occurs when no search results for that country and topic.
    console.error('ERROR:', err);
    countryData = null;
  }
}

/** Deletes search results from 7 days ago. */
async function deleteAncientResults() {
  const query = datastore.createQuery('CustomSearchTopic').order('timestamp');
  const [searchResults] = await datastore.runQuery(query);

  // Note: Can't use forEach with await.
  // Loop through sorted data beginnning with oldest results, delete if older
  // than a week. Stop when reach results from within a week.
  for (let i = 0; i < searchResults.length; i++) {
    if (Date.now() - searchResults[i].timestamp > 7 * 24 * 60 * 60000) {
      const searchResultKey = searchResults[i][datastore.KEY];
      await datastore.delete(searchResultKey);
      console.log(`Search Result ${searchResultKey.id} deleted.`)
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
async function addTopicToDatastore(topic, countriesData) {
  const customSearchTopicKey = datastore.key('CustomSearchTopic');
  // Get the current timestamp in milliseconds.
  let timestamp = Date.now();
  const entity = {
    key: customSearchTopicKey,
    data: {
      topic: topic,
      countries: countriesData,
      timestamp: Date.now(),
    },
  };
  try {
    await datastore.save(entity);
    console.log(`Search Result ${customSearchTopicKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

/**
 * Adds search result object to countryData array.
 * @param {Object} searchResult Object with information for one search result.
 * @param {Object} countryData Object holding all searchResults for a country.
*/
function addSearchResultToCountryData(searchResult, countryData) {
  sentimentScore = getSentiment(searchResult);
  searchResultData = {
    title: searchResult.title,
    snippet: searchResult.snippet,
    htmlTitle: searchResult.htmlTitle,
    link: searchResult.link,
    score: sentimentScore,
  };
  countryData.push(searchResultData);
  return sentimentScore;
}

/** 
 * Gets the sentiment score of a search result. 
 * @param {Object} searchResult Object with information for one search result.
 */
function getSentiment(searchResult) {
  fetch('https://trending-search-sentiments.ue.r.appspot.com/sentiment', {method: 'POST',  // Send a request to the URL.
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
    body: searchResult.title + searchResult.snippet
    })
    .then(response => response.json())
    .then((result) => { 
      console.log('ntarn debug: frontend' + result.score);
      return result.score;
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports.router = router;
module.exports.updateSearchResults = updateSearchResults;