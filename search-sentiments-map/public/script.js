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

const SEE_MORE_OR_LESS_ID = 'see-more-or-less';
const SEE_MORE = 'See More';
const SEE_LESS = 'See Less';

/** Displays the top trends of the US on the DOM. */
function setTopTrends() {
  const trendsList = document.getElementById('trends-list');

  // Get the top 20 trending search topics from the backend.
  fetch('/trends').then(dailyTrendsJson => dailyTrendsJson.json()).then(dailyTrendsObj => {
    var trendingSearches = dailyTrendsObj.default.trendingSearchesDays[0].trendingSearches;

    for (var i = 0; i < trendingSearches.length; i++) {
      var trendElement = document.createElement('li');
      trendElement.innerText = trendingSearches[i].title.query;
      // Show 10 trending topics by default and hide the rest.
      trendElement.className = i < 10 ? 'shown' : 'hidden';
      trendsList.append(trendElement);
    }

    // Add an item to the list that toggles showing more or less topics when there are more
    // than 10 trending topics.
    if (trendingSearches.length > 10) {
      const seeMoreOrLessToggleItem = document.createElement('li');
      seeMoreOrLessToggleItem.innerText = SEE_MORE;
      seeMoreOrLessToggleItem.id = SEE_MORE_OR_LESS_ID;
      seeMoreOrLessToggleItem.addEventListener('click', () => {
        showMoreOrLess();
      });
      trendsList.append(seeMoreOrLessToggleItem);
    }
  });
}

/** 
 * Shows the remaining 10 trending topics if the user clicks on 'See More' and
 * hides the last 10 if the user clicks on 'See Less.'
 */
function showMoreOrLess() {
  const seeMoreOrLessToggleItem = document.getElementById(SEE_MORE_OR_LESS_ID);
  const trendElements = document.querySelectorAll('#trends-list li');
  if (seeMoreOrLessToggleItem.innerText === SEE_MORE) {
    for (var i = 10; i < trendElements.length - 1; i++){
      trendElements[i].className  = 'shown';
    }
    seeMoreOrLessToggleItem.innerText = SEE_LESS;
  } else {
    for (var i = 10; i < trendElements.length - 1; i++) {
      trendElements[i].className  = 'hidden';
    }
    seeMoreOrLessToggleItem.innerText = SEE_MORE;
  }
}
