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
// <<<<<<< HEAD
  const countryName = e.feature.getProperty('name');
  const countryId = e.feature.getId();
  const countryData = e.feature.getProperty('country_data').toLocaleString();
  document.getElementById('modal-title').innerText = countryName;
  displayTopResults(countryId);
  setCountryTrends(countryId);
  //displayTrends(countryId);
// =======
//   const country = e.feature.getProperty('name');
//   const countryData= e.feature.getProperty('country_data').toLocaleString();
//   document.getElementById('modal-title').innerText = country;
//   document.getElementById('search-results-tab').innerText = 
//       country + ": " + countryData;

//   const countryCode = e.feature.getId();
//   setCountryTrends(countryCode);
// >>>>>>> dc8e192403c03cc757adbf60547f4376d3bde905
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
function displayTopResults(countryCode) {
  let topic = getCurrentTrend;
  let topicData = getCurrentCustomSearchData();
  let date = new Date(topicData.timestamp);
  let resultElement = document.getElementById('search-results-tab');
  resultElement.innerHTML = '';

  let countryData = topicData.countries
    .filter(countries => countries.country === countryCode);

// <<<<<<< HEAD
  // Handle case where there are no results.
  if (countryData.length === 0) {
    resultElement.innerHTML += 'No results.<br><i>Last updated on ' +
      date.toString() + '<i><br>';
  } else {
    let results = countryData[0].results;

    resultElement.innerHTML += 'Average Sentiment Score: ' + countryData[0].averageSentiment + '<br>';

    for (let i = 0; i < results.length; i++) {
      resultElement.innerHTML += '<a href=' + results[i].link + '>' +
        results[i].htmlTitle + '</a><br>' + results[i].snippet + '<br>'
        + 'Sentiment Score: ' + results[i].score + '<br>';
// =======
//   fetch('/country-trends/' + countryCode).then(countryTrends => 
//       countryTrends.json()).then(trends => {
//     if (trends.length === 0) {
//       topTrendsTab.innerText = 'Trends are not available for the selected country.';
//     } else {
//       trends.forEach(trend => {
//         const trendHeader = document.createElement('h5');
//         trendHeader.innerText = trend.topic;
//         topTrendsTab.appendChild(trendHeader);
//       });
// >>>>>>> dc8e192403c03cc757adbf60547f4376d3bde905
    }
    resultElement.innerHTML += '<i>Last updated on ' + date.toString() +
      '<i><br>';
  }
}

