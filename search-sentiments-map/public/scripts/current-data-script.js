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

let currentTrend = '';
let currentCustomSearchData = '';

/** Returns current trend user is viewing. */
function getCurrentTrend() {
  return currentTrend;
}

/** Returns current custom search data for trend user is viewing. */
function getCurrentCustomSearchData() {
  return currentCustomSearchData;
}

/** 
 * Retrieves relevant data for new trend and reconstructs map with new data.
 * @param {string} trend New trend to get data for.
 */
// TODO(carmenbenitez): Uncomment if/else block to show data for other search
// results when custom search data for all top trends set up. Replace top trend
// in else block with top trend.
function setNewTrend(trend) {
  // if (trend != null){
  //   currentTrend = trend;
  // } else {
  //   currentTrend = 'TOP TREND HERE';
  // }

  currentTrend = 'trump';
  const topicHeader = document.getElementById('topic-header');
  topicHeader.innerText = 
      'Worldwide sentiments of search results for "' + currentTrend + '"';

  fetch('/search/' + currentTrend)
    .then(resultsJsonArray => resultsJsonArray.json()).then(topicResults => {
      currentCustomSearchData = topicResults;
  });
  console.log('In setNewTrend');
  console.log(getCurrentCustomSearchData());
  // Reload map with new sentiment data and relevant coloring.
  loadCountryData();
}

