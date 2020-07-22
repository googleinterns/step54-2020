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

/**
 * Displays the information modal when a country on the map is clicked.
 * @param {?google.maps.MouseEvent} e Click event.
 */
function onClickCountry(e) {
  if (e.feature.getProperty('country_data') != null) {
    $('#region-info-modal').modal('show');

    // Update Modal with information for relevant country.
    const countryName = e.feature.getProperty('name');
    const countryId = e.feature.getId();
    document.getElementById('modal-title').innerText = countryName;
    displayTopResultsForCurrentTrend(countryId);
    setCountryTrends(countryId);
  }
}

/**
 * Sets trends under the top-trends modal tab for the selected country.
 * @param {string} countryCode The two-letter code of the selected country.
 */
function setCountryTrends(countryCode) {
  const topTrendsTab = document.getElementById('top-trends-tab');
  topTrendsTab.innerHTML = '<h4>Trending topics in selected country: </h4>';
  fetch('/country-trends/' + countryCode).then(countryTrends =>
      countryTrends.json()).then(trends => {
        if (trends.length === 0) {
          topTrendsTab.innerHTML = 
              'Trends are not available for the selected country.<br>';
        } else {
          for (let i = 0; i < trends.length; i++) {
            let articlesId = 'trend' + i + 'Article';
            let articlesHtml = 'Search results: <br>';
            trends[i].articles.forEach(article => {
              articlesHtml += '<span>' + article + '</span><br>';
            });
            topTrendsTab.innerHTML += 
                '<h5 class="country-trend" onclick="toggleDisplay(\''+ 
                articlesId + '\')">' + trends[i].topic + '</h5>' + 
                '<div id="'+ articlesId + '" class="hidden">' + 
                articlesHtml + '</div>';
          }
        }
        topTrendsTab.innerHTML += 
            '<i>Last updated on ' + new Date(getTopTrends().timestamp) + '</i>';
      });
}

/** Toggles whether the element with the given id is displayed or not. */
function toggleDisplay(id) {
  document.getElementById(id).classList.toggle('shown');
  document.getElementById(id).classList.toggle('hidden');
}

/** 
 * Displays the top results in a country for current search trend on modal. 
 * @param {string} countryCode Two letter country code for selected country.
 */
function displayTopResultsForCurrentTrend(countryCode) {
  let dataByCountry = getCurrentSearchData().dataByCountry;
  let date = new Date(getCurrentSearchData().timestamp);
  let resultElement =  document.getElementById('search-results-tab');
  resultElement.innerHTML = '';

  let countryData = dataByCountry.filter(data => data.country === countryCode);

  if (countryData.length === 0 ||
      countryData[0].averageSentiment === NO_RESULTS_DEFAULT_SCORE) {
    // Handle case where there are no results.
    resultElement.innerHTML += 'No results.<br>';
  } else {
    resultElement.innerHTML += '<b>Topic Popularity Score: ' + 
        countryData[0].interest + '</b><br>';
    resultElement.innerHTML += '<b>Average Sentiment Score: ' + 
        countryData[0].averageSentiment.toFixed(1) + '</b><br>';

    // Get search results for the specified country.
    let results = countryData[0].results;
    for (let i = 0; i < results.length; i++) {
      resultElement.innerHTML += '<a href=' + results[i].link + '>' +
        results[i].htmlTitle + '</a><br>' + results[i].snippet + '<br>'
        + '<i>Sentiment Score: ' + results[i].score.toFixed(1) + '</i><br>';
    }
  }
  resultElement.innerHTML += '<i>Last updated on ' + date + '</i>';
}
