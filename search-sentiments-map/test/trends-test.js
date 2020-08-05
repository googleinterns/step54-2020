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
const trends = require('./../routes/trends').trends;
const googleTrends = require('google-trends-api');
const {Datastore} = require('@google-cloud/datastore');

describe('Trends', function() {
  describe('RetrieveGlobalTrendsForTimeRange', function() {
    const RETRIEVE_RESULTS_TIME_MS = 70 * 60000;
    const CURRENT_DATA_TIME_RANGE_12_HOURS_MS = 12 * 60 * 60000;
    const TIME_RANGE_1_HALF_MS = CURRENT_DATA_TIME_RANGE_12_HOURS_MS * 1.5;
    const TIME_RANGE_3_MS = CURRENT_DATA_TIME_RANGE_12_HOURS_MS * 3;
    let mockResult3;
    let mockResult1half;
    let mockTrendsEntries;
    let currentTime;

    beforeEach(() => {
      currentTime = Date.now();
      mockTrendsEntries = [{
        timestamp: currentTime - TIME_RANGE_1_HALF_MS,
        trendsByCountry: 'trendsByCountry1.5',
        globalTrends: 'globalTrends1.5',
      }, {
        timestamp: currentTime - TIME_RANGE_3_MS,
        trendsByCountry: 'trendsByCountry3',
        globalTrends: 'globalTrends3',
      }];

      mockResult1half = {
        timestamp: currentTime - TIME_RANGE_1_HALF_MS,
        globalTrends: 'globalTrends1.5',
      };
      mockResult3 = {
        timestamp: currentTime - TIME_RANGE_3_MS,
        globalTrends: 'globalTrends3',
      }

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [mockTrendsEntries];
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should retrieve the most recent datastore entry beyond RETRIEVE_RESULTS_TIME_MS',
        async function() {
      let results = await trends.retrieveGlobalTrendsForTimeRange(0);
      assert.deepEqual(results, mockResult1half);
    });

    it('should retrieve the most recent datastore entry given beyond the given time range', 
        async function() {
      let results = await trends.retrieveGlobalTrendsForTimeRange(2);
      assert.deepEqual(results, mockResult3);
    });
  });

  describe('UpdateDailyTrends', function() {
    let mockDailyTrendsData;
    let mockTrendsByCountry;
    let datastoreEntities;
    const countryJson = require('./../public/countries-with-trends.json');

    beforeEach(() => {
      datastoreEntities = [];

      let mockTrendingSearches = [
        {
          'title': {
            'query': 'topic1',
            'exploreLink': 'exploreLink1',
          },
          'formattedTraffic': '200K+',
          'articles': [
            {
              'title': 'article1',
              'url': 'url1',
            }, {
              'title': 'article2',
              'url': 'url2',
            }
          ],
        }
      ];
      mockDailyTrendsData = JSON.stringify({
        'default': {
          'trendingSearchesDays': [
            {
              'trendingSearches': mockTrendingSearches,
            }
          ],
        },
      });

      mockTrendsByCountry = [];
      for (let i = 0; i < countryJson.length; i++) {
        mockTrendsByCountry.push({
          country: countryJson[i].id,
          trends: [
            {
              topic: 'topic1',
              traffic: '200K+',
              exploreLink: 'exploreLink1',
              articles: [
                {
                  title: 'article1',
                  url: 'url1',
                }, {
                  title: 'article2',
                  url: 'url2',
                }
              ],
            }
          ],
        });
      }

      // Stub the API call to googleTrends.
      sinon.stub(googleTrends, 'dailyTrends').resolves(mockDailyTrendsData);

      // Stub the `saveTrendsAndDeletePrevious` function.
      sinon.stub(trends, 'saveTrendsAndDeletePrevious')
          .callsFake((trendsByCountry) => {
        datastoreEntities.push({
          key: 'fakeKey',
          data: {
            timestamp: Date.now(),
            trendsByCountry: trendsByCountry,
            globalTrends: trends.getGlobalTrends(trendsByCountry),
          },
        });
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should get daily trends and save in datastore', async function() {
      await trends.updateDailyTrends();

      assert.equal(datastoreEntities[0].key, 'fakeKey');
      assert.deepEqual(datastoreEntities[0].data.globalTrends, 
          [{trendTopic: 'topic1', count: countryJson.length}]);
      assert.deepEqual(
          datastoreEntities[0].data.trendsByCountry, mockTrendsByCountry);
    });
  });

  describe('ConstructCountryTrendsJson', function() {
    it ('should return correctly formatted country trends', function() {
      let countryCode = 'US';
      let trendingSearches = [
        {
          title: {
            query: 'Example Topic 1',
            exploreLink: '/trends/exploreLink1',
          },
          formattedTraffic: '200K+',
          articles: [
            {
              title: 'Example Topic 1 Article 1 Title',
              url: 'https://example_topic_1_article_1',
            }, {
              title: 'Example Topic 1 Article 2 Title',
              url: 'https://example_topic_1_article_2',
            },
          ],
        }, {
          title: {
            query: 'Example Topic 2',
            exploreLink: '/trends/exploreLink2',
          },
          formattedTraffic: '100K+',
          articles: [
            {
              title: 'Example Topic 2 Article 1 Title',
              url: 'https://example_topic_2_article_1',
            }, {
              title: 'Example Topic 2 Article 2 Title',
              url: 'https://example_topic_2_article_2',
            },
          ],
        }
      ];

      let countryTrendsJson = {
        country: 'US',
        trends: [
          {
            topic: 'Example Topic 1',
            traffic: '200K+',
            exploreLink: '/trends/exploreLink1',
            articles: [
              {
                title: 'Example Topic 1 Article 1 Title',
                url: 'https://example_topic_1_article_1',
              }, {
                title: 'Example Topic 1 Article 2 Title',
                url: 'https://example_topic_1_article_2',
              },
            ],
          }, {
            topic: 'Example Topic 2',
            traffic: '100K+',
            exploreLink: '/trends/exploreLink2',
            articles: [
              {
                title: 'Example Topic 2 Article 1 Title',
                url: 'https://example_topic_2_article_1',
              }, {
                title: 'Example Topic 2 Article 2 Title',
                url: 'https://example_topic_2_article_2',
              },
            ],
          }
        ],
      };

      const results = 
          trends.constructCountryTrendsJson(trendingSearches, countryCode);
      assert.deepEqual(results, countryTrendsJson);
    });
  });
});