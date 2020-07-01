
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

/** Server-side script that gets data from the google-trends-api. */

const express = require('express');
var router = express.Router();  // Using Router to divide the app into modules.

const googleTrends = require('google-trends-api');

/** Render a JSON string of the top 20 (or fewer) search trends of the past 24 hours. */
router.get('/', (req, res) => {
  googleTrends.dailyTrends({
    trendDate: new Date(),
    geo: 'US',
  }).then(dailyTrendsJson => {
    res.setHeader('Content-Type', 'application/json');
    res.send(dailyTrendsJson);
  }).catch(err => {
    console.log(err);
  });
});

module.exports = router;