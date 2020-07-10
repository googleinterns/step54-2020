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
const trends = require('./trends.js');
const search = require('./search.js');

// Router that updates trends data.
// Scheduled to run at minute 0 past every 12th hour (11am and 23pm every day).
router.get('/', (req, res) => {
  console.log('Updating Search Results Data.');
  // trends.updateTrendsFunction(); Undo comment during final deploy.
  search.updateSearchResults();
});

module.exports.router = router;