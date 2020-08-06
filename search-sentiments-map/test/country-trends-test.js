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
const countryTrends = require('./../routes/country-trends').countryTrends;
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
const fetch = require('node-fetch'); // Used to access custom search.

describe('Country Trends', function() {
  describe('retrieveCountryTrends', function() {
    const CURRENT_DATA_TIME_RANGE_12_HOURS_MS = 12 * 60 * 60000;
    const THREE_HALVES_TIME_RANGE = 1.5;
    const THREE_TIME_RANGE = 3;
    let currentTime;
    let mockData;
    let trendsByCountryThreeHalvesTimeRange;
    let trendsByCountryThreeTimeRange;
    beforeEach(() => {
      currentTime = Date.now();
      trendsByCountryThreeHalvesTimeRange = [
      {
        country: 'UA',
        trends: [{
          topic: 'Love',
        },
        {
          topic: 'Black Lives Matter',
        }],
      }, 
      {
        country: 'US',
        trends: [{
          topic: 'Live',
        },
        {
          topic: 'Laugh',
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

      trendsByCountryThreeTimeRange = [
      {
        country: 'UA',
        trends: [{
          topic: 'Hello World',
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
      mockData = [{
        timestamp: currentTime - THREE_HALVES_TIME_RANGE *
            CURRENT_DATA_TIME_RANGE_12_HOURS_MS,
        trendsByCountry: trendsByCountryThreeHalvesTimeRange,
        globalTrends: [],
      },
      {
        timestamp: currentTime - THREE_TIME_RANGE *
            CURRENT_DATA_TIME_RANGE_12_HOURS_MS,
        trendsByCountry: trendsByCountryThreeTimeRange,
        globalTrends: [],
      }];
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should retrieve the most recent array of US and UA country trends from the datastore beyond the time it takes to retrieve search results', 
        async function() {
      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [mockData];
      });    
      let resultsUs = await countryTrends.retrieveCountryTrends('US', 0);
      let resultsUa = await countryTrends.retrieveCountryTrends('UA', 0);
      let mockThreeHalvesTimeRangeUsResult = [
        {topic: 'Live'}, 
        {topic: 'Laugh'}
      ];
      let mockThreeHalvesTimeRangeUaResult = [
        {topic: 'Love'}, 
        {topic: 'Black Lives Matter'}
      ];
      assert.deepEqual(resultsUs, mockThreeHalvesTimeRangeUsResult);
      assert.deepEqual(resultsUa, mockThreeHalvesTimeRangeUaResult);
    });

    it('should retrieve the most recent array of US and UA country trends from the datastore beyond the given time range', 
        async function() {
      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [mockData];
      }); 
      let resultsUs = await countryTrends.retrieveCountryTrends('US', 2);
      let resultsUa = await countryTrends.retrieveCountryTrends('UA', 2);
      let mockThreeTimeRangeUsResult = [
        {topic: 'Donald Trump'}, 
        {topic: 'Coronavirus'}
      ];
      let mockThreeTimeRangeUaResult = [
        {topic: 'Hello World'}, 
        {topic: 'Coronavirus'}
      ];
      assert.deepEqual(resultsUs, mockThreeTimeRangeUsResult);
      assert.deepEqual(resultsUa, mockThreeTimeRangeUaResult);
    });

    it('should get an empty array because there is no trends data available for AT', 
        async function() {
      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [mockData];
      }); 
      let resultsAt = await countryTrends.retrieveCountryTrends('AT', 0);
      let mockEmptyResult = [];
      assert.deepEqual(resultsAt, mockEmptyResult);
    });

    it('should return an empty array when there are no trends in the datastore', 
        async function() {
      let mockEmpty = [];
      // Stub calls to the datastore.
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        return [mockEmpty];
      }); 
      let result = await countryTrends.retrieveCountryTrends('US', 0);
      assert.deepEqual(result, mockEmpty);
    });
  });
});