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

/** 
 * Server-side script that uses the Google Cloud Natural Language API to get 
 * the sentiment score. 
 */
const express = require('express');
var router = express.Router();  // Using Router to divide the app into modules.
var allSettled = require('promise.allsettled');
const language = require('@google-cloud/language');

var bodyParser = require('body-parser');
var textParser = bodyParser.text();

router.post('/', textParser, (req, res) => {
  getSentimentScore(req.body).then((sentimentScore) => {
    response = {
      score: sentimentScore,
    };
    res.end(JSON.stringify(response));
  }).catch(err => {
    console.log(err);
  });
});

/** 
 *  Gets the sentiment score of a given search result title and snippet.
 *  @param {string} searchResultTitleSnippet The concatenated title and snippet
 *      of the search result.
 *  @return {number} The sentiment score of the combined title and snippet.
 *  TODO(ntarn): Export this method to use directly with search.js
 */
async function getSentimentScore(searchResultTitleSnippet) {
  try {
    const client = new language.LanguageServiceClient();
    const text = searchResultTitleSnippet;

    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };

    // Detect the sentiment of the text.
    const [result] = await client.analyzeSentiment({ document: document });
    const sentiment = result.documentSentiment;
    return sentiment.score;
  } catch (err) {
    // Occurs when the language is not supported for document sentiment
    // analysis.
    console.error('ERROR:', err);
    return 0;
  }
}

module.exports.router = router;