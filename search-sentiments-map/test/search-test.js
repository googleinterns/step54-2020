const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
const search = require('./../routes/search').search;
const sentiment = require('./../routes/sentiment.js')
const {Datastore} = require('@google-cloud/datastore');
const fetch = require('node-fetch'); // Used to access custom search.

describe('Search', function() {
  describe('UpdateSearchResults', function() {
    let deleteAncientResultsStub;
    let getSearchResultsForCountriesForTopicStub;
    let sleepStub;
    let datastoreEntities;

    beforeEach(() => {
      let datastoreEntities = [];
      // Stubbing because it is tested separately.
      deleteAncientResultsStub = 
          sinon.stub(search, 'deleteAncientResults')
              .resolves('Not interested in the output');
      getSearchResultsForCountriesForTopicStub =
          sinon.stub(search, 'getSearchResultsForCountriesForTopic')
              .resolves('Not interested in the output');

      // Stubbing to avoid 1 minute wait
      sleepStub = 
          sinon.stub(search, 'sleep')
              .resolves('Not interested in the output');

      // Stubbing calls to datastore
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        trendsEntries = [{
          globalTrends: [
            {trendTopic: "trend1"},
            {trendTopic: "trend2"},
            {trendTopic: "trend3"},
          ]
        }];
        return [trendsEntries];
      });

      sinon.stub(Datastore.prototype, 'key').callsFake(() => {
        return 'fakeKey';
      });

      sinon.stub(Datastore.prototype, 'save').callsFake((entity) => {
        return datastoreEntities.push(entity);
      });
})

    afterEach(() => {
      sinon.restore();
    })

    it('should update search results for all global trends', async function() {
      await search.updateSearchResults();
      assert.equal(deleteAncientResultsStub.callCount, 1);
      assert.equal(sleepStub.callCount, 3);
      console.log(datastoreEntities);
    });
  });

  // describe('RetrieveSearchResultFromDatastore', function() {
  //   beforeEach(() => {
  //     sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
  //       results = [{
  //         topic: 'testTopic',
  //         timestamp: 0,
  //         dataByCountry: {},
  //       }];
  //       return [results];
  //     });
  //   });

  //   afterEach(() => {
  //     sinon.restore();
  //   });

  //   it('should return latest datastore data', async function() {
  //     const results = await search.retrieveSearchResultFromDatastore('testTopic');

  //     results.topic.should.equal('testTopic');
  //     results.timestamp.should.equal(0);
  //     expect(results.dataByCountry).to.be.empty;
  //   });
  // });


  describe('FormatCountryResults', function() {
    beforeEach(() => {
      // let getSentimentScoreStub = sinon.stub(sentiment, 'getSentimentScore');
      // getSentimentScoreStub.onCall(0).returns({score: 10});
      // getSentimentScoreStub.onCall(1).returns({score: 20});
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return -500 and no results if passed no country data', async function() {
      const results = await search.formatCountryResults({});
      assert.equal(results.score, -500);
      assert.isEmpty(results.results);
    });

    it('should return correctly formatted country results', async function() {
      const searchParameter = {
        items: 
            [{
              title: 'item1Title',
              snippet: 'item1Snippet',
              htmlSnippet: 'item1HtmlSnippet',
              link: 'item1Link',
            },
            {
              title: 'item2Title',
              snippet: 'item2Snippet',
              htmlSnippet: 'item2HtmlSnippet',
              link: 'item2Link',
            }],
      };

      const formattedResult1 = {
        title: 'item1Title',
        snippet: 'item1Snippet',
        htmlSnippet: 'item1HtmlSnippet',
        link: 'item1Link',
        score: 1000,
      };

      const formattedResult2 = {
        title: 'item2Title',
        snippet: 'item2Snippet',
        htmlSnippet: 'item2HtmlSnippet',
        link: 'item2Link',
        score: 2000,
      };

      // const results = await search.formatCountryResults(searchParameter);

      assert.equal(results.score, 1500);
      assert.equal(results.results[0], formattedResult1);
      assert.equal(results.results[1], formattedResult2);
    });
  });
});