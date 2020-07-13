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
  $('#region-info-modal').modal('show');

  // Update Modal with information for relevant country.
  const country = e.feature.getProperty('name');
  const countryData= e.feature.getProperty('country_data').toLocaleString();
  document.getElementById('modal-title').innerText = country;
  document.getElementById('search-results-tab').innerText = 
      country + ": " + countryData;

  const countryCode = e.feature.getId();
  setCountryTrends(countryCode);
}

/**
 * Sets trends under the top-trends modal tab for the selected country.
 * @param {string} countryCode The two-letter code of the selected country.
 */
function setCountryTrends(countryCode) {
  const topTrendsTab = document.getElementById('top-trends-tab');
  topTrendsTab.innerHTML = '';

  fetch('/country-trends/' + countryCode).then(countryTrends => 
      countryTrends.json()).then(trends => {
    if (trends.length === 0) {
      topTrendsTab.innerText = 'Trends are not available for the selected country.';
    } else {
      trends.forEach(trend => {
        const trendHeader = document.createElement('h5');
        trendHeader.innerText = trend.topic;
        topTrendsTab.appendChild(trendHeader);
      });
    }
  });
}
