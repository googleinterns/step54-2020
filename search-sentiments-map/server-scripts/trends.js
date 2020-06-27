// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/** Server-side script that gets data from the google-trends-api */

const googleTrends = require('google-trends-api');

/** Get a JSON object of today's top 20 search trends. */
var dailyTrendsJson, callback;
googleTrends.dailyTrends({
  trendDate: new Date(),
  geo: 'US',
}).then(function(results) {
  dailyTrendsJson = results;
  if(typeof callback == 'function'){
    callback(dailyTrendsJson);
  }
}).catch(function(err) {
  console.log(err);
});

// Export a callback assignation method to be called from app.js to get the daily trends.
// This makes sure that dailyTrendsJson is defined when sent to the client-side.
module.exports.dailyTrends = function(cb) {
  if(typeof dailyTrendsJson != 'undefined') {
    cb(dailyTrendsJson); // If dailyTrendsJson is already define, don't wait.
  } else {
    callback = cb;
  }
}
