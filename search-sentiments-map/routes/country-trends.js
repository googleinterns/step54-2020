// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

const express = require('express');
const router = express.Router();  // Using Router to divide the app into modules.

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const RETRIEVE_RESULTS_TIME_MS = 70 * 60000;
// Time interval between data updates.
const CURRENT_DATA_TIME_RANGE_12_HOURS_MS = 12 * 60 * 60000;

/** Renders the trends data of the country given by the request parameter. */
router.get('/:timeRange/:country', (req, res) => {
  let country = req.params.country;
  let timeRange = parseInt(req.params.timeRange);
  countryTrends.retrieveCountryTrends(country, timeRange).then(trends => {
    res.setHeader('Content-Type', 'application/json');
    res.send(trends);
  });
});

/**
 * Gets the trends data (each trend including title, articles, and sentiment) 
 * from the Datastore for the specified country.
 * @param {!string} country The two-letter code for the country requested.
 * @param {number} timeRange An integer representing how many time ranges 
 *     previous to get data from.
 * @return {!Array<JSON>} An array of the trends; empty array if there is no
 *     trends data for the specified country.
 */
async function retrieveCountryTrends(country, timeRange) {
  let timeRangeLimit = CURRENT_DATA_TIME_RANGE_12_HOURS_MS * timeRange;
  const query = datastore.createQuery('TrendsEntry').order('timestamp', {
    descending: true,
  }).filter('timestamp', '<', Date.now() - timeRangeLimit).limit(2);
  const [trendsEntry] = await datastore.runQuery(query);
  
  // Handle case where Google Trends API breaks and stops providing
  // data.
  if (trendsEntry.length === 0) {
    return [];
  }
  const entry = (
      Date.now() - trendsEntry[0].timestamp > 
          RETRIEVE_RESULTS_TIME_MS + timeRangeLimit) ?
              trendsEntry[0] : trendsEntry[1];
  const countryTrends = entry.trendsByCountry
      .filter(trends => trends.country === country);
  if (countryTrends.length === 0) {
    return [];
  }
  return countryTrends[0].trends;
}

// Necessary for unit testing.
const countryTrends = {
  retrieveCountryTrends,
}

module.exports.countryTrends = countryTrends;
module.exports.router = router;