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
// Listen to the App Engine-specified port, or 3000 otherwise.
const PORT = process.env.PORT || 4503;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

// Use express to create server that displays the webpage with the html, css, and javascript
// files in the public folder.
app.use(express.static(__dirname +'/public'));
app.get('/', (req, res) => {
  res.sendFile('/index.html');
});

// Include the sentiment module so that it can be fetched from the client-side scripts.
const sentiment = require('./routes/sentiment.js');
app.use('/sentiment', sentiment);

// Include the trends module so that it can be fetched from the client-side scripts.
const trends = require('./routes/trends.js');
app.use('/trends', trends);