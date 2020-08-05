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

const mocha = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
const trends = require('./../routes/trends').trends;
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

describe('Trends', function() {
	describe('DeleteAncientTrend', function() {
		let datastoreEntities;
		const CURRENT_TIME = Date.now();
		const STALE_DATA_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;
		const THRESHOLD_6_DAYS_MS = 6 * 24 * 60 * 60000;
		const DIFFERENCE_CURRENT_TIME_THRESHOLD_6_DAYS_MS =
				CURRENT_TIME - THRESHOLD_6_DAYS_MS;
		beforeEach(() => {
			datastoreEntities = [
				// June 29 2020. Older than the Threshold.
				{timestamp: 1593455070000},
				// June 30 2020. Older than the Threshold.
				{timestamp: 1593541470000},
				{timestamp: Date.now()}
			];
			datastoreEntities[0][datastore.KEY] =
					datastore.key(['TrendsEntry', 0]);
			datastoreEntities[1][datastore.KEY] =
					datastore.key(['TrendsEntry', 1]);
			datastoreEntities[2][datastore.KEY] =
					datastore.key(['TrendsEntry', 2]);
			
			datastoreEntitiesBelowThreshold = [
				{timestamp: DIFFERENCE_CURRENT_TIME_THRESHOLD_6_DAYS_MS},
				{timestamp: Date.now()},
				{timestamp: Date.now()}
			];

			datastoreEntities[0][datastore.KEY] =
					datastore.key(['TrendsEntry', 0]);
			datastoreEntities[1][datastore.KEY] =
					datastore.key(['TrendsEntry', 1]);
			datastoreEntities[2][datastore.KEY] =
					datastore.key(['TrendsEntry', 2]);

			// Stub calls to the datastore.
			sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
				return [datastoreEntities];
			});

			// Stub calls to the datastore.
			sinon.stub(Datastore.prototype, 'delete').callsFake((entity) => {
				datastoreEntities.splice(entity.id, 1);
			});
		});

		afterEach(() => {
			sinon.restore();
		});

		it('should delete the oldest trend datastore entity', async function() {
			await trends.deleteAncientTrend();
			// Should delete the June 29 2020 entity. 
			assert.equal(datastoreEntities.length, 2);
			// The first entity should be the June 30 2020 entity.
			assert.equal(datastoreEntities[0].timestamp, 1593541470000);
			// June 30, 2020 is still older than the threshold.
			assert.isAbove(Date.now() - datastoreEntities[0].timestamp,
					STALE_DATA_THRESHOLD_7_DAYS_MS);
		});
	});
	describe('DeleteAncientTrendWithNoTrendDeleted', function() {
		let datastoreEntitiesBelowThreshold;
		const CURRENT_TIME = Date.now();
		const STALE_DATA_THRESHOLD_7_DAYS_MS = 7 * 24 * 60 * 60000;
		const THRESHOLD_6_DAYS_MS = 6 * 24 * 60 * 60000;
		const DIFFERENCE_CURRENT_TIME_THRESHOLD_6_DAYS_MS =
				CURRENT_TIME - THRESHOLD_6_DAYS_MS;
		beforeEach(() => {	
			datastoreEntitiesBelowThreshold = [
				{timestamp: DIFFERENCE_CURRENT_TIME_THRESHOLD_6_DAYS_MS},
				{timestamp: Date.now()},
				{timestamp: Date.now()}
			];

			datastoreEntitiesBelowThreshold[0][datastore.KEY] =
					datastore.key(['TrendsEntry', 0]);
			datastoreEntitiesBelowThreshold[1][datastore.KEY] =
					datastore.key(['TrendsEntry', 1]);
			datastoreEntitiesBelowThreshold[2][datastore.KEY] =
					datastore.key(['TrendsEntry', 2]);

			// Stub calls to the datastore.
			sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
				return [datastoreEntitiesBelowThreshold];
			});

			// Stub calls to the datastore.
			sinon.stub(Datastore.prototype, 'delete').callsFake((entity) => {
				datastoreEntitiesBelowThreshold .splice(entity.id, 1);
			});
		});

		afterEach(() => {
			sinon.restore();
		});

		it('should delete nothing because timestamps are below the threshold', 
				async function() {
			await trends.deleteAncientTrend();
			assert.equal(datastoreEntitiesBelowThreshold.length, 3);
			// The first entity should be the oldest entity.
			assert.equal(datastoreEntitiesBelowThreshold[0].timestamp, 
					DIFFERENCE_CURRENT_TIME_THRESHOLD_6_DAYS_MS);
			// The first entity is still older than the threshold.
			assert.isAtMost(CURRENT_TIME - datastoreEntitiesBelowThreshold[0].timestamp,
					STALE_DATA_THRESHOLD_7_DAYS_MS);
		});
	});
});