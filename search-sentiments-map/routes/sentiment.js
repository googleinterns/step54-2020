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
const language = require('@google-cloud/language');

/** 
 *  Gets the sentiment score of a given search result title and snippet.
 *  @param {string} searchResultTitleSnippet The concatenated title and snippet
 *      of the search result.
 *  @return {number} The sentiment score of the combined title and snippet.
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
    return sentiment.score;
  } catch (err) {
    // Occurs when the language is not supported for document sentiment
    // analysis.
    console.error('ERROR:', err);
    return 0;
  }
}
const sentiment = {
  getSentimentScore,
}
module.exports.search = sentiment;
module.exports.getSentimentScore = getSentimentScore;