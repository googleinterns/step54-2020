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
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

describe('Trends', function() {
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