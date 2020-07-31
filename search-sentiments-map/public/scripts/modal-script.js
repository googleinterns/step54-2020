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
// The country code for the country that the user has selected.
let countryCode = '';
// The cache for the popularity timeline data.
let cachePopularityTimeline = {};
 
// Create trigger to resizeEnd event.     
$(window).resize(function() {
    if (this.resizeTO) clearTimeout(this.resizeTO);
    this.resizeTO = setTimeout(function() {
      $(this).trigger('resizeEnd');
    }, 250);
});
 
// Redraw graph when window resize is completed. 
$(window).on('resizeEnd', function() {
  if (countryCode !== ''){
    google.charts.setOnLoadCallback(setSentimentChartForCurrentTrend);
    google.charts.setOnLoadCallback(setPopularityTimeline); 
  }
});

/**
 * Displays the information modal when a region on the map is clicked.
 * @param {?google.maps.MouseEvent} e Click event.
 */
function onClickRegion(e) {
  // Don't display anything when the map is on state level, or when the clicked
  // country has no data.
  if (e.feature.getProperty('country_data') == null) {
    return;
  }
  $('#region-info-modal').modal('show');
 
  // Update Modal with information for relevant country.
  const countryName = e.feature.getProperty('name');
  const countryId = e.feature.getId();
  countryCode = e.feature.getId();
  document.getElementById('modal-title').innerText = countryName;
  displayTopResultsForCurrentTrend(countryId);
  setCountryTrends(countryId);
}


/**
 * Loads the chart only when the tab is clicked on in order to get a width from 
 * the parent containers.
 */
function loadCharts() {
    $('#sentiment-chart-link').on('shown.bs.tab', function(){
      setSentimentChartForCurrentTrend();
    });

    $('#popularity-timeline-link').on('shown.bs.tab', function(){
      setPopularityTimeline();
    });
}
 
/**
 * Sets trends under the top-trends modal tab for the selected country.
 * @param {string} countryCode The two-letter code of the selected country.
 */
function setCountryTrends(countryCode) {
  const topTrendsTab = document.getElementById('top-trends-tab');
  topTrendsTab.innerHTML = '<h4>Trending topics in selected country: </h4>';
  fetch('/country-trends/' + getCurrentTimeRange() + '/' + countryCode)
      .then(countryTrends => countryTrends.json())
      .then(trends => {
        if (trends.length === 0) {
          topTrendsTab.innerHTML = 
              'Trends are not available for the selected country.<br>';
        } else {
          for (let i = 0; i < trends.length; i++) {
            let articlesId = 'trend' + i + 'Article';
            let articlesHtml = '';
            trends[i].articles.forEach(article => {
              articlesHtml += '<li><a href="' + article.url + '">' + 
                  article.title + '</a></li>';
            })
            let exploreLink = 
                'https://trends.google.com' + trends[i].exploreLink;
            articlesHtml += 'Click <a href=' + exploreLink + 
                '>here</a> to explore the topic on google trends website.';
            topTrendsTab.innerHTML += 
                '<h5 class="country-trend" onclick="toggleDisplay(\''+
                articlesId + '\')">' + trends[i].topic + '</h5>' +
                '<i>' + trends[i].traffic + ' searches</i><br>' + '<ul id="' +
                articlesId + '" class="hidden">' + articlesHtml + '</ul>';
          }
        }
        topTrendsTab.innerHTML += 
            '<i>Last updated on ' + new Date(getCurrentTopTrends().timestamp) +
            '</i>';
      });
}

/** Toggles whether the element with the given id is displayed or not. */
function toggleDisplay(id) {
  document.getElementById(id).classList.toggle('hidden');
}
 
/** 
 * Displays the top results in a country for the current search trend on modal
 * and show positive words if the sign of the sentiment score is positive,
 * and negative words if the sign is negative. 
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
      let snippet = results[i].snippet;
      await fetch('/sentiment-words/' + encodeURIComponent(snippet))
          .then(resultsJsonArray => resultsJsonArray.json())
          .then(sentimentWordsResult => {
            // i + 1 shows the index for each search result.
            resultElement.innerHTML += (i + 1).toString() + '. ' + '<a href=' + 
                results[i].link + '>' + results[i].htmlTitle + '</a><br>';

            // Check that positive and negative words are detected by the Node.js 
            // sentiment API.
            if (sentimentWordsResult != null) {
              let positiveWords = sentimentWordsResult.positive;
              let negativeWords = sentimentWordsResult.negative;
              if (results[i].score > 0 && positiveWords.length !== 0) {
                highlightWords(
                  snippet, new Set(positiveWords), true, resultElement);
              } else if (results[i].score < 0 && negativeWords.length !== 0) {
                highlightWords(
                  snippet, new Set(negativeWords), false, resultElement);
              } else {
                resultElement.innerHTML += snippet;
              }
            }
            resultElement.innerHTML += '<br><i>Sentiment Score: ' + 
                  results[i].score.toFixed(1) + '</i><br>';
          }).catch((err) => {
            console.log(err);
          });	     
    }
  }
  resultElement.innerHTML += '<i>Last updated on ' + date + '</i>';
}

/**
 * Highlights the positive words green if the sign of the sentiment score 
 * is positive and negative words red if the sign is negative.
 * @param {string} snippet Snippet to display in the search results tab.
 * @param {Set} wordsToHighlight Words to highlight a different color.
 * @param {boolean} scoreIsPositive Boolean for whether or not the sentiment 
 *     score is positive.
 * @param {Object} resultElement Tab element to update with the search result 
 *     snippet.
 */
function highlightWords(
    snippet, wordsToHighlight, scoreIsPositive, resultElement) {
  let startDisplayingSnippetIndex = 0;
  wordsToHighlight.forEach((word) => {
    // The sentiment node.js module always returns the positive or negative 
    // words in lowercase, so we only change the snippet to lowercase.
    let wordIndex = snippet.toLowerCase().indexOf(word);
    if (wordIndex !== -1){
      let highlight = '<span style="color: ' +
          (scoreIsPositive ? POSITIVE_COLOR : NEGATIVE_COLOR) +
          ';">' + snippet.substring(wordIndex,  wordIndex + word.length) +
          '</span>';
      snippet = snippet.replace(new RegExp('\\b' + word + '\\b', 'gi'), highlight);
    }
  });
  resultElement.innerHTML += snippet;
}

/** 
 * Sets the popularity timeline for the current search topic in the 
 * selected country's modal.
 */
function setPopularityTimeline() {
  const popularityTimelineElement = document.getElementById('popularity-timeline-tab');
  popularityTimelineElement.innerHTML = '';
  postTrendsToGetPopularityTimelineData(getCurrentSearchData().topic, countryCode)
      .then(timelineJSON => {
        if (timelineJSON.default.timelineData.length === 0) {
          popularityTimelineElement.innerText = 
              'Popularity Timeline is not available for the selected country.';
        } else {
          drawPopularityTimeline(
              timelineJSON.default.timelineData, popularityTimelineElement, 
              getCurrentSearchData().topic);
       }
  });
}	

// function setPopularityTimeline() {
//   const popularityTimelineElement = document.getElementById('popularity-timeline-tab');
//   popularityTimelineElement.innerHTML = '';
//   postTrendsToGetPopularityTimelineData(
//       getCurrentSearchData().topic, countryCode, popularityTimelineElement)
//       .then(timelineJSON => {
//         if (timelineJSON.length === 0) {
//             popularityTimelineElement.innerText = 
//                 'Popularity Timeline is not available for the selected country.';
//         } else {
//           drawPopularityTimeline(
//               timelineJSON.default.timelineData, popularityTimelineElement, 
//               getCurrentSearchData().topic);
//         }
//       }).catch((err) => {
//         console.log(err);
//       });	 
      
// }
/** 
 * Gets the popularity timeline data from the Google Trends API if it is not
 * stored in the local cache. Prevents making too many calls to the API if the 
 * user continuously resizes the window.
 * @param {string} topic The search topic that the popularity timeline is based on.
 * @param {string} countryCode Two letter country code for selected country.
 * @param {Object} popularityTimelineElement The element where the popularity 
 * timeline is updated.
 * @return {Promise} The promise which resolves to the the timeline JSON data.
 */
function postTrendsToGetPopularityTimelineData(topic, countryCode, popularityTimelineElement) {
  // Check if counctry code and topic is in the cache already.
  if (cachePopularityTimeline[topic]) {
    return Promise.resolve(cachePopularityTimeline[topic][countryCode]);
  }
  return fetch('/trends/', { 
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic,
      code: countryCode,
    }),
  })
  .then(interestData => interestData.json())
  .then(timelineJSON => {
    if (!cachePopularityTimeline[topic]) {
      cachePopularityTimeline[topic] = {};
    }
    // For each search topic, you cache the result of the fetch.
    // Example: {Sophie Turner: {US: timelineJSON}}
    cachePopularityTimeline[topic][countryCode] = timelineJSON;
    return timelineJSON;
  }).catch((err) => {
    console.log(err);
  });	 
}

/** 
 * Draw the popularity timeline in a country for the current search trend on
 * modal.
 * @param {!Array<JSON>} timelineData The past week's search interest data for 
 * the given topic.
 * @param {Object} popularityTimelineElement The element where the popularity 
 * timeline is updated.
 * @param {String} topic The search topic that the popularity timeline is based on.
 */
function drawPopularityTimeline(timelineData, popularityTimelineElement, topic) {
  var data = new google.visualization.DataTable();
  data.addColumn('string');
  data.addColumn('number');
  for (let i = 0; i < timelineData.length; i++) {
    data.addRows([[timelineData[i].formattedAxisTime, timelineData[i].value[0]]]);
  }
  var options = {
    title: 'Popularity of ' + topic,
    legend: {position: 'none'},
    hAxis: {
      title: 'Date',
    },
    vAxis: {
      title: 'Popularity',
      ticks: [0, 20 , 40, 60, 80, 100],
    },
    trendlines: {
      0: {type: 'exponential', color: '#333', opacity: 1},
      1: {type: 'linear', color: '#111', opacity: .3},
    },
  };
  var chart = new google.visualization.LineChart(popularityTimelineElement);
  chart.draw(data, options);
}
 
/** 
 * Sets sentiment chart of search results for the current country on the modal.
 * @param {string} countryCode Two letter country code for selected country.
 */
function setSentimentChartForCurrentTrend() {
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
 
/** 
 * Draws a sentiment chart and adds it to the given element. 
 * @param {Object} chartElement Tab element to update with the sentiment chart.
 * @param {Object} results Results to use to update the sentiment chart.
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
    bar: {groupWidth: '55%'},
    legend: {position: 'none'},
    hAxis: {title: 'Search Results Index'},
  };
  let chart = new google.visualization.ColumnChart(chartElement);
  chart.draw(view, options);
}

