/** Server-side script that uses Google Cloud Natural Language API to get sentiment score. */

const express = require('express');
var router = express.Router();  // Using Router to divide the app into modules.
const language = require('@google-cloud/language');

var bodyParser = require('body-parser');  
// Create application/x-www-form-urlencoded parser  
var urlencodedParser = bodyParser.urlencoded({ extended: false })  
router.post('/', urlencodedParser, function (req, res) { 
  //  const searchTopic = document.getElementById('search-topic').value;
  console.log('ntarn blablalba');
  const score = quickstart()
  // Prepare output in JSON format  
  response = {  
    sentimentScore:score,  
  };  
  console.log('ntarn debug: hardcoded number' + response);  
  res.end(JSON.stringify(response));  
})



async function quickstart() {
  
  // Instantiates a client
  const client = new language.LanguageServiceClient();

  // The text to analyze
  const text = 'Hello, world!';

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects the sentiment of the text
  const [result] = await client.analyzeSentiment({document: document});
  const sentiment = result.documentSentiment;

  console.log(`Text: ${text}`);
  console.log(`Sentiment score: ${sentiment.score}`);
  console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

  return score;
}

module.exports = router;