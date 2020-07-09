/** Server-side script that uses the Google Cloud Natural Language API to get the sentiment score. */
const express = require('express');
var router = express.Router();  // Use a Router to divide the app into modules.
const language = require('@google-cloud/language');

var bodyParser = require('body-parser');  
// Create application/x-www-form-urlencoded parser.
var urlencodedParser = bodyParser.urlencoded({ extended: false })

/** Returns the sentiment score of inputted search results. */  
router.post('/', urlencodedParser, (req, res) => { 
  const searchTopic = req.body.searchTopic;
  console.log('ntarn debug: '+ searchTopic);
  getSentimentScore(searchTopic).then(score => {
    // Prepare output in JSON format.  
    response = {  
      sentimentScore:score,  
    };  
    // TODO(ntarn): Remove console.log statement when finished with feature. 
    console.log('ntarn debug: searchTopic score' + response.sentimentScore);  
    res.end(JSON.stringify(response));
  }).catch(err => {
    console.log(err);
  })
});

/** 
 * Analyzes the sentiment score for the search topic.
 * @param {string} searchTopic Search topic to get data for.
 * @return {double} Sentiment score for the search topic.
 */
async function getSentimentScore(searchTopic) {
  // Instantiate a client.
  const client = new language.LanguageServiceClient();

  const document = {
    content: searchTopic,
    type: 'PLAIN_TEXT',
  };

  // Detect the sentiment of the text.
  const [result] = await client.analyzeSentiment({document: document});
  const sentiment = result.documentSentiment;

  // TODO(ntarn): Remove console.log statements when finished with feature. 
  console.log(`ntarn debug use api Text: ${text}`);
  console.log(`ntarn debug use api Sentiment score: ${sentiment.score}`);
  console.log(`ntarn debug use api Sentiment magnitude: ${sentiment.magnitude}`);

  return sentiment.score;
}

module.exports = router;