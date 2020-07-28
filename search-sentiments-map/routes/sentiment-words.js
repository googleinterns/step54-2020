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

/** 
 * Server-side script that uses the Node.js Sentiment module to get words that are 
 * marked as negative or positive using the AFINN-165 wordlist.
 */
const express = require('express');
const router = express.Router();  // Using Router to divide the app into modules.
const sentimentApi = require('sentiment');
var sentimentWords = new sentimentApi(); 
router.get('/:titleSnippet', (req, res) => {
  let titleSnippet = req.params.titleSnippet;
  getPositiveNegativeWords(titleSnippet).then(sentimentWordsJsonArray => {
    res.setHeader('Content-Type', 'application/json');
    res.send(sentimentWordsJsonArray);
  });
});

async function getPositiveNegativeWords(titleSnippet) {
  try {
    var result = await sentimentWords.analyze(titleSnippet);
    return result;
  } catch (err) {
    console.log(err);
  }
}

module.exports.router = router;
module.exports.getPositiveNegativeWords = getPositiveNegativeWords;
