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