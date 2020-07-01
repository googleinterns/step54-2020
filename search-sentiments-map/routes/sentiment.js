/** Server-side script that uses Google Cloud Natural Language API to get sentiment score. */

const express = require('express');
var router = express.Router();  // Using Router to divide the app into modules.
const language = require('@google-cloud/language');

var bodyParser = require('body-parser');  
// Create application/x-www-form-urlencoded parser  
var urlencodedParser = bodyParser.urlencoded({ extended: false })  
router.post('/', urlencodedParser, (req, res) => { 
  const searchTopic = req.body.searchTopic;
  console.log('ntarn debug: '+ searchTopic);
  quickstart(searchTopic).then(score => {
    // Prepare output in JSON format  
    response = {  
      sentimentScore:score,  
    };  
    console.log('ntarn debug: searchTopic score' + response.sentimentScore);  
    res.end(JSON.stringify(response));
  }).catch(err => {
    console.log(err);
  })
});

async function quickstart(searchTopic) {
  // Instantiates a client
  const client = new language.LanguageServiceClient();

  // The text to analyze
  const text = searchTopic;

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects the sentiment of the text
  const [result] = await client.analyzeSentiment({document: document});
  const sentiment = result.documentSentiment;

  console.log(`ntarn debug use api Text: ${text}`);
  console.log(`ntarn debug use api Sentiment score: ${sentiment.score}`);
  console.log(`ntarn debug use api Sentiment magnitude: ${sentiment.magnitude}`);

  return sentiment.score;
}

module.exports = router;