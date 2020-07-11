/** Server-side script that uses the Google Cloud Natural Language API to get the sentiment score. */
const express = require('express');
var router = express.Router();  // Using Router to divide the app into modules.
var allSettled = require('promise.allsettled');
const language = require('@google-cloud/language');

var bodyParser = require('body-parser');
var textParser = bodyParser.text();

router.post('/', textParser, (req, res) => {
  console.log('Got body:' + req.body);
  getSentimentScore(req.body)
    .then((sentimentScore) => {
      response = {
        score: sentimentScore,
      };
      console.log('ntarn debug: score' + response.score);
      res.end(JSON.stringify(response));
    }).catch(err => {
      console.log(err);
    });
});

/** 
 *  Gets the sentiment score of an inputted search result title and snippet.
 *  @param {string} searchResultTitleSnippet The search result combined title and snippet.
 *  @return {number} The sentiment score of the combined title and snippet.
 *  TODO(ntarn): Export this method to use directly with search.js
 */
async function getSentimentScore(searchResultTitleSnippet) {
  try {
    // Instantiate a client.
    const client = new language.LanguageServiceClient();

    // The text to analyze.
    const text = searchResultTitleSnippet;

    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };

    // Detect the sentiment of the text.
    const [result] = await client.analyzeSentiment({ document: document });
    const sentiment = result.documentSentiment;

    // TODO(ntarn): Remove console.log statements when finished with feature. 
    console.log(`ntarn debug use api Text: ${text}`);
    console.log(`ntarn debug use api Sentiment score: ${sentiment.score}`);

    return sentiment.score;
  } catch (err) { // Occurs when the language is not supported for document sentiment analysis.
    console.error('ERROR:', err);
    return 0;
  }
}

module.exports.router = router;