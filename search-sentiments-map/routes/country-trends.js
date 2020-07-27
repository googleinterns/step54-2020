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

/** Renders the trends data of the country given by the request parameter. */
router.get('/:country', (req, res) => {
  let country = req.params.country;
  retrieveCountryTrends(country).then(trends => {
    res.setHeader('Content-Type', 'application/json');
    res.send(trends);
  });
});

/**
 * Gets the trends data (each trend including title, articles, and sentiment) 
 * from the Datastore for the specified country.
 * @param {!string} country The two-letter code for the country requested.
 * @return {!Array<JSON>} An array of the trends; empty array if there is no
 *     trends data for the specified country.
 */
async function retrieveCountryTrends(country) {
  const query = datastore.createQuery('TrendsEntry').order('timestamp', {
    descending: true,
  }).limit(2);
  const [trendsEntry] = await datastore.runQuery(query);
  const entry = 
      (Date.now() - trendsEntry[0].timestamp > RETRIEVE_RESULTS_TIME_MS) ? 
      trendsEntry[0] : trendsEntry[1];
  const countryTrends = entry.trendsByCountry
      .filter(trends => trends.country === country);
  if (countryTrends.length === 0) {
    return [];
  }
  return countryTrends[0].trends;
}

module.exports.router = router;