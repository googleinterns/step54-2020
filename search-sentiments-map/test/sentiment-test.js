const mocha = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
const sentiment = require('./../routes/sentiment').sentiment;
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();
describe('Sentiment', function() {
  describe('getSentimentScore', function() {
    let mockSentimentScore;
    let analyzeSentimentStub;
    let mockAnalyzeSentimentResult;
    
    beforeEach(() => {
      mockScore = 0.8;
      mockAnalyzeSentimentResult = {
        'documentSentiment': {
          'magnitude': 0.8,
          'score': 0.8
        },
        'language': 'en',
        'sentences': [
          {
            'text': {
              'content': 'Enjoy your vacation!',
              'beginOffset': 0
            },
            'sentiment': {
              'magnitude': 0.8,
              'score': 0.8
            }
          }
        ]
      };
      // Function is stubbed because it is an API method.
      sinon.stub(client, 'analyzeSentiment').callsFake(() => {
        console.log(result.documentSentiment.score);
        return mockAnalyzeSentimentResult;
      });
    })

    afterEach(() => {
      sinon.restore();
    })

    it('should get the sentiment score from analyzeSentiment', async function() {
      let result =
          await sentiment.getSentimentScore('Enjoy your vacation!');
      assert.deepEqual(result, mockScore);
    });
  });
});