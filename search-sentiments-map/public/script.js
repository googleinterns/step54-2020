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

function setTopTrends() {
  console.log('set-trends');
  const trendsList = document.getElementById('trends-list');

  fetch('/trends').then(dailyTrendsJson => dailyTrendsJson.json()).then(dailyTrendsObj => {
    console.log(JSON.stringify(dailyTrendsObj.default));
    var trendingSearches = dailyTrendsObj.default.trendingSearchesDays[0].trendingSearches;
    console.log(trendingSearches);

    for (var i = 0; i < trendingSearches.length; i++) {
      console.log(trendingSearches[i]);
      var trendElement = document.createElement('li');
      trendElement.innerText = trendingSearches[i].title.query;
      // Show 7 trending topics by default and hide the rest. 
      if (i < 7) {
        trendElement.className = 'shown';
      } else {
        trendElement.className = 'hidden';
      }
      trendsList.append(trendElement);
    }

    const seeMore = document.createElement('li');
    seeMore.innerText = 'See More';
  });
}

function showMore() {
}
