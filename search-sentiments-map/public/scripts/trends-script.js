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

/** Displays the top trends on the DOM. */
function setTopTrends() {
  const trendsList = document.getElementById('trends-list');
  trendsList.innerHTML = '';
  let trends = getTopTrends().globalTrends;

  for (let i = 0; i < trends.length; i++) {
    const trendElement = document.createElement('li');
    trendElement.innerHTML = `${trends[i].trendTopic}`;
    trendElement.id = 'trend' + i;
    // Show a certain number of trending topics by default and hide the rest.
    trendElement.className = i < NUM_SHOWN ? CLASSNAME_SHOWN : CLASSNAME_HIDDEN;
    trendElement.addEventListener('click', (event) => {
      setNewTrend(event.currentTarget.innerText);
    });
    trendsList.append(trendElement);

    // Display the number of countries where the search topic is trending,
    // when hovered.
    let options = {
      content: `Trending in ${trends[i].count} countries`,
      placement: 'right',
      trigger: 'hover',
    }
    $('#trend' + i).popover(options);
  }

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
      'Last Updated: ' + new Date(getTopTrends().timestamp);
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
