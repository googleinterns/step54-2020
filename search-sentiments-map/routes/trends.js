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

/** Server-side script that gets data from the google-trends-api. */

const express = require('express');
const router = express.Router();  // Using Router to divide the app into modules.

const fs = require('fs');
const googleTrends = require('google-trends-api');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

/** 
 * Renders a JSON array of the top 20 (or fewer) search trends with API data
 * obtained on the hour.
 */
router.get('/', (req, res) => {
  retrieveGlobalTrends().then(globalTrends => {
    res.setHeader('Content-Type', 'application/json');
    res.send(globalTrends);
  });
});

/** 
 * Returns a JSON-formatted array of global trends and their originating countries 
 * based on the latest trends retrieved from the Datastore. 
 */
async function retrieveGlobalTrends() {
  const query = datastore.createQuery('TrendsEntry').order('timestamp', {
    descending: true,
  });
  const [trendsEntry] = await datastore.runQuery(query);

  return getGlobalTrends(trendsEntry[0].trendsByCountry);
}

/** 
 * Finds the globally trending topics based on trending topics in each country.
 * Currently returning all topics from the US. TODO(@chenyuz): get a mixture of
 * topics from different countries.
 */
function getGlobalTrends(trendsByCountry) {
  let UStrends = trendsByCountry.filter(trends => trends['country'] === 'US');
  UStrends = UStrends[0].trends;

  let globalTrends = [];
  UStrends.forEach(trend => {
    globalTrends.push({
      country: 'US',
      trendTopic: trend.topic,
    });
  });
  return globalTrends;
}

/** 
 * Updates datastore storage of daily search trends and corresponding search results for the 46
 * countries where trends are available using the Google Trends API.
 */
async function updateDailyTrends() {
  let countryData = fs.readFileSync('./public/countries-with-trends.json');
  let countryJson = JSON.parse(countryData);

  var trendsByCountry = [];
  for (var i = 0; i < countryJson.length; i++) {
    country = countryJson[i];
    await googleTrends.dailyTrends({
      trendDate: new Date(),
      geo: country.id,
    }).then(dailyTrendsJsonString => {
      console.log('trends JSON created for', country.id, country.name);

      // Parse the JSON string and get the trending topics.
      trendingSearches = JSON.parse(dailyTrendsJsonString).default.trendingSearchesDays[0].trendingSearches;
      trendsByCountry.push(constructCountryTrendsJson(trendingSearches, country.id));
    }).catch(err => {
      console.log(err);
    });
  }

  saveTrendsAndDeletePrevious(trendsByCountry);
}

/** Creates a JSON item for trends in the given country. */
function constructCountryTrendsJson(trendingSearches, countryCode) {
  let trends = [];
  trendingSearches.forEach(trend => {
    trends.push({topic: trend.title.query});
  })

  return {
    country: countryCode,
    trends: trends,
  }
}

/**
 * Delete previous trends and save the current trends in a `trendsEntry` entity
 * in the Datastore, given the trends JSON organized by country.
 * Example data structure for a `trendsEntry`:
 * {timestamp: 111111111,
    trendsByCountry: [{
        country: US,
        trends: [{
          topic: Donald Trump,,
          results: [title1, ..., title7],
          sentimentScore: 0.2,
          }...
        ]}, {
        country: UK,
        trends: [..., ...]
      }...
    ]}
 */
async function saveTrendsAndDeletePrevious(trendsJsonByCountry) {
  await deleteAncientTrends();

  const trendsEntryKey = datastore.key('TrendsEntry');
  const trendsEntry = {
    key: trendsEntryKey,
    data: {
      timestamp: Date.now(),
      trendsByCountry: trendsJsonByCountry,
    },
  };

  try {
    await datastore.save(trendsEntry);
    console.log(`TrendsEntry ${trendsEntryKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

/** 
 * Delete all previous trends. TODO(@chenyuz): Change to delete trend records that were
 * saved more than 7 days ago. 
 */
async function deleteAncientTrends() {
  const query = datastore.createQuery('TrendsEntry');
  const [trendsEntries] = await datastore.runQuery(query);
  console.log(`Deleting ${trendsEntries.length} entries`);

  for (var i = 0; i < trendsEntries.length; i++) {
    const trendsEntryKey = trendsEntries[i][datastore.KEY];
    await datastore.delete(trendsEntryKey);
    console.log( `TrendsEntry ${trendsEntryKey.id} deleted.`);
  }
}

module.exports.router = router;
module.exports.updateTrendsFunction = updateDailyTrends;
