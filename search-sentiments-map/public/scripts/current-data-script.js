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

/** Returns the current trend that the user is viewing. */
function getCurrentTrend() {
  return currentTrend;
}

/** 
 * Returns current custom search data for the trend that the user is viewing.
 */
function getCurrentCustomSearchData() {
  return currentCustomSearchData;
}

/** 
 * Retrieves relevant data for new trend and reconstructs map with new data.
 * @param {string} trend New trend to get data for.
 */
function setNewTrend(trend) {
  currentTrend = trend;

  fetch('/search/' + trend)
      .then(resultsJsonArray => resultsJsonArray.json()).then(topicData => {
    currentCustomSearchData = topicData;
  }).then(() => {
    // Reload map with new sentiment or search interest data and relevant coloring.
    loadCountryDataByMode();
  });
}
