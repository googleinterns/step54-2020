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

// String for the topic that the user is currently viewing.
let currentTopic = '';
// JSON object for the data that is currently displayed, including topic,
// timestamp, and custom search data by country.
let currentSearchData = {};
// JSON object for the current top trends, including US trends if applicable,
// and their timestamp.
// Format: {globalTrends:..., usTrends:..., timestamp:...,}
let topTrends = {};

/** Returns current topic that the user is viewing. */
function getCurrentTopic() {
  return currentTopic;
}

/** Returns the current top trends. */
function getTopTrends() {
  return topTrends;
}

/** Returns current custom search data for trend that the user is viewing. */
function getCurrentSearchData() {
  return currentSearchData;
}

/** 
 * Retrieves relevant data for new trend and reconstructs the map with new
 * data.
 * @param {string} trend New trend to get data for.
 */
function setNewTrend(trend) {
  currentTopic = trend;
  fetch('/search/' + trend)
      .then(resultsJsonArray => resultsJsonArray.json()).then(topicData => {
        currentSearchData = topicData;
      }).then(() => {
        // Reload map with new sentiment or search interest data and relevant
        // coloring.
        loadRegionDataByMode();
      });
}

/** 
 * Retrieves relevant data for new trend and reconstructs the map with new data.
 * @param {string} topic New topic to get data for.
 * @param {Array} countries Countries to get data for.
 */
function setUserSearchTopic(topic, countries) {
  currentTopic = topic;
  fetch('/search/' + topic + '/' + JSON.stringify(countries))
      .then(response => response.json())
      .then(topicResults => {
        currentSearchData = topicResults;
      }).then(() => {
        // Reload map with new sentiment or search interest data and relevant
        // coloring.
        loadRegionDataByMode();
        document.getElementById('submit-user-topic').innerHTML = 'Submit';
        document.getElementById('submit-user-topic').disabled = false;
      });
}

/** 
 * Retrieves interest data for US states and reconstructs the map with new data.
 * @param {string} topic Topic to get data for.
 */
function setStateInterestsData(topic) {
  currentTopic = topic;
  fetch('/search-interests/' + topic).then(response => response.json())
      .then(stateInterests => {
        currentSearchData = stateInterests;
      }).then(() => {
        loadRegionDataByMode();
      });
}

/**
 * Fetches current top global trends from the backend, displays them on the 
 * website, and shows map data for the first trend.
 */
function updateGlobalTrendsAndDisplayFirst() {
  fetch('/trends').then(globalTrends => globalTrends.json()).then(trends => {
    topTrends['globalTrends'] = trends.globalTrends;
    topTrends['timestamp'] = trends.timestamp;

    setTopTrends(true);  // Set global trends.
    // Set the map to display data on the top-ranking trend.
    setNewTrend(trends.globalTrends[0].trendTopic);
  });
}

/**
 * Fetches current US trends from the backend, displays them on the website, 
 * and shows map data for the first trend.
 */
function updateUsTrendsAndDisplayFirst() {
  fetch('/country-trends/US').then(usTrends => usTrends.json())
      .then(trends => {
        topTrends['usTrends'] = trends;

        setTopTrends(true);  // Set global trends.
        // Set the map to display data on the top-ranking trend.
        setStateInterestsData(trends[0].topic);
      });
}