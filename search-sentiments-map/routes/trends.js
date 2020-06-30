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
  const query = datastore.createQuery('Trend').order('timestamp', {
    descending: true,
  });
  const [trends] = await datastore.runQuery(query);
  console.log('Retrieving:', trends.length);
  trends.forEach(trend => {
    const trendKey = trend[datastore.KEY];
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
    saveTrendsAndDeletePrevious(dailyTrendsJsonString);
  }).catch(err => {
    console.log(err);
  });
}

/**
 * Delete previous trends and save the current trends in datastore, given the
 * trends JSON obtained from the API.
 */
async function saveTrendsAndDeletePrevious(dailyTrendsJsonString) {
  await deleteAncientTrends();

  // Parse the JSON string and get the trending topics.
  var trendingSearches = JSON.parse(dailyTrendsJsonString).default.trendingSearchesDays[0].trendingSearches;
  for (var i = 0; i < trendingSearches.length; i++) {
    await addTrendToDatastore(trendingSearches[i].title.query)
  }
}

/** 
 * Delete all previous trends. TODO: Delete trend records that were saved more
 * than 7 days ago. 
 */
async function deleteAncientTrends() {
  const query = datastore.createQuery('Trend');
  const [trends] = await datastore.runQuery(query);
  console.log(trends.length)

  for (var i = 0; i < trends.length; i++) {  // Note: Can't use forEach with await.
    const trendKey = trends[i][datastore.KEY];
    await datastore.delete(trendKey);
    console.log(`Trend ${trendKey.id} deleted.`)
  }
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
      timestamp: timestamp,
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
