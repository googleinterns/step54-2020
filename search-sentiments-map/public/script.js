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

/** Displays the top trends of the US on the DOM. */
function setTopTrends() {
  const trendsList = document.getElementById('trends-list');
  
  // Get the 20 trending search topics from the backend.
  fetch('/trends').then(dailyTrendsJson => dailyTrendsJson.json()).then(dailyTrendsObj => {
    var trendingSearches = dailyTrendsObj.default.trendingSearchesDays[0].trendingSearches;

    for (var i = 0; i < trendingSearches.length; i++) {
      var trendElement = document.createElement('li');
      trendElement.innerText = trendingSearches[i].title.query;
      // Show 10 trending topics by default and hide the rest.
      if (i < 10) {
        trendElement.className = 'shown';
      } else {
        trendElement.className = 'hidden';
      }
      trendsList.append(trendElement);
    }

    // Add a button to toggle showing more or less when there are more than 10
    // trending topics.
    if (trendingSearches.length > 10) {
      const seeMoreOrLess = document.createElement('li');
      seeMoreOrLess.innerText = 'See More';
      seeMoreOrLess.id = 'see-more-or-less';
      seeMoreOrLess.addEventListener('click', () => {
        showMoreOrLess();
      });
      trendsList.append(seeMoreOrLess);
    }
  });
}

/** 
 * Shows the remaining 10 trending topics if the user clicks on 'See More' and
 * hides the last 10 if the user clicks on 'See Less.'
 */
function showMoreOrLess() {
  const seeMoreOrLess = document.getElementById('see-more-or-less');
  const trendElements = document.querySelectorAll('#trends-list li');
  if (seeMoreOrLess.innerText === 'See More') {
    for (var i = 10; i < trendElements.length - 1; i++){
      trendElements[i].className  = 'shown';
    }
    seeMoreOrLess.innerText = 'See Less';
  } else {
    for (var i = 10; i < trendElements.length - 1; i++) {
      trendElements[i].className  = 'hidden';
    }
    seeMoreOrLess.innerText = 'See More';
  }
}
