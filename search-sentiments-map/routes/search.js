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
var router = express.Router();  // Using Router to divide the app into modules.

const fetch = require('node-fetch'); // Used to access custom search.
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

/** 
 * Renders a JSON array of the top 10 search trends with API data obtained 
 * every 12 hours.
 */
router.get('/', (req, res) => {
  retrieveSearchResultFromDatastore().then(searchResultJsonArray => {
    res.setHeader('Content-Type', 'application/json');
    res.send(searchResultJsonArray);
  });
});


/** 
 * Returns a JSON-formatted array of search results retrived from the 
 * Datastore.
 */
async function retrieveSearchResultFromDatastore() {
  const query = datastore.createQuery('SearchResult').order('timestamp', {
    descending: true,
  });
  const [searchResults] = await datastore.runQuery(query);

  let searchResultJsonArray = [];
  searchResults.forEach(searchResult => {
    searchResultJsonArray.push({
      title: searchResult.title,
      snippet: searchResult.snippet,
      htmlTitle: searchResult.htmlTitle,
      htmlSnippet: searchResult.htmlSnippet,
      link: searchResult.link,
      timestamp: searchResult.timestamp,
    });
  });
  return searchResultJsonArray;
}


/** 
 * Gets top 10 search results for specified country and query from Custom
 * Search API and passes them to be saved in Datastore.
 * @param {string} country Country for search results to be written in
 * @param {string} query Search query.
 */
function getSearchResultsFromAPI(country, query) {
  fetch('https://www.googleapis.com/customsearch/v1?key=AIzaSyDszWv1aGP7Q1uOt74CqBpx87KpkhDR6Io&cx=017187910465527070415:o5pur9drtw0&q='+query+'&cr='+country+'&num=10&safe=active&dateRestrict=d1&fields=items(title,snippet,htmlTitle,htmlSnippet,link)')
  .then(response => response.json())
  .then(searchResults => saveResultsAndDeletePrevious(searchResults));
}


/** 
 * Updates daily search results (accumulates by day) in the Datastore.
 * TODO: Update this to instead loop through top 10 trending searches
 * and get that data instead.
 */
function updateSearchResults() {
  getSearchResultsFromAPI("countryUS", "trump");
}

/**
 * Deletes previous search results and save the current results in the
 * Datastore, given the results JSON obtained from the API.
 */
async function saveResultsAndDeletePrevious(searchResultsJson) {
  await deleteAncientResults();

  // Parse the JSON string and pass each search result to add to the
  // Datastore.
  var currentSearchResults = searchResultsJson.items;
  for (var i = 0; i < currentSearchResults.length; i++) {
    await addSearchResultToDatastore(currentSearchResults[i]);
  }
}

/** 
 * Delete previous search results. TODO: Change to delete trend records that
 * were saved more than 7 days ago. Currently deletes all previous results.
 */
async function deleteAncientResults() {
  const query = datastore.createQuery('SearchResult');
  const [searchResults] = await datastore.runQuery(query);

  // Note: Can't use forEach with await.
  for (let i = 0; i < searchResults.length; i++) {
    const searchResultKey = searchResults[i][datastore.KEY];
    await datastore.delete(searchResultKey);
    console.log(`Search Result ${searchResultKey.id} deleted.`)
  }
}

/** Saves the given search result to the Datastore. */
async function addSearchResultToDatastore(searchResult) {
  const searchResultKey = datastore.key('SearchResult');
  // Get the current timestamp in milliseconds.
  let timestamp = Date.now();
  const entity = {
    key: searchResultKey,
    data: {
      title: searchResult.title,
      snippet: searchResult.snippet,
      htmlTitle: searchResult.htmlTitle,
      htmlSnippet: searchResult.htmlSnippet,
      link: searchResult.link,
      timestamp: Date.now(),
    },
  };
  try {
    await datastore.save(entity);
    console.log(`Search Result ${searchResultKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

module.exports.router = router;
module.exports.updateSearchResults = updateSearchResults;