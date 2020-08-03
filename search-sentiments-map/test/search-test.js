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
  describe('RetrieveSearchResultFromDatastore', function() {
    let mockData;
    beforeEach(() => {
      mockData = {
        topic: 'testTopic',
        timestamp: 0,
        dataByCountry: 'dataByCountry',
      };

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [[mockData]];
      });      
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should retrieve the results from the datastore', async function() {
      let results =
          await search.retrieveSearchResultFromDatastore('topic', 'timestamp');
      assert.deepEqual(results, mockData);
    });
  });

  describe('RetrieveUserSearchResultFromDatastore', function() {
    let mockData;
    let datastoreEntities;

    beforeEach(() => {
      mockData = [
      {
        topic: 'testTopic',
        timestamp: Date.now(),
        dataByCountry: [
          {
            country: 'AU',
          },
          {
            country: 'US',
          }
        ],
      },
      {
        topic: 'oldTestTopic',
        timestamp: 1593455070000, // June 29, 2020. Older than 12 hours old.
        dataByCountry: [
          {
            country: 'AU',
          },
          {
            country: 'US',
          }
        ],
      }];

      datastoreEntities = [];

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake((query) => {
        let dataToReturn  = 
            mockData.filter(data => data.topic.toLowerCase() === query.filters[0].val);
        return [dataToReturn];
      });

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'key').callsFake(() => {
        return 'fakeKey';
      });

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'save').callsFake((entity) => {
        datastoreEntities.push(entity);
      });

      // Stub the `getSearchResultsForCountriesForTopic` function for this
      // test since it is tested separately.
      sinon.stub(search, 'getSearchResultsForCountriesForTopic').callsFake(
          (countries, topic) => {
            let data = [];
            countries.forEach(country => {
              data.push({country: country});
            })
            return Promise.resolve(data);
          });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should retrieve search data if current data exists', async function() {
      let results =
          await search.retrieveUserSearchResultFromDatastore(
              'testTopic', ['AU', 'US']);
      assert.deepEqual(results, mockData[0]);
    });

    it('should fetch data from the API, save it to the datastore and return it if no current data exists',
        async function() {
          let mockCountryData = [
            {
              country: 'AU',
            },
            {
              country: 'US',
            }
          ];
          let results =
              await search.retrieveUserSearchResultFromDatastore(
                  'oldTestTopic', ['AU', 'US']);

          // Check correct data is returned.
          assert.equal(results.topic, 'oldTestTopic');
          assert.isAbove(results.timestamp, Date.now() - 60000);
          assert.deepEqual(results.dataByCountry, mockCountryData);

          // Check data is correctly saved to datastore.
          assert.equal(datastoreEntities[0].data.topic, 'oldTestTopic');
          assert.isAbove(datastoreEntities[0].data.timestamp, Date.now() - 60000);
          assert.deepEqual(datastoreEntities[0].data.dataByCountry, mockCountryData);
        });

    it('should fetch missing data from the API, save it to the datastore and return all relevant data if some country data is missing',
        async function() {
          let mockCountryData = [
            {
              country: 'AU',
            },
            {
              country: 'US',
            },
            {
              country: 'GB',
            },
            {
              country: 'KZ',
            }
          ];
          let results =
              await search.retrieveUserSearchResultFromDatastore(
                  'testTopic', ['GB', 'KZ', 'US']);
              
          // Check correct data is returned.
          assert.equal(results.topic, 'testTopic');
          assert.equal(results.timestamp, mockData[0].timestamp);
          // The results should only include the requested countries.
          assert.deepEqual(results.dataByCountry, mockCountryData.slice(1,4));

          // Check data is correctly saved to datastore.
          assert.equal(datastoreEntities[0].topic, 'testTopic');
          assert.equal(datastoreEntities[0].timestamp, mockData[0].timestamp);
          assert.deepEqual(datastoreEntities[0].dataByCountry, mockCountryData);
        });

    it('should fetch data from the API, save it to the datastore, and return it if no data exists',
        async function() {
          let mockCountryData = [
            {
              country: 'AU',
            },
            {
              country: 'US',
            }
          ];
          let results =
              await search.retrieveUserSearchResultFromDatastore(
                  'newTestTopic', ['AU', 'US']);

          // Check correct data is returned.
          assert.equal(results.topic, 'newTestTopic');
          assert.isAbove(results.timestamp, Date.now() - 60000);
          assert.deepEqual(results.dataByCountry, mockCountryData);

          // Check data is correctly saved to datastore.
          assert.equal(datastoreEntities[0].data.topic, 'newTestTopic');
          assert.isAbove(datastoreEntities[0].data.timestamp, Date.now() - 60000);
          assert.deepEqual(datastoreEntities[0].data.dataByCountry, mockCountryData);
        });
  });

  describe('UpdateSearchResults', function() {
    let deleteAncientResultsStub;
    let getSearchResultsForCountriesForTopicStub;
    let sleepStub;
    let datastoreEntities;
    let globalTrendsList;

    beforeEach(() => {
      datastoreEntities = [];
      globalTrendsList = [
        {trendTopic: "trend1"},
        {trendTopic: "trend2"},
        {trendTopic: "trend3"},
      ];

      // Stub the `deleteAncientResults` function for this test since it is
      // tested separately.
      deleteAncientResultsStub = 
          sinon.stub(search, 'deleteAncientResults')
              .resolves('Not interested in the output');

      // Stub the `getSearchResultsForCountriesForTopic` function for this
      // test since it is tested separately.
      getSearchResultsForCountriesForTopicStub =
          sinon.stub(search, 'getSearchResultsForCountriesForTopic')
              .resolves('Not interested in the output');

      // Stub the `sleep` function for this test to avoid 1 minute pauses.
      sleepStub = 
          sinon.stub(search, 'sleep')
              .resolves('Not interested in the output');

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        trendsEntries = [{
          globalTrends: globalTrendsList
        }];
        return [trendsEntries];
      });

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'key').callsFake(() => {
        return 'fakeKey';
      });

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'save').callsFake((entity) => {
        datastoreEntities.push(entity);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should update search results for all global trends', async function() {
      await search.updateSearchResults();
      assert.equal(deleteAncientResultsStub.callCount, 1);
      assert.equal(sleepStub.callCount, globalTrendsList.length);
      for (let i = 0; i < datastoreEntities.length; i++) {
        assert.equal(datastoreEntities[i].key, 'fakeKey');
        assert.equal(datastoreEntities[i].data.topic,
            globalTrendsList[i].trendTopic);
        assert.equal(datastoreEntities[i].data.lowercaseTopic,
            globalTrendsList[i].trendTopic.toLowerCase());
      }
    });
  });

  describe('GetSearchResultsForCountriesForTopic', function() {
    let mockSearchResultData;

    beforeEach(() => {
      // Stub the `formatCountryResults` function for this test since it is
      // tested separately.
      sinon.stub(search, 'formatCountryResults').callsFake((searchResults) => {
        mockSearchResultData ={
          title: 'mockTitle',
          snippet: 'mockSnippet',
          htmlTitle: 'mockHtmlTitle',
          link: 'mockLink',
          score: 100,
        };

        let results = [];
        searchResults.items.forEach(result => {
          results.push(mockSearchResultData);
        });
        return Promise.resolve({
          score: 100,
          results: results,
        });
      });
              
      // Stub the `getGlobalSearchInterests` function for this test since it is
      // tested separately.
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

      // Stub the `sleep` function for this test to avoid 1 minute pauses.
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

    it('should return latest datastore data for a country', async function() {
      const results =
          await search.getSearchResultsForCountriesForTopic(
              ['AU', 'US', 'GB'], 'testTopic');
      
      const formattedResult1 = {
        country: 'AU',
        results: [mockSearchResultData],
        averageSentiment: 100,
        interest: 10,
      };

      const formattedResult2 = {
        country: 'US',
        results: [mockSearchResultData],
        averageSentiment: 100,
        interest: 10,
      };

      const formattedResult3 = {
        country: 'GB',
        results: [mockSearchResultData],
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
      // Stub the `getSentimentScore` function for this test since it is
      // tested separately.
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
        score: 1000,
      };

      const formattedResult2 = {
        title: 'item2Title',
        snippet: 'item2Snippet',
        htmlTitle: 'item2HtmlTitle',
        link: 'item2Link',
        score: 2000,
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
      datastoreEntities = [
        // June 29 2020. Older than the Threshold.
          {timestamp: 1593455070000},
        // June 30 2020. Older than the Threshold.
          {timestamp: 1593541470000},
          {timestamp: Date.now()}
      ];
      datastoreEntities[0][datastore.KEY] =
          datastore.key(['WorldDataByTopic', 0]);
      datastoreEntities[1][datastore.KEY] =
          datastore.key(['WorldDataByTopic', 1]);
      datastoreEntities[2][datastore.KEY] =
          datastore.key(['WorldDataByTopic', 2]);
      entitiesToDelete = [];

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [datastoreEntities];
      });

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'delete').callsFake((entity) => {
        entitiesToDelete.push(entity);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should delete old datastore entities', async function() {
      await search.deleteAncientResults();
      // Need to delete separately to avoid for loop skips.
      entitiesToDelete.forEach((entity) => {
        datastoreEntities.splice(entity.id, 1);
      })

      assert.equal(datastoreEntities.length, 1);
      assert.isAbove(Date.now() - datastoreEntities[0].timestamp,
          STALE_DATA_THRESHOLD_7_DAYS_MS);
    });
  });
});