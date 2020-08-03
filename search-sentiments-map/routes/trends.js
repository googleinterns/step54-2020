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

/** Server-side script that gets data from the google-trends-api. */

const express = require('express');
const router = express.Router();  // Using Router to divide the app into modules.

const googleTrends = require('google-trends-api');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const TRENDS_DATA_KIND = 'TrendsEntry';
const STALE_DATA_DAYS_THRESHOLD = 7;
// Constant for getting popularity data from 8 days ago.
const POPULARITY_DATA_DAYS_THRESHOLD = 8;
const ONE_DAY_MS = 24 * 60 * 60000;
const RETRIEVE_RESULTS_TIME_MS = 70 * 60000;
// Time interval between data updates.
const CURRENT_DATA_TIME_RANGE_12_HOURS_MS = 12 * 60 * 60000;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

/** 
 * Renders a JSON array of the top 20 (or fewer) global search trends maintained
 * for the specfied 12-hour range.
 */
router.get('/:timeRange', (req, res) => {
  let timeRange = parseInt(req.params.timeRange);
  retrieveGlobalTrendsForTimeRange(timeRange).then(globalTrends => {
    res.setHeader('Content-Type', 'application/json');
    res.send(globalTrends);
  });
});

/** Renders the popularity data of the country given by the request parameter. */
router.post('/', jsonParser, (req, res) => {
  googleTrends.interestOverTime({
    keyword: req.body.topic,
    startTime: new Date(Date.now() - POPULARITY_DATA_DAYS_THRESHOLD * ONE_DAY_MS),
    geo: req.body.code,
  }).then(data => {
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  }).catch(err => {
    console.error(err);
  });
});

/** 
 * Get the global trends from the most recent Datastore entry.
 * @param {number} timeRange An integer representing how many time ranges 
 *     previous to get data from.
 * @return {!Array<JSON>} A JSON array of global trends and their originating
 *     countries.
 */
async function retrieveGlobalTrendsForTimeRange(timeRange) {
  let timeRangeLimit = CURRENT_DATA_TIME_RANGE_12_HOURS_MS * timeRange;
  const query = datastore.createQuery(TRENDS_DATA_KIND).order('timestamp', {
    descending: true,
  }).filter('timestamp', '<', Date.now() - timeRangeLimit).limit(2);
  const [trendsEntry] = await datastore.runQuery(query);
  return {
    timestamp: trendsEntry[0].timestamp,
    // Returns the most recent trends with search results data retrieved.
    globalTrends: 
        (Date.now() - trendsEntry[0].timestamp > 
            RETRIEVE_RESULTS_TIME_MS + timeRangeLimit) ?
                trendsEntry[0].globalTrends : trendsEntry[1].globalTrends,
  }
}

/** 
 * Updates Datastore storage of daily search trends and corresponding search
 * results for the countries where trends are available using the Google Trends
 * API.
 */
async function updateDailyTrends() {
  const countryJson = require('./../public/countries-with-trends.json');

  let trendsByCountry = [];
  for (let i = 0; i < countryJson.length; i++) {
    let country = countryJson[i];
    await googleTrends.dailyTrends({
      trendDate: new Date(),
      geo: country.id,
    }).then(dailyTrendsJsonString => {
      // Parse the JSON string and get the trending topics.
      trendingSearches = JSON.parse(dailyTrendsJsonString)
          .default.trendingSearchesDays[0].trendingSearches;
      trendsByCountry.push(constructCountryTrendsJson(trendingSearches, country.id));
    }).catch(err => {
      console.log(err);
    });
  }

  saveTrendsAndDeletePrevious(trendsByCountry);
}

/** 
 * Creates a JSON item for trends in the given country.
 * @param {?Array<JSON>} trendingSearches The JSON array containing the top trends 
 *     of the given country.
 * @param {string} countryCode The two-letter code for the country considered.
 * @return {Object<JSON>} A JSON object that includes a country's code and its 
 *     top trends.
 */
function constructCountryTrendsJson(trendingSearches, countryCode) {
  let trends = [];
  trendingSearches.forEach(trend => {
    let articlesFormatted = [];
    trend.articles.forEach(article => {
      articlesFormatted.push({
        title: article.title,
        url: article.url,
      });
    })
    trends.push({
      topic: trend.title.query,
      traffic: trend.formattedTraffic,
      // Note: Can explore the topic by appending the explore link to 
      // 'https://trends.google.com/trends'.
      exploreLink: trend.title.exploreLink,
      articles: articlesFormatted,
    });
  })

  return {
    country: countryCode,
    trends: trends,
  }
}

/**
 * Deletes previous trends and saves the current trends in a `trendsEntry` entity
 * in the Datastore, given the trends JSON organized by country.
 * Example data structure for a `trendsEntry`:
 * {timestamp: 111111111,
    trendsByCountry: [{
      country: US,
      trends: [{
        topic: Donald Trump,
        traffic: 200K+,
        exploreLink: '/trends/explore?q=Donald+Trump&date=now+7-d&geo=US',
        articles: [{title: title1, url: url1}, ...],
      }, ...],
    }, {
      country: UK,
      trends: [..., ...],
    }, ...],
    globalTrends: [{
      trendTopic: X,
      count: 5,
    }, ...],
   }
 * @param {!Array<JSON>} trendsByCountry An array where each element is a country
 *     and its trends.
 */
async function saveTrendsAndDeletePrevious(trendsByCountry) {
  await deleteAncientTrend();

  const trendsEntryKey = datastore.key(TRENDS_DATA_KIND);
  const trendsEntry = {
    key: trendsEntryKey,
    data: {
      timestamp: Date.now(),
      trendsByCountry: trendsByCountry,
      globalTrends: getGlobalTrends(trendsByCountry),
    },
  };

  try {
    await datastore.save(trendsEntry);
    console.log(`TrendsEntry ${trendsEntryKey.id} created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

/** Deletes the oldest trend record if it was saved more than 7 days ago. */
async function deleteAncientTrend() {
  // Query entries in ascending order of the time of creation.
  const query = datastore.createQuery(TRENDS_DATA_KIND).order('timestamp');
  const [trendsEntries] = await datastore.runQuery(query);

  if (trendsEntries.length === 0) {
    return;  // Nothing to delete.
  }
  if (Date.now() - trendsEntries[0].timestamp > 
      STALE_DATA_DAYS_THRESHOLD * ONE_DAY_MS) {
    const trendsEntryKey = trendsEntries[0][datastore.KEY];
    await datastore.delete(trendsEntryKey);
    console.log(`TrendsEntry ${trendsEntryKey.id} deleted.`);
  }
}

/** 
 * Finds the trending topics that appear the most across all recorded countries 
 * and gets the top globally trending topics.
 * @param {!Array<JSON>} trendsByCountry An array where each element is a country
 *     and its trends.
 * @return {!Array<JSON>} Globally trending topics and the number of countries 
 *     where they are trending.
 */
function getGlobalTrends(trendsByCountry) {
  // Use a map to count the number of occurences of each trend.
  let trendCountsMap = new Map();
  trendsByCountry.forEach(countryTrends => {
    countryTrends.trends.forEach(trend => {
      let topic = trend.topic;
      if (trendCountsMap.has(topic)) {
        let newCount = trendCountsMap.get(topic) + 1;
        trendCountsMap.set(topic, newCount);
      } else {
        trendCountsMap.set(topic, 1)
      }
    });
  });

  // TODO(chenyuz): Could we use only one data structure here? 
  // One option is to install the npm SortedMap module.

  // Convert the counts to an array to allow sorting.
  let trendCountsArr = [];
  for (let [topic, count] of trendCountsMap) {
    trendCountsArr.push({
      topic: topic,
      count: count,
    })
  }
  // Sort trends in descending order of their counts.
  trendCountsArr.sort((trend, otherTrend) => {
    return otherTrend.count - trend.count;
  })

  let globalTrends = [];
  // Get the top 10 trends overall.
  for (let i = 0; i < 10; i++) {
    globalTrends.push({
      trendTopic: trendCountsArr[i].topic,
      count: trendCountsArr[i].count,
    });
  }
  return globalTrends;
}

// Necessary for unit testing.
const trends = {
  getGlobalTrends,
}
module.exports.trends = trends;
module.exports.router = router;
module.exports.updateTrendsFunction = updateDailyTrends;