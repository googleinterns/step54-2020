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
 * Responds to a click on a map shape (country).
 * @param {?google.maps.MouseEvent} e Click event.
 */
function clickOnRegion(e) {
  const countryId = e.feature.getId();
  if (countryId === 'N/A') { return; }

  $('#region-info-modal').modal('show');

  // Update Modal with information for relevant country.
  const countryName = e.feature.getProperty('name');
  //const countryData= e.feature.getProperty('country_data').toLocaleString();
  document.getElementById('modal-title').innerText = countryName;
  displayTopResults(countryId);
  displayTrends(countryId);
}

/**
 * Displays trends under the top-trends modal tab for the selected country.
 * @param {string} countryCode The two-letter code of the selected country.
 */
function displayTrends(countryCode) {
  const topTrendsTab = document.getElementById('top-trends-tab');
  topTrendsTab.innerHTML = '';

  fetch('/country-trends/' + countryCode).then(countryTrends => 
      countryTrends.json()).then(trends => {
    if (trends.length === 0) {
      topTrendsTab.innerText = 'Trends in this country is not available.';
    } else {
      trends.forEach(trend => {
        const trendHeader = document.createElement('h5');
        trendHeader.innerText = trend.topic;
        topTrendsTab.appendChild(trendHeader);
      });
    }
  });
}

/** 
 * Displays the top results in a country for current search trend on modal. 
 * @param {string} countryCode Two letter country code for selected country.
 */
// TODO(ntarn): Add Sentiment scores to this modal.
function displayTopResults(countryCode) { 
  let topic = getCurrentTrend();
  let dataByCountry = getCurrentCustomSearchData().dataByCountry;
  let date = new Date(getCurrentCustomSearchData().timestamp);
  let resultElement =  document.getElementById('search-results-tab');
  resultElement.innerHTML = '';

  let countryData = dataByCountry.filter(data => data.country === countryCode);
  // Get search results of the specified country.
  let results = countryData.length === 0 ? [] : countryData[0].results;

  // Handle case where there are no results.
  if (results.length === 0) {
    resultElement.innerHTML += 'No results.<br>';
  }

  for (let i = 0; i < results.length; i++) {
    resultElement.innerHTML += '<a href=' + results[i].link + '>' +
        results[i].htmlTitle + '</a><br>' + results[i].snippet+ '<br>';
  }
  resultElement.innerHTML += '<i>Last updated on ' + date.toString() +
  '<i><br>';
}