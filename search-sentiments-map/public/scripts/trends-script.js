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

  // Get the top 10 globally trending search topics from the backend.
  fetch('/trends').then(globalTrends => globalTrends.json()).then(trends => {
    for (let i = 0; i < trends.length; i++) {
      const trendElement = document.createElement('li');
      trendElement.innerText = `${trends[i].trendTopic}`;
      // Display the number of countries where the trend is trending when hovered.
      trendElement.title = `Trending in ${trends[i].count} countries`;

      // Show some trending topics by default and hide the rest.
      trendElement.className = i < NUM_SHOWN ? CLASSNAME_SHOWN : CLASSNAME_HIDDEN;
      trendElement.addEventListener('click', (event) => {
        showResultForTopic(event);
      })
      trendsList.append(trendElement);
    }

    // Add an item to the list that toggles showing more or less topics.
    if (trends.length > NUM_SHOWN) {
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
 * Shows the trending topics over the 7th if the user clicks on 'See More' and
 * hides those if the user clicks on 'See Less.'
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
 * Update title when a trending topic is selected.
 * TODO (@chenyuz): Show sentiment scores for all countries on the selected topic.
 */
function showResultForTopic(event) {
  const searchTopic = event.currentTarget.innerText;
  setNewTrend(searchTopic);
}

/** Gets the sentiment score of an inputted search topic. 
 *  TODO(ntarn): Get the average sentiment score for the inputted search topic's search results. 
 */
// function getSentiment() {
//   const searchTopic = document.getElementById('search-topic').value;
//   const sentimentScoreElement = document.getElementById('sentiment-score');
//   const searchTopicObject = "searchTopic="+encodeURIComponent(searchTopic);
//   fetch('/sentiment', {method: 'POST',  // Send a request to the URL.
//     headers: new Headers({
//       'Content-Type': 'application/x-www-form-urlencoded',
//     }),
//     body: searchTopicObject // Send data from index.html.
//     })
//     .then(response => response.json())
//     .then((score) => { 
//       console.log('ntarn debug: frontend' + score.sentimentScore);
//       sentimentScoreElement.innerHTML = "<p>Sentiment analysis score: " + score.sentimentScore + "</p>";
//     });
// }  


