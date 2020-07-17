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

// The current trend a user is viewing.
let currentTrend = '';

// The custom search data for the trend that the user is viewing.
let currentCustomSearchData = '';
let topTrends = '';

/** Returns the current trend that the user is viewing. */
function getCurrentTrend() {
  return currentTrend;
}

/** Returns current trend user is viewing. */
function getTopTrends() {
  return topTrends;
}

/** Returns current custom search data for trend user is viewing. */
function getCurrentCustomSearchData() {
  return currentCustomSearchData;
}

/** 
 * Retrieves relevant data for new trend and reconstructs map with new data.
 * @param {string} trend New trend to get data for.
 */
function setNewTrend(trend) {
  updateTrends();

  // TODO(carmenbenitez): Uncommment if/else block to show data for other
  // search results when custom search data for all current top trends is set up. 
  // if (trend != null){
  //   currentTrend = trend;
  // } else {
  //   currentTrend = topTrends[0];
  // }
  currentTrend = "The Old Guard";
  
  const topicHeader = document.getElementById('topic-header');
  topicHeader.innerText = 
      'Worldwide sentiments of search results for "' + currentTrend + '"';

  // Reload map with new sentiment data and relevant coloring.
  fetch('/search/' + currentTrend)
      .then(resultsJsonArray => resultsJsonArray.json()).then(topicResults => {
        currentCustomSearchData = topicResults;
        loadCountryData();
      });
}

/** 
 * Retrieves relevant data for new trend and reconstructs map with new data.
 * @param {string} topic New topic to get data for.
 * @param {Array} countries Countries to get data for.
 */
function setUserSearchTopic(topic, countries) {
  updateTrends();

  currentTrend = topic;
  const topicHeader = document.getElementById('topic-header');
  topicHeader.innerText = 
      'Worldwide sentiments of search results for "' + currentTrend + '"';

  fetch('/search/' + topic + '/' + JSON.stringify(countries))
      .then(response => response.json())
      .then(topicResults => {
        currentCustomSearchData = topicResults;
        loadCountryData();
  });
}

/**
 * Fetches current top trends from back end and displays them on the website.
 */
function updateTrends() {
  fetch('/trends').then(globalTrends => globalTrends.json()).then(trends => {
    topTrends = trends;
    setTopTrends(); 
  });
}