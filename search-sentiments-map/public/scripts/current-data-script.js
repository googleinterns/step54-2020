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

// The topic that the user is currently viewing.
let currentTopic = '';

// JSON object for the data that is currently displayed, including topic,
// timestamp, and custom search data by country.
let currentSearchData = {};

// JSON object for the current top trends, including US trends if applicable,
// and their timestamp.
// Format: {globalTrends:..., usTrends:..., timestamp:...,}
let topTrendsData = {};

// The current time range for the data that the user is viewing.
let currentTimeRange = 0;

/** Returns current topic that the user is viewing. */
function getCurrentTopic() {
  return currentTopic;
}

/** 
 * Returns current custom search data for the topic that the user is viewing.
 */
function getCurrentSearchData() {
  return currentSearchData;
}

/** Returns top trends for `currentTimeRange` that the user is viewing. */
function getCurrentTopTrends() {
  return topTrendsData;
}


/** Returns the current time range for the data that the user is viewing. */
function getCurrentTimeRange() {
  return currentTimeRange;
}

/** 
 * Retrieves relevant data for new trend and reconstructs the map with new
 * data.
 * @param {string} trend New trend to get data for.
 */
function setNewTrend(trend) {
  currentTopic = trend;
  highlightCurrentTrend();

  fetch('/search/' + trend + '&' + currentTimeRange)
      .then(resultsJsonArray => resultsJsonArray.json()).then(topicData => {
        currentSearchData = topicData;
      }).then(() => {
        // Reload map with new sentiment or search interest data and relevant
        // coloring.
        loadRegionDataByMode();
      });
}

/** Bold and italicize the currently viewed trend. */
function highlightCurrentTrend() {
  let trendElements = document.getElementById('trends-list').childNodes;
  trendElements.forEach(function(trendElement) {
    trendElement.innerHTML = (trendElement.innerText === currentTopic) ? 
        '<span class="font-weight-bold font-italic">' + currentTopic 
            + '</span>' : 
        trendElement.innerText;
  });
}

/** 
 * Retrieves relevant data for new trend and reconstructs the map with new data.
 * @param {string} topic New topic to get data for.
 * @param {Array} countries Countries to get data for.
 */
function setUserSearchTopic(topic, countries) {
  currentTopic = topic;
  currentTimeRange = 0;
  document.getElementById('timeline-slider').value = 0;

  let trendElements = document.getElementById('trends-list').childNodes;
  // Loop through elements and get rid of the html bold span if it exists.
  trendElements.forEach(function(trendElement) {
    trendElement.innerHTML = trendElement.innerText;
  });

  // Reset current trends to show trends from the last 12 hours. Pass false as
  // the parameter to prevent a new trend from being set and overriding the
  // user search topic.
  updateGlobalTrendsAndDisplayFirst(false);

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
  highlightCurrentTrend();

  fetch('/search-interests/' + topic).then(response => response.json())
      .then(stateInterests => {
        currentSearchData = stateInterests;
      }).then(() => {
        loadRegionDataByMode();
      });
}

/** 
 * Changes `currentTimeRange` parameter and updates trends for new time range.
 * @param {number} timeRange The new time range interval value.
 */
function setTimeRange(timeRange) {
  if (currentTimeRange === timeRange) {
    return;
  }
  currentTimeRange = timeRange;
  getIsWorldLevel() ?
      updateGlobalTrendsAndDisplayFirst() : updateUsTrendsAndDisplayFirst();
}

/**
 * Fetches current top global trends from the backend, displays them on the 
 * website, and shows map data for the first trend.
 * @param {boolean=} setNewTrendEnabled Boolean for whether or not to change
 *     the trend that the user is viewing.
 */
function updateGlobalTrendsAndDisplayFirst(setNewTrendEnabled = true) {
  fetch('/trends/' + currentTimeRange)
      .then(globalTrends => globalTrends.json())
      .then(trends => {
        topTrendsData['globalTrends'] = trends.globalTrends;
        topTrendsData['timestamp'] = trends.timestamp;

        setTopTrends(true);  // Set global trends.
        if (setNewTrendEnabled) {
          // Set the map to display data on the top-ranking trend.
          setNewTrend(trends.globalTrends[0].trendTopic);
        }
      });
}

/**
 * Fetches current US trends from the backend, displays them on the website, 
 * and shows map data for the first trend.
 */
function updateUsTrendsAndDisplayFirst() {
  fetch('/country-trends/' + currentTimeRange + '/US')
      .then(usTrends => usTrends.json())
      .then(trends => {
        topTrendsData['usTrends'] = trends;

        setTopTrends(false);  // Set US trends.
        // Set the map to display data on the top-ranking trend.
        setStateInterestsData(trends[0].topic);
      });
}