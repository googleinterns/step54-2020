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
const countryTrends = require('./routes/country-trends.js');
const search = require('./routes/search.js');
const searchInterests = require('./routes/search-interests.js');
const sentimentWords = require('./routes/sentiment-words.js');
const trends = require('./routes/trends.js');
const updateData = require('./routes/update-data.js');

// Use express to create server that displays the webpage with the html, css, 
// and javascript files in the public folder.
app.use(express.static('./public'));
app.get('/', (req, res) => {
  res.sendFile('/index.html');
});

// Use the trends, search, and sentiment routers so that they can be fetched from the
// client-side scripts.
app.use('/country-trends', countryTrends.router);
app.use('/search', search.router);
app.use('/search-interests', searchInterests.router);
app.use('/sentiment-words', sentimentWords.router);
app.use('/trends', trends.router);
app.use('/update-data', updateData.router);

// Listen to the App Engine-specified port, or 4503 otherwise.
const PORT = process.env.PORT || 4503;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});