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
const datastore = new Datastore();

describe('Trends', function() {
  describe('RetrieveGlobalTrendsForTimeRange', function() {
    const CURRENT_DATA_TIME_RANGE_12_HOURS_MS = 12 * 60 * 60000;
    let currentTime;

    beforeEach(() => {
      currentTime = Date.now();
      let mockTrendsEntries = [{
        timestamp: currentTime - CURRENT_DATA_TIME_RANGE_12_HOURS_MS * 1.5,
        trendsByCountry: 'trendsByCountry1.5',
        globalTrends: 'globalTrends1.5',
      }, {
        timestamp: currentTime - CURRENT_DATA_TIME_RANGE_12_HOURS_MS * 3,
        trendsByCountry: 'trendsByCountry3',
        globalTrends: 'globalTrends3',
      }];

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
      let mockResult3halves = {
        timestamp: currentTime - CURRENT_DATA_TIME_RANGE_12_HOURS_MS * 1.5,
        globalTrends: 'globalTrends1.5',
      };

      assert.deepEqual(results, mockResult3halves);
    });

    it('should retrieve the most recent datastore entry given beyond the given time range', 
        async function() {
      let results = await trends.retrieveGlobalTrendsForTimeRange(2);
      let mockResult3 = {
        timestamp: currentTime - CURRENT_DATA_TIME_RANGE_12_HOURS_MS * 3,
        globalTrends: 'globalTrends3',
      }

      assert.deepEqual(results, mockResult3);
    });
  });

  describe('UpdateDailyTrends', function() {
    let deleteAncientTrendsStub;
    let getGlobalTrendsStub;
    let mockTrendsByCountry;
    let datastoreEntities;
    const countryJson = require('./../public/countries-with-trends.json');

    beforeEach(() => {
      datastoreEntities = [];

      let mockDailyTrendsData = JSON.stringify({
        'default': {
          'trendingSearchesDays': [
            {
              'trendingSearches': 'mockTrendingSearches',
            }
          ],
        },
      });

      mockTrendsByCountry = [];
      for (let i = 0; i < countryJson.length; i++) {
        mockTrendsByCountry.push({
          country: countryJson[i].id,
          trends: 'mockTrends',
        });
      }

      // Stub the API call to googleTrends.
      sinon.stub(googleTrends, 'dailyTrends').resolves(mockDailyTrendsData);

      // Stub the `constructCountryTrendsJson` function because it is tested 
      // separately.
      sinon.stub(trends, 'constructCountryTrendsJson')
          .callsFake((trendingSearches, countryCode) => {
        return {
          country: countryCode,
          trends: 'mockTrends',
        }
      });

      // Stub the `deleteAncientTrend` function because it is tested separately.
      deleteAncientTrendsStub = 
          sinon.stub(trends, 'deleteAncientTrend')
              .resolves('Not interested in the output');

      // Stub the `getGlobalTrends` function because it is tested separately.
      getGlobalTrendsStub = 
          sinon.stub(trends, 'getGlobalTrends').callsFake(() => {
            return 'mockGlobalTrends';
          });

      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'key').callsFake(() => {
        return 'fakeKey';
      });
      sinon.stub(Datastore.prototype, 'save').callsFake((entity) => {
        datastoreEntities.push(entity);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should get daily trends and save in datastore', async function() {
      await trends.updateDailyTrends();
      assert.equal(deleteAncientTrendsStub.callCount, 1);
      assert.equal(getGlobalTrendsStub.callCount, 1);
      assert.equal(datastoreEntities[0].key, 'fakeKey');
      assert.equal(
          datastoreEntities[0].data.globalTrends, 'mockGlobalTrends');
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
            }
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
            }
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
              }
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
              }
            ],
          }
        ],
      };

      const results = 
          trends.constructCountryTrendsJson(trendingSearches, countryCode);
      assert.deepEqual(results, countryTrendsJson);
    });
  });

  describe('deleteAncientTrend', function() {
    const STALE_DATA_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;
    
    afterEach(() => {
      sinon.restore();
    });

    it('should delete the oldest trend datastore entity', async function() {
      let datastoreEntities = [
        // June 29 2020. Older than the Threshold.
        {timestamp: 1593455070000},
        // June 30 2020. Older than the Threshold.
        {timestamp: 1593541470000},
        {timestamp: Date.now()}
      ];

      for (let i = 0; i < datastoreEntities.length; i++) {
        datastoreEntities[i][datastore.KEY] = datastore.key(['TrendsEntry', i]);
      }

      sinon.stub(Datastore.prototype, 'delete').callsFake((entity) => {
        datastoreEntities.splice(entity.id, 1);
      });
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [datastoreEntities];
      });

      await trends.deleteAncientTrend();
      // Verify that the June 29 2020 entity is deleted. 
      assert.equal(datastoreEntities.length, 2);
      // Verify that the first entity is the June 30 2020 entity.
      assert.equal(datastoreEntities[0].timestamp, 1593541470000);
      // Verify that the (first) June 30, 2020 entity is still older than the
      // threshold.
      assert.isAbove(Date.now() - datastoreEntities[0].timestamp,
          STALE_DATA_THRESHOLD_7_DAYS_MS);
    });

    it('should delete nothing because timestamps are below the threshold', 
        async function() {
      const CURRENT_TIME = Date.now();
      const THRESHOLD_6_DAYS_MS = 6 * 24 * 60 * 60000;
      let datastoreEntitiesBelowThreshold = [
        {timestamp: CURRENT_TIME - THRESHOLD_6_DAYS_MS},
        {timestamp: Date.now()},
        {timestamp: Date.now()}
      ];

      for (let i = 0; i < datastoreEntitiesBelowThreshold.length; i++) {
        datastoreEntitiesBelowThreshold[i][datastore.KEY] =
            datastore.key(['TrendsEntry', i]);
      }

      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [datastoreEntitiesBelowThreshold];
      });
      sinon.stub(Datastore.prototype, 'delete').callsFake((entity) => {
        datastoreEntitiesBelowThreshold.splice(entity.id, 1);
      });

      await trends.deleteAncientTrend();
      assert.equal(datastoreEntitiesBelowThreshold.length, 3);
      // Verify that the first entity is the oldest entity.
      assert.equal(datastoreEntitiesBelowThreshold[0].timestamp, 
          CURRENT_TIME - THRESHOLD_6_DAYS_MS);
      // Verify that the first entity is not older than the threshold.
      assert.isAtMost(CURRENT_TIME - datastoreEntitiesBelowThreshold[0].timestamp,
          STALE_DATA_THRESHOLD_7_DAYS_MS);
    });
  });

  describe('getGlobalTrends', function() {
    it('should get the top globally trending topics', function() {
      let trendsByCountry = [
      {
        country: 'UA',
        trends: [{
          topic: 'Donald Trump',
        },
        {
          topic: 'Coronavirus',
        }],
      }, 
      {
        country: 'US',
        trends: [{
          topic: 'Donald Trump',
        },
        {
          topic: 'Coronavirus',
        }],
      }, 
      {
        country: 'UK',
        trends: [{
          topic: 'Donald Trump',
        }],
      },
      {
        country: 'AR',
        trends: [{
          topic: 'Dogs',
        }],
      }];
      let result = trends.getGlobalTrends(trendsByCountry);
      let mockResult = [
        {trendTopic: 'Donald Trump', count: 3},
        {trendTopic: 'Coronavirus', count: 2},
        {trendTopic: 'Dogs', count: 1}
      ];
      assert.deepEqual(result, mockResult);
    });

    it('should get an empty array', function() {
      let trendsByCountry = [];
      let result = trends.getGlobalTrends(trendsByCountry);
      let mockEmpty = [];
      assert.deepEqual(result, mockEmpty);
    });
  });
});