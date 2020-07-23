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
let currentSearchData = '';
// JSON object for the trends that are currently displayed and their timestamp.
let topTrends = '';

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
        console.log('search data', currentSearchData)
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
      })
      .then(() => {
        // Reload map with new sentiment or search interest data and relevant
        // coloring.
        loadRegionDataByMode();
        document.getElementById('submit-user-topic').innerHTML = 'Submit';
        document.getElementById('submit-user-topic').disabled = false;
      });
}

/** 
 * Retrieves interest data for US states and reconstructs the map with new data.
 * @param {string=} topic Topic to get data for. Defaults to the current topic.
 */
/*
function setStateInterestsData(topic = currentTopic) {
  fetch('/search-interests/' + topic).then(response => response.json()).then(stateInterests => {
    console.log(stateInterests);
    currentSearchData = stateInterests;
  }).then(() => {
    loadRegionDataByMode();
  });
}*/

/**
 * Fetches current top trends from the backend and displays them on the website.
 */
function updateTrends() {
  fetch('/trends').then(globalTrends => globalTrends.json()).then(trends => {
    topTrends = trends;
    setTopTrends();
    // Set the map to display data on the top-ranking trend.
    setNewTrend(trends.globalTrends[0].trendTopic);
  });
}
