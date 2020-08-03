const mocha = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
const trends = require('./../routes/trends').trends;

describe('Sentiment', function() {
  describe('getGlobalTrends', function() {
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
          await trends.getGlobalTrends('Enjoy your vacation!');
      trendsByCountry = [{
      country: US,
      trends: [{
        topic: Donald Trump,
        traffic: 200K+,
        exploreLink: '/trends/explore?q=Donald+Trump&date=now+7-d&geo=US',
        articles: [{title: title1, url: url1}, ...],
      }],
      }, {
      country: UK,
      trends: [..., ...],
    }, ...],
      assert.deepEqual(result, mockScore);
    });
  });
});