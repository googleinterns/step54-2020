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

describe('Trends', function() {
  describe('getGlobalTrends', function() {
    let mockResult;
    let mockEmpty;
    beforeEach(() => {
      mockResult = [
        {trendTopic: 'Donald Trump', count: 3},
        {trendTopic: 'Coronavirus', count: 2},
        {trendTopic: 'Dogs', count: 1}
      ];
      mockEmpty = [];
    })

    afterEach(() => {
      sinon.restore();
    })

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
      assert.deepEqual(result, mockResult);
    });

    it('should get an empty array', function() {
      let trendsByCountry = [];
      let result = trends.getGlobalTrends(trendsByCountry);
      assert.deepEqual(result, mockEmpty);
    });
  });
});