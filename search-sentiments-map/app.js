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
const app = express();
const schedule = require('node-schedule');
const trends = require('./routes/trends.js');
const countryTrends = require('./routes/country-trends.js');
const search = require('./routes/search.js');

// Use express to create server that displays the webpage with the html, css, 
// and javascript files in the public folder.
app.use(express.static('./public'));
app.get('/', (req, res) => {
  res.sendFile('/index.html');
});

// Use the trends and search routers so that they can be fetched from the
// client-side scripts.
app.use('/trends', trends.router);
app.use('/search', search.router);
app.use('/country-trends', countryTrends.router);

// Uncomment the following line to get trends if none are in the Datastore.
// trends.updateTrendsFunction();

// Update top trends at minute 0 past every 12th hour (11am and 23pm every day).
var j = schedule.scheduleJob('0 11,23 * * *', function(){
  trends.updateTrendsFunction();
});

// Schedule the function that updates search to be run  at midnight and noon
// everyday.
var searchResultUpdateSchedule = schedule.scheduleJob('0 0,12 * * *', function(){
// Commented out this line for now to avoid excess billing. Already tested.
// Uncomment out when ready to do final deploy.
  //  search.updateSearchResults();
});

// Listen to the App Engine-specified port, or 4503 otherwise.
const PORT = process.env.PORT || 4503;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
