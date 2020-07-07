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

/** Displays the top trends of the US on the DOM. */
function setTopTrends() {
  const trendsList = document.getElementById('trends-list');

  // Get the 20 trending search topics from the backend.
  fetch('/trends').then(globalTrends => globalTrends.json()).then(trends => {
    for (let i = 0; i < trends.length; i++) {
      const trendElement = document.createElement('li');
      trendElement.innerText = `${trends[i].trendTopic} (${trends[i].country})`;
      // Show 10 trending topics by default and hide the rest.
      trendElement.className = i < 10 ? CLASSNAME_SHOWN : CLASSNAME_HIDDEN;
      trendElement.addEventListener('click', (event) => {
        showResultForTopic(event);
      })
      trendsList.append(trendElement);
    }

    // Add an item to the list that toggles showing more or less topics when there
    // are more than 10 trending topics.
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
 * Shows the remaining 10 trending topics if the user clicks on 'See More' and
 * hides the last 10 if the user clicks on 'See Less.'
 */
function showMoreOrLess() {
  const showMoreOrLessToggleItem = document.getElementById(SHOW_MORE_OR_LESS_ID);
  const trendElements = document.querySelectorAll('#trends-list li');
  if (showMoreOrLessToggleItem.innerText === TOGGLE_SHOW_MORE) {
    for (let i = 10; i < trendElements.length - 1; i++){
      trendElements[i].className  = CLASSNAME_SHOWN;
    }
    showMoreOrLessToggleItem.innerText = TOGGLE_SHOW_LESS;
  } else {
    for (let i = 10; i < trendElements.length - 1; i++) {
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

/** Gets the sentiment score of an inputted search topic. 
 *  TODO(ntarn): Get the average sentiment score for the inputted search topic's search results. 
 */
function getSentiment() {
  const searchTopic = document.getElementById('search-topic').value;
  const sentimentScoreElement = document.getElementById('sentiment-score');
  const searchTopicObject = "searchTopic="+encodeURIComponent(searchTopic);
  // Get the 10 search results from the backend and format them.
  fetch('/search').then(resultsJsonArray => resultsJsonArray.json())
      .then(results => {
        fetch('/sentiment', {method: 'POST',  // Send a request to the URL.
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(results) // Send data from /search
          })
      //   .then(response => response.json())
      //   .then((score) => { 
      //     console.log('ntarn debug: frontend' + score.sentimentScore);
      //     sentimentScoreElement.innerHTML = "<p>Sentiment analysis score: " + score.sentimentScore + "</p>";
      //   });
      // for (let i = 0; i < results.length; i++) {
      //   resultElement.innerHTML += "<a href=" + results[i].link+">" +
      //       results[i].htmlTitle + "</a><br>" + results[i].htmlSnippet;
      //   searchResultsList.append(resultElement);
      // }
  });
}
