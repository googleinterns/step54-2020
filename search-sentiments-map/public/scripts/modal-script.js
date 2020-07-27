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

// The default score assigned to countries with no search results.
const POSITIVE_COLOR = 'green';
const NEGATIVE_COLOR = 'red';
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
    displaySentimentChartForCurrentTrend(countryId);
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
 * Displays the top results in a country for current search trend on modal
 * and show positive/negative words depending on the sign of the sentiment score.  
 * @param {string} countryCode Two letter country code for selected country.
 */
async function displayTopResultsForCurrentTrend(countryCode) {
  let date = new Date(getCurrentSearchData().timestamp);
  let resultElement =  document.getElementById('search-results-tab');
  resultElement.innerHTML = '';

  let countryData = getCurrentSearchData().dataByCountry
      .filter(data => data.country === countryCode);

  // Handle case where there are no search results for the topic.
  if (countryData.length === 0 ||
      countryData[0].averageSentiment === NO_RESULTS_DEFAULT_SCORE) {
    resultElement.innerHTML += 'No results.<br>';
  } else {
    resultElement.innerHTML += '<b>Topic Popularity Score: ' + 
        countryData[0].interest + '</b><br>';
    resultElement.innerHTML += '<b>Average Sentiment Score: ' + 
        countryData[0].averageSentiment.toFixed(1) + '</b><br>';
    
    // Get search results for the specified country.
    let results = countryData[0].results;
    for (let i = 0; i < results.length; i++) {
      await fetch('/sentiment-words/' + results[i].title + results[i].snippet)
          .then(resultsJsonArray => resultsJsonArray.json())
          .then(sentimentWordsResult => {
            // Check to make sure that there is detection of positive and 
            // negative words from the Node.js sentiment API.
            if (sentimentWordsResult != null && 
                sentimentWordsResult.positive.length != 0) {
              // i + 1 shows the index for each search result.
              resultElement.innerHTML += (i + 1).toString() + '. ' + '<a href=' + 
                  results[i].link + '>' + results[i].htmlTitle + '</a><br>';
              var snippetArray = results[i].snippet.split(" ");
              snippetArray.forEach((word) => {
                let checkWordInArray = word.replace(/[^a-z0-9+]+/gi, '');
                if (results[i].score > 0 && sentimentWordsResult.positive
                    .includes(checkWordInArray)) {
                  resultElement.innerHTML += '<span style=\'color: green;\'>' + 
                      word + ' </span>';
                } else if (results[i].score < 0 && sentimentWordsResult.negative
                    .includes(checkWordInArray)) {
                  resultElement.innerHTML += '<span style=\'color: red;\'>' + 
                      word + ' </span>';
                } else {
                  resultElement.innerHTML += word + ' ';
                }
              });
              resultElement.innerHTML += '<br><i>Sentiment Score: ' + 
                  results[i].score.toFixed(1) + '</i><br>';
            } else {
              // i + 1 shows the index for each search result.
              resultElement.innerHTML += (i + 1).toString() + '. ' +
                  '<a href=' + results[i].link + '>' + results[i].htmlTitle + 
                  '</a><br>' + results[i].snippet + '<br>' + 
                  '<i>Sentiment Score: ' + results[i].score.toFixed(1) + 
                  '</i><br>';
            }
          });
    }
    resultElement.innerHTML += '<i>Last updated on ' + date + '</i>';
  }
}

/** 
 * Displays sentiment chart of search results for the current country on the modal.
 * @param {string} countryCode Two letter country code for selected country.
 */
function displaySentimentChartForCurrentTrend(countryCode) {
  let countryData = getCurrentSearchData().dataByCountry
      .filter(data => data.country === countryCode);
  let date = new Date(getCurrentSearchData().timestamp);
  let chartElement = document.getElementById('sentiment-chart-tab');
  chartElement.innerHTML = '';

  // Handle case where there are no search results for the topic.
  if (countryData.length === 0 ||
      countryData[0].averageSentiment === NO_RESULTS_DEFAULT_SCORE) {
    chartElement.innerHTML += 'No results.<br><i>Last updated on ' +
        date.toString() + '<i><br>';
  } else {
    let results = countryData[0].results;
    drawSentimentChart(chartElement, results);
    chartElement.innerHTML += 'Average Sentiment Score: ' + 
        countryData[0].averageSentiment.toFixed(1) + '<br>';
    chartElement.innerHTML += '<i>Last updated on ' + date.toString() +
        '<i><br>';
  }
}

// Use version 45 to allow for chart ticks to be drawn when the div container is
// hidden. Needs to load before any functions are called. 
google.charts.load('45', {'packages':['corechart']});
/** 
 * Draws a sentiment chart and adds it to the given element. 
 *  @param {Object} chartElement Tab element to update with the sentiment chart.
 *  @param {Object} results Results to use to update the sentiment chart.
 */
function drawSentimentChart(chartElement, results) {
  let sentimentDataArray = [["Search Result", "Score", {role: "style"}]];
  for (let i = 0; i < results.length; i++) {
    let sentimentItem = [(i + 1).toString(), results[i].score];
    results[i].score >= 0 ? sentimentItem.push(POSITIVE_COLOR) : 
        sentimentItem.push(NEGATIVE_COLOR);
    sentimentDataArray.push(sentimentItem);
  }

  let sentimentDataTable = google.visualization.arrayToDataTable(sentimentDataArray);
  let view = new google.visualization.DataView(sentimentDataTable);
  view.setColumns([0, 1, {
    calc: 'stringify',
    sourceColumn: 1,
    type: 'string',
    role: 'annotation',
  }, 2]);

  let options = {
    title: 'Sentiment Scores of Search Results',
    width: 750,
    height: 400,
    bar: {groupWidth: '55%'},
    legend: {position: 'none'},
    hAxis: {title: 'Search Results Index'},
  };
  let chart = new google.visualization.ColumnChart(chartElement);
  chart.draw(view, options);
}