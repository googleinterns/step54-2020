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

const googleTrends = require('google-trends-api');
const POPULARITY_TIMERANGE_7_DAYS_MS = 7 * 24 * 60 * 60000;

/** 
 * Calls the API to get the popularity of the given topic in countries across
 * the world during the past 7 days. Values are on a scale from 0 to 100,
 * where 100 is the location with the most popularity.
 * @param {string} topic The topic to get interest scores on.
 * @return {Array<JSON>} An array of popularity values for each country.
 */
async function getGlobalSearchInterests(topic) {
  let interestByRegion;
  await googleTrends.interestByRegion({
    keyword: topic,
    startTime: new Date(Date.now() - POPULARITY_TIMERANGE_7_DAYS_MS),
    resolution: 'COUNTRY',
  }).then((res) => {
    interestByRegion = JSON.parse(res).default.geoMapData;
  }).catch((err) => {
    console.log(err);
  })
  return interestByRegion;
}

module.exports.getGlobalSearchInterests = getGlobalSearchInterests;