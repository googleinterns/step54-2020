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
const WORLD_DATA_KIND = 'WorldDataByTopic';

const searchInterestsModule = require('./search-interests.js');
const json = require('./../public/country-code.json');

/** 
 * Renders a JSON array of the top search results for all countries with API data
 * obtained every 12 hours for the specified topic.
 */
router.get('/:topic', (req, res) => {
  let topic = req.params.topic;
  retrieveSearchResultFromDatastore(topic).then(topicDataJsonArray => {
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
  }).filter('topic',topic).limit(1);

  try {
    const [worldDataByTopic] = await datastore.runQuery(query);
    //return worldDataByTopic[0].dataByCountry;
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
 * Updates daily search results (accumulates by day) in the Datastore.
 */
function updateSearchResults() {
  retrieveGlobalTrends().then(async trends => {
    for (let i = 0; i < trends.length; i++) {
      updateSearchResultsForTopic(trends[i].trendTopic);
      // 100 queries per minute limit for Custom Search API. Pause to prevent
      // surpassing limit.
      //await new Promise(resolve => setTimeout(resolve, 60000));
    }
  });
}

/** 
 * Retrieves search result data for all countries for a given topic. Passes
 * this data to be saved in Datastore.
 * @param {string} query Search query.
 */
// TODO(ntarn): Add in average score for search results of a country.
async function updateSearchResultsForTopic(query) {
  let countriesData = [];
  await searchInterestsModule.getGlobalSearchInterests(query)
      .then(async (searchInterests) => {
    for (let i = 0; i < json.length; i++) {
      let interest = searchInterests.filter(interestsByCountry => 
          interestsByCountry.geoCode === json[i].id);
      let interestScore = interest.length === 0 ? 0 : interest[0].value[0];

      // 100 queries per minute limit for Custom Search API. Pause to prevent
      // surpassing limit.
      //if (i !== 0 && i % 100 === 0) {
      //  await new Promise(resolve => setTimeout(resolve, 60000));
      //}
      let countryData = [];
      // Update countryData within the functions called.
      //await getSearchResultsForCountryFromAPI(
      //    "country" + json[i].id, query, countryData);
      countriesData.push({
        country: json[i].id,
        results: countryData,
        averageSentiment: 0,
        interest: interestScore,
      });
    }
  });
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
  const {searchApiKey} = require('./config.js');
  let response = 
      await fetch('https://www.googleapis.com/customsearch/v1?key=' + searchApiKey
          + '&cx=017187910465527070415:o5pur9drtw0&q='  + query
          + '&cr=' + countryCode
          + '&num=10&safe=active&dateRestrict=d1&fields=items(title,snippet,htmlTitle,link)');
  let searchResults =  await response.json();
  await saveResultsAndDeletePrevious(searchResults, countryData);
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
    for (var i = 0; i < currentSearchResults.length; i++) {
      await addSearchResultToCountryData(currentSearchResults[i], countryData);
    }
  } catch  (err) { // Occurs when no search results for that country and topic.
    console.error('ERROR:', err);
    countryData = null;
  }
}

/**
 * Adds search result object to countryData array.
 * @param {Object} searchResult Object with information for one search result.
 * @param {Object} countryData Object holding all searchResults for a country.
*/
// TODO(ntarn): Add in sentiment score for this search result.
function addSearchResultToCountryData(searchResult, countryData) {
  searchResultData = {
    title: searchResult.title,
    snippet: searchResult.snippet,
    htmlTitle: searchResult.htmlTitle,
    link: searchResult.link,
    // score = sentimentscore
  };
  countryData.push(searchResultData);
}

/** Deletes search results from 7 days ago. */
async function deleteAncientResults() {
  const query = datastore.createQuery(WORLD_DATA_KIND).order('timestamp');
  const [searchResults] = await datastore.runQuery(query);

  // Note: Can't use forEach with await.
  // Loop through sorted data beginnning with oldest results, delete if older
  // than a week. Stop when reach results from within a week.
  for (let i = 0; i < searchResults.length; i++) {
    if (Date.now() - searchResults[i].timestamp > 7 * 24 * 60 * 60000) {
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
async function addTopicToDatastore(topic, countriesData) {
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

/** 
 * Queries the Datastore for the most recent global trends.
 * @return {!Array<JSON>} A JSON array of global trends and their originating countries.
 */
async function retrieveGlobalTrends() {
  const query = datastore.createQuery('TrendsEntry').order('timestamp', {
    descending: true,
  });
  const [trendsEntry] = await datastore.runQuery(query);
  return trendsEntry[0].globalTrends;
}

module.exports.router = router;
module.exports.updateSearchResults = updateSearchResults;