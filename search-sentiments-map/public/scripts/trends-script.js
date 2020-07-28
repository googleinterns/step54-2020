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

const SHOW_MORE_OR_LESS_ID = 'show-more-or-less';
const TOGGLE_SHOW_MORE = 'Show More';
const TOGGLE_SHOW_LESS = 'Show Less';

const CLASSNAME_SHOWN = 'shown';
const CLASSNAME_HIDDEN = 'hidden';
const NUM_SHOWN = 7;

/** 
 * Displays the top trends on the DOM and sets their onclick method. 
 * @param {boolean=} useGlobalTrends Whether the trends to display are global
 *     trends. Display US trends otherwise.
 */
function setTopTrends(useGlobalTrends = true) {
  document.getElementById('switch-trends-click').innerText = useGlobalTrends ?
      'US trends' : 'Global trends';
  document.getElementById('trends-title').innerText = useGlobalTrends ?
      'Globally Trending Search Topics' : 'US Trending Search Topics';

  const trendsList = document.getElementById('trends-list');
  trendsList.innerHTML = '';
  let trends = useGlobalTrends ? 
      getCurrentTopTrends().globalTrends : getCurrentTopTrends().usTrends;

  addTrendsToList(trendsList, trends, useGlobalTrends);

  // Add a toggle button to the list to show more or less topics depending
  // on the number of topics displayed.
  if (trends.length > NUM_SHOWN) {
    const showMoreOrLessToggleItem = document.createElement('li');
    showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_MORE;
    showMoreOrLessToggleItem.id = SHOW_MORE_OR_LESS_ID;
    showMoreOrLessToggleItem.addEventListener('click', () => {
      showMoreOrLess();
    });
    trendsList.append(showMoreOrLessToggleItem);
  }
  document.getElementById('trends-timestamp').innerText = 
      'Last Updated: ' + new Date(getCurrentTopTrends().timestamp);
}

/** Helper function for the `setTopTrends` function. */
function addTrendsToList(trendsList, trends, useGlobalTrends) {
  for (let i = 0; i < trends.length; i++) {
    const trendElement = document.createElement('li');

    // TODO(chenyuz): change the backend to call them both 'topic'.
    trendElement.innerHTML = useGlobalTrends ? 
        trends[i].trendTopic : trends[i].topic;
    trendElement.id = 'trend' + i;
    // Show a certain number of trending topics by default and hide the rest.
    trendElement.className = i < NUM_SHOWN ? CLASSNAME_SHOWN : CLASSNAME_HIDDEN;

    if (getIsWorldLevel()) {
      trendElement.addEventListener('click', (event) => {
        setNewTrend(event.currentTarget.innerText);
      });
    } else {
      trendElement.addEventListener('click', (event) => {
        setStateInterestsData(event.currentTarget.innerText);
      });
    }
    trendsList.append(trendElement);

    // Display the number of countries where the topic is trending (world-level),
    // or the traffic or the topic (us-level), when hovered.
    let options = {
      content: useGlobalTrends ? `Trending in ${trends[i].count} countries` : 
          `${trends[i].traffic} searches`,
      placement: 'right',
      trigger: 'hover',
    };
    $('#' + trendElement.id).popover(options);
  }
}

/**
 * Shows more trending topics if the user clicks on 'See More' and hides those
 * if the user clicks on 'See Less.'
 */
function showMoreOrLess() {
  const showMoreOrLessToggleItem = document.getElementById(SHOW_MORE_OR_LESS_ID);
  const trendElements = document.querySelectorAll('#trends-list li');
  if (showMoreOrLessToggleItem.innerText === TOGGLE_SHOW_MORE) {
    for (let i = NUM_SHOWN; i < trendElements.length - 1; i++){
      trendElements[i].className  = CLASSNAME_SHOWN;
    }
    showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_LESS;
  } else {
    for (let i = NUM_SHOWN; i < trendElements.length - 1; i++) {
      trendElements[i].className  = CLASSNAME_HIDDEN;
    }
    showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_MORE;
  }
}

/** 
 * Sets the top trends to be US or global. Called when `switch-trends-click`
 * is clicked.
 */
function switchTrends(event) {
  setTopTrends(event.currentTarget.innerText === 'Global trends');
  highlightCurrentTrend();
}