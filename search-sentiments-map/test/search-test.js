const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
const search = require('./../routes/search').search;
const searchInterestsModule = require('./../routes/search-interests.js');
const sentiment = require('./../routes/sentiment.js');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
const fetch = require('node-fetch'); // Used to access custom search.

describe('Search', function() {
  describe('UpdateSearchResults', function() {
    let deleteAncientResultsStub;
    let getSearchResultsForCountriesForTopicStub;
    let sleepStub;
    let datastoreEntities;
    let globalTrends;

    beforeEach(() => {
      datastoreEntities = [];
      globalTrends = [
        {trendTopic: "trend1"},
        {trendTopic: "trend2"},
        {trendTopic: "trend3"},
      ];

      // Function is stubbed because it is tested separately.
      deleteAncientResultsStub = 
          sinon.stub(search, 'deleteAncientResults')
              .resolves('Not interested in the output');


      // Function is stubbed because it is tested separately.
      getSearchResultsForCountriesForTopicStub =
          sinon.stub(search, 'getSearchResultsForCountriesForTopic')
              .resolves('Not interested in the output');

      // Sleep function is stubbed to avoid 1 minute pauses.
      sleepStub = 
          sinon.stub(search, 'sleep')
              .resolves('Not interested in the output');

      // Calls to the datastore are stubbed.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        trendsEntries = [{
          globalTrends: globalTrends
        }];
        return [trendsEntries];
      });

      // Calls to the datastore are stubbed.
      sinon.stub(Datastore.prototype, 'key').callsFake(() => {
        return 'fakeKey';
      });

      // Calls to the datastore are stubbed.
      sinon.stub(Datastore.prototype, 'save').callsFake((entity) => {
        datastoreEntities.push(entity);
      });
    })

    afterEach(() => {
      sinon.restore();
    })

    it('should update search results for all global trends', async function() {
      await search.updateSearchResults();
      assert.equal(deleteAncientResultsStub.callCount, 1);
      assert.equal(sleepStub.callCount, globalTrends.length);
      for (let i = 0; i < datastoreEntities.length; i++) {
        assert.equal(datastoreEntities[i].key, 'fakeKey');
        assert.equal(datastoreEntities[i].data.topic,
            globalTrends[i].trendTopic);
        assert.equal(datastoreEntities[i].data.lowercaseTopic,
            globalTrends[i].trendTopic.toLowerCase());
      }
    });
  });

  describe('GetSearchResultsForCountriesForTopic', function() {
    beforeEach(() => {
      // Function is stubbed because it is tested separately.
      sinon.stub(search, 'formatCountryResults').callsFake((searchResults) => {
        let results = []
        searchResults.items.forEach(result => {
          results.push({
            title: result.title,
            snippet: result.snippet,
            htmlTitle: result.htmlTitle,
            link: result.link,
            score: 100,
          });
        });
        return Promise.resolve({
          score: 100,
          results: results,
        });
      });
              
      // Function is stubbed because it is tested separately.
      sinon.stub(searchInterestsModule, 'getGlobalSearchInterests').resolves([
        {
          geoCode: 'AU',
          value: [10],
        },
        {
          geoCode: 'US',
          value: [10],
        }
      ]);

      // Sleep function is stubbed to avoid 1 minute pauses.
      sleepStub = 
          sinon.stub(search, 'sleep').resolves('Not interested in the output');

      // Stub Custom Search API call.
      let json = {
        items: [
          {
            title: 'mockTitle',
            snippet: 'mockSnippet',
            htmlTitle: 'mockHtmlTitle',
            link: 'mockLink'
          }
        ]
      };

      let responseObject = {
        status: "200",
        json: () => {
          return json;
        }
      };

      sinon.stub(fetch, 'Promise').returns(Promise.resolve(responseObject));
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return latest datastore data', async function() {
      const results = await search.getSearchResultsForCountriesForTopic(['AU', 'US', 'GB'], 'testTopic');
      
      const formattedResult1 = {
        country: 'AU',
        results: [{
          title: 'mockTitle',
          snippet: 'mockSnippet',
          htmlTitle: 'mockHtmlTitle',
          link: 'mockLink',
          score: 100,
        }],
        averageSentiment: 100,
        interest: 10,
      };

      const formattedResult2 = {
        country: 'US',
        results: [{
          title: 'mockTitle',
          snippet: 'mockSnippet',
          htmlTitle: 'mockHtmlTitle',
          link: 'mockLink',
          score: 100,
        }],
        averageSentiment: 100,
        interest: 10,
      };

      const formattedResult3 = {
        country: 'GB',
        results: [{
          title: 'mockTitle',
          snippet: 'mockSnippet',
          htmlTitle: 'mockHtmlTitle',
          link: 'mockLink',
          score: 100,
        }],
        averageSentiment: 100,
        interest: -500, // Check situation of no interest score.
      };

      assert.deepEqual(results[0], formattedResult1);
      assert.deepEqual(results[1], formattedResult2);
      assert.deepEqual(results[2], formattedResult3);
    });
  });


  describe('FormatCountryResults', function() {
    beforeEach(() => {
      // Function is stubbed because it is tested separately.
      let getSentimentScoreStub = sinon.stub(sentiment, 'getSentimentScore');
      getSentimentScoreStub.onCall(0).resolves(10);
      getSentimentScoreStub.onCall(1).resolves(20);
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
              htmlTitle: 'item1HtmlTitle',
              link: 'item1Link',
            },
            {
              title: 'item2Title',
              snippet: 'item2Snippet',
              htmlTitle: 'item2HtmlTitle',
              link: 'item2Link',
            }],
      };

      const formattedResult1 = {
        title: 'item1Title',
        snippet: 'item1Snippet',
        htmlTitle: 'item1HtmlTitle',
        link: 'item1Link',
        score: 1000
      };

      const formattedResult2 = {
        title: 'item2Title',
        snippet: 'item2Snippet',
        htmlTitle: 'item2HtmlTitle',
        link: 'item2Link',
        score: 2000
      };

      const results = await search.formatCountryResults(searchParameter);
      assert.equal(results.score, 1500);
      assert.deepEqual(results.results[0], formattedResult1);
      assert.deepEqual(results.results[1], formattedResult2);
    });
  });

  describe('DeleteAncientResults', function() {
    let datastoreEntities;
    const STALE_DATA_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;

    beforeEach(() => {
      datastoreEntities = [{timestamp: 1593455070000}, {timestamp: 1593541470000}, {timestamp: Date.now()}];
      datastoreEntities[0][datastore.KEY] = datastore.key(['WorldDataByTopic', 0]);
      datastoreEntities[1][datastore.KEY] = datastore.key(['WorldDataByTopic', 1]);
      datastoreEntities[2][datastore.KEY] = datastore.key(['WorldDataByTopic', 2]);
      entitiesToDelete = [];

      // Calls to the datastore are stubbed.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [datastoreEntities];
      });

      // Calls to the datastore are stubbed.
      sinon.stub(Datastore.prototype, 'delete').callsFake((entity) => {
        entitiesToDelete.push(entity);
      });
    })

    afterEach(() => {
      sinon.restore();
    })

    it('should update search results for all global trends', async function() {
      await search.deleteAncientResults();
      entitiesToDelete.forEach((entity) => {
        datastoreEntities.splice(entity.id, 1);
      })
      assert.equal(datastoreEntities.length, 1);
      assert.isAbove(Date.now() - datastoreEntities[0].timestamp, STALE_DATA_THRESHOLD_7_DAYS_MS);
    });
  });
});