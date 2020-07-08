/** Server-side script that uses the Google Cloud Natural Language API to get the sentiment score. */

const express = require('express');
var router = express.Router();  // Using Router to divide the app into modules.
var allSettled = require('promise.allsettled');
const language = require('@google-cloud/language');

var bodyParser = require('body-parser');  
var jsonParser = bodyParser.json();
var textParser = bodyParser.text();
// router.post('/', jsonParser, (req, res) => { 
//   console.log('Got body:'+ req.body[0]);
//   console.log('Got body:'+ req.body[0].title);
//   console.log('Got body:'+ req.body[0].snippet);

//   var sentimentScorePromises = [];
//   var avg = 0;
//   for (let i = 0; i < req.body.length; i++) {
//     let titleSnippetCombined = req.body[i].title + req.body[i].snippet;
//     sentimentScorePromises.push(quickstart(titleSnippetCombined) //an array of Promise objects
//       // .then(score => score.value)
//       .catch(err => {
//         console.log(err);
//       }));
//   }
  
  // allSettled(sentimentScorePromises).
  //   then((results) => {
  //     var sentimentScores = [];
  //     results.forEach((result) => {
  //       //result.then((score) => {
  //         avg = avg + result.value;
  //         console.log('ntarn debug: after' + result.value);
  //         sentimentScores.push(result.value);
  //       //});
  //     });
  //     //avg = results.reduce((a, b) => a + b, 0)
  //     avg = avg/req.body.length;
  //     // Prepare output in JSON format.  
  //     response = {  
  //       sentimentScoreArray:sentimentScores,  
  //       average:avg,
  //     };  
  //     console.log('ntarn debug: array ' + response.sentimentScoreArray);  
  //     console.log('ntarn debug: avg' + response.average);  
  //     res.end(JSON.stringify(response));
  //   }).catch(err => {
  //     console.log(err);
  //   })
  
// });

router.post('/', textParser, (req, res) => { 
  console.log('Got body:'+ req.body);
  quickstart(req.body)
    .then((sentimentScore) => {
      response = {  
        score: sentimentScore,  
      };  
      console.log('ntarn debug: score' + response.average); 
      res.end(JSON.stringify(response)); 
    }).catch(err => {
      console.log(err);
    });
});


async function quickstart(searchTopic) {
  // Instantiate a client.
  const client = new language.LanguageServiceClient();

  // The text to analyze.
  const text = searchTopic;

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detect the sentiment of the text.
  const [result] = await client.analyzeSentiment({document: document});
  const sentiment = result.documentSentiment;

  console.log(`ntarn debug use api Text: ${text}`);
  console.log(`ntarn debug use api Sentiment score: ${sentiment.score}`);
  // console.log(`ntarn debug use api Sentiment magnitude: ${sentiment.magnitude}`);

  return sentiment.score;
}

module.exports.router = router;