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
  const countryName = e.feature.getProperty('name');
  const countryId = e.feature.getId();
  const countryData = e.feature.getProperty('country_data').toLocaleString();
  document.getElementById('modal-title').innerText = countryName;
  displayTopResultsForCurrentTrend(countryId);
  setCountryTrends(countryId);
  displaySentimentChartForCurrentTrend(countryId);
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
          topTrendsTab.innerText = 
              'Trends are not available for the selected country.';
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
function displayTopResultsForCurrentTrend(countryCode) {
  let topic = getCurrentTrend;
  let topicData = getCurrentCustomSearchData();
  let date = new Date(topicData.timestamp);
  let resultElement = document.getElementById('search-results-tab');
  resultElement.innerHTML = '';

  let countryData = topicData.countries
      .filter(countries => countries.country === countryCode);

  // Handle case where there are no results.
  if (countryData.length === 0) {
    resultElement.innerHTML += 'No results.<br><i>Last updated on ' +
        date.toString() + '<i><br>';
  } else {
    let results = countryData[0].results;

    resultElement.innerHTML += 'Average Sentiment Score: ' + 
        countryData[0].averageSentiment + '<br>';

    for (let i = 0; i < results.length; i++) {
      resultElement.innerHTML += '<a href=' + results[i].link + '>' +
        results[i].htmlTitle + '</a><br>' + results[i].snippet + '<br>'
        + 'Sentiment Score: ' + results[i].score + '<br>';
    }
    resultElement.innerHTML += '<i>Last updated on ' + date.toString() +
      '<i><br>';
  }
}


/** 
 * Displays the sentiment chart in a country for current search trend on modal. 
 * @param {string} countryCode Two letter country code for selected country.
 */
function displaySentimentChartForCurrentTrend(countryCode) {
  let topic = getCurrentTrend;
  let topicData = getCurrentCustomSearchData();
  let date = new Date(topicData.timestamp);

  let countryData = topicData.countries
      .filter(countries => countries.country === countryCode);

  let chartElement = document.getElementById('sentiment-chart-tab');
  chartElement.innerHTML = '';

  // Handle case where there are no results.
  if (countryData.length === 0) {
    chartElement.innerHTML += 'No results.<br><i>Last updated on ' +
        date.toString() + '<i><br>';
  } else {
    drawSentimentChart(chartElement);
    let results = countryData[0].results;

    chartElement.innerHTML += 'Average Sentiment Score: ' + 
        countryData[0].averageSentiment + '<br>';

    for (let i = 0; i < results.length; i++) {
      charttElement.innerHTML += '<a href=' + results[i].link + '>' +
        results[i].htmlTitle + '</a><br>' + results[i].snippet + '<br>'
        + 'Sentiment Score: ' + results[i].score + '<br>';
    }
    chartElement.innerHTML += '<i>Last updated on ' + date.toString() +
      '<i><br>';
  }
}

/** Creates a sentiment chart and adds it to the modal tab. 
 *  @param {Object} chartElement Tab element to update with the sentiment chart.
 */
function drawSentimentChart(chartElement) {
  var data = google.visualization.arrayToDataTable([
      ["Search Result", "Density", { role: "style" }], //look at this styling.
      ["Copper", -8.94, "#b87333"],
      ["Silver", 10.49, "silver"],
      ["Gold", 19.30, "gold"],
      ["Platinum", 21.45, "color: #e5e4e2"]
    ]);

  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
      { calc: "stringify",
        sourceColumn: 1,
        type: "string",
        role: "annotation" },
      2]);

  var options = {
    title: "Density of Precious Metals, in g/cm^3",
    width: 600,
    height: 400,
    bar: {groupWidth: "55%"},
    legend: { position: "none" },
  };
  var chart = new google.visualization.ColumnChart(chartElement);
  chart.draw(view, options);
}