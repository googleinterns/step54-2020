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
var router = express.Router();  // Using Router to divide the app into modules.

const googleTrends = require('google-trends-api');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

/** 
 * Render a JSON string of the top 20 (or fewer) search trends of the past 24
 * hours. 
 */
router.get('/', (req, res) => {
  googleTrends.dailyTrends({
    trendDate: new Date(),
    geo: 'US',
  }).then(dailyTrendsJsonString => {
    // Parse the JSON string and get the trending topics.
    var trendingSearches = JSON.parse(dailyTrendsJsonString).default.trendingSearchesDays[0].trendingSearches;
    for (var i = 0; i < trendingSearches.length; i++) {
      //addTrendToDatastore(trendingSearches[i].title.query)
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(trendingSearches);
  }).catch(err => {
    console.log(err);
  });
});

async function retrieveTrends() {
  const query = datastore.createQuery('Trend').order('created');
  const [trends] = await datastore.runQuery(query);
  console.log('Trends:');
  trends.forEach(trend => {
    const trendKey = trend[datastore.KEY];
    console.log(trendKey.id, trend);
  });
}

/** 
 * Obtains daily search trends and typical results from the API and store them
 * in Datastore. 
 */
function getDailyTrends() {
  googleTrends.dailyTrends({
    trendDate: new Date(),
    geo: 'US',
  }).then(dailyTrendsJsonString => {
    // Parse the JSON string and get the trending topics.
    var trendingSearches = JSON.parse(dailyTrendsJsonString).default.trendingSearchesDays[0].trendingSearches;
    for (var i = 0; i < trendingSearches.length; i++) {
      addTrendToDatastore(trendingSearches[i].title.query)
    }
    console.log('deleting');
    deleteAncientTrends();
  }).catch(err => {
    console.log(err);
  });
}

/** 
 * Delete all previous trends.
 * TODO: Delete trend records that were saved more than 7 days ago. 
 */
async function deleteAncientTrends() {
  const query = datastore.createQuery('Trend').order('created');
  const [trends] = await datastore.runQuery(query);
  for (var i = 0; i < trends.length; i++) {
    const trendKey = trend[datastore.KEY];
    await datastore.delete(trendKey);
    console.log('Trend $(trendId) deleted.')
  }
  //trends.forEach(trend => {
  //  const trendKey = trend[datastore.KEY];
    //deleteTrend(trendKey.id);
  //  await datastore.delete(trendKey);
  //});
}

async function deleteTrend(trendId) {
  const trendKey = datastore.key(['Trend', datastore.int(trendId)]);
  await datastore.delete(trendKey);
  console.log('Trend $(trendId) deleted.')
}

/** Saves the given trending topic to the Datastore. */
async function addTrendToDatastore(topic) {
  const trendKey = datastore.key('Trend');
  // Get the current timestamp in milliseconds.
  let timestamp = Date.now();
  const entity = {
    key: trendKey,
    data: {
      trendTopic: topic,
      date: timestamp,
    },
  };

  try {
    await datastore.save(entity);
    console.log(`Trend ${trendKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

module.exports.router = router;
module.exports.getTrendsFunction = getDailyTrends;
