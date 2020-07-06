// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

/** Creates the world map. */
function createWorldMap() {
  map = new google.maps.Map(
    document.getElementById('map'),
    {center: {lat: 38.46049, lng: -5.428423}, zoom: 3});
}

const SHOW_MORE_OR_LESS_ID = 'show-more-or-less';
const TOGGLE_SHOW_MORE = 'Show More';
const TOGGLE_SHOW_LESS = 'Show Less';

const CLASSNAME_SHOWN = 'shown';
const CLASSNAME_HIDDEN = 'hidden';

/** Displays the top trends of the US on the DOM. */
function setTopTrends() {
  const trendsList = document.getElementById('trends-list');

  // Get the 20 trending search topics from the backend.
  fetch('/trends').then(trendsJsonArray => trendsJsonArray.json()).then(trends => {
    for (var i = 0; i < trends.length; i++) {
      var trendElement = document.createElement('li');
      trendElement.innerText = trends[i].trendTopic;
      // Show 10 trending topics by default and hide the rest.
      trendElement.className = i < 10 ? CLASSNAME_SHOWN : CLASSNAME_HIDDEN;
      trendElement.addEventListener('click', (event) => {
        showResultForTopic(event);
      })
      trendsList.append(trendElement);
    }

    // Add an item to the list that toggles showing more or less topics when there are more
    // than 10 trending topics.
    if (trends.length > 10) {
      const showMoreOrLessToggleItem = document.createElement('li');
      showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_MORE;
      showMoreOrLessToggleItem.id = SHOW_MORE_OR_LESS_ID;
      showMoreOrLessToggleItem.addEventListener('click', () => {
        showMoreOrLess();
      });
      trendsList.append(showMoreOrLessToggleItem);
    }
  });
}

/** 
 * Displays the top results for Trump for the first country on the DOM. 
 * TODO(ntarn): Delete and set map itself to show data.
 */
function setTopResults() {
  const searchResultsList = document.getElementById('search-results-list');
  const topicHeader = document.getElementById('topic-header');
 
  // Get the 10 search results from the backend and format them.
  fetch('/search').then(resultsJsonArray => resultsJsonArray.json())
      .then(topicResults => {
    results = topicResults.countries[0].results;
    for (let i = 0; i < results.length; i++) {
      let resultElement = document.createElement('li');
      resultElement.innerHTML += "<a href=" + results[i].link+">" +
          results[i].htmlTitle + "</a><br>" + results[i].htmlSnippet;
      searchResultsList.append(resultElement);
    }
    topicHeader.innerText = 'Worldwide sentiments of search results for "' +
        topicResults.topic  + '"';
  });
}

/**
 * Shows the remaining 10 trending topics if the user clicks on 'See More' and
 * hides the last 10 if the user clicks on 'See Less.'
 */
function showMoreOrLess() {
  const showMoreOrLessToggleItem = document.getElementById(SHOW_MORE_OR_LESS_ID);
  const trendElements = document.querySelectorAll('#trends-list li');
  if (showMoreOrLessToggleItem.innerText === TOGGLE_SHOW_MORE) {
    for (var i = 10; i < trendElements.length - 1; i++){
      trendElements[i].className  = CLASSNAME_SHOWN;
    }
    showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_LESS;
  } else {
    for (var i = 10; i < trendElements.length - 1; i++) {
      trendElements[i].className  = CLASSNAME_HIDDEN;
    }
    showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_MORE;
  }
}

/** */
function showResultForTopic(event) {
  const searchTopic = event.currentTarget.innerText;
  const topicHeader = document.getElementById('topic-header');
  topicHeader.innerText = 'Worldwide sentiments of search results for "' + searchTopic + '"';
}
