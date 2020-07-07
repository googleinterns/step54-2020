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
  $('#region-info-modal').modal('show');

  // Update Modal with information for relevant country.
  const country = e.feature.getProperty('name');
  const countryData= e.feature.getProperty('country_data').toLocaleString();
  document.getElementById('modal-title').innerText = country;
  document.getElementById('search-results-tab').innerText = 
      country + ": " + countryData;
  displayTrends(country);
}

/** 
 * Display top trends for the selected country. 
 * @param {string} country The full name of the selected country.
 */
function displayTrends(country) {
  // Convert the country name to its two-letter code.
  fetch('../country-code.json').then(countryCodes => 
      countryCodes.json()).then(countryCodes => {
    let queriedCountry = countryCodes
        .filter(countryEntry => countryEntry.name === country);
    return queriedCountry[0].id;
  }).then(countryCode => {
    // Retrieve the trends from the backend given the country code.
    fetch('/country-trends/' + countryCode).then(countryTrends => 
        countryTrends.json()).then(trends => {
      let topTrendsTab = document.getElementById('top-trends-tab');
      topTrendsTab.innerHTML = '';
      if (trends.length === 0) {
        topTrendsTab.innerText = 'Trends in this country is not available.';
      } else {
        trends.forEach(trend => {
          let trendHeader = document.createElement('h5');
          trendHeader.innerText = trend.topic;
          topTrendsTab.appendChild(trendHeader);
        });
      }
    });
  });
}
