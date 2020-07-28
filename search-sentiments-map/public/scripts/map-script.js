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

let mapStyle = [{
  'stylers': [{'visibility': 'off'}],
}, {
  'featureType': 'landscape',
  'elementType': 'geometry',
  'stylers': [{'visibility': 'on'}, {'color': '#fcfcfc'}],
}, {
  'featureType': 'water',
  'elementType': 'geometry',
  'stylers': [{'visibility': 'on'}, {'color': '#bfd4ff'}],
}];
let map;
let infowindow;

const WORLD = {
  CENTER_COORDINATES: {lat: 29.246630, lng: 29.678410},
  ZOOM_LEVEL: 3,
  GEOJSON: 'countries.geojson',
};

const US = {
  CENTER_COORDINATES: {lat: 39.844724, lng: -92.019078},
  ZOOM_LEVEL: 5,
  GEOJSON: 'https://storage.googleapis.com/mapsdevsite/json/states.js',
  SELECT_VALUE: 'us',
};

// Whether the map is currently in sentiment mode or popularity mode.
let isSentimentMode = true;

// Whether the map is zoomed on world level or US states level.
let isWorldLevel = true;

function getIsWorldLevel() {
  return isWorldLevel;
}

// Multiplier for sentiment scores.
const SCORE_SCALE_MULTIPLIER = 100;
// The default score assigned to countries with no search results.
const NO_RESULTS_DEFAULT_SCORE = -500;

/* 
 * Hold the minimum and maximum values of the sentiment scores.
 * The sentiment API returns scores from -1.0 to 1.0. Our value is these max
 * and min scores multiplied by our score multiplier.
 */
const DATA_MAX = SCORE_SCALE_MULTIPLIER * 1.0;
const DATA_MIN_SENTIMENT = SCORE_SCALE_MULTIPLIER  * -1.0;
const DATA_MIN_POPULARITY = 0;

/**
 * HSL color codes for region colorings.
 * @enum {Array}
 */
const RegionColorCodes = {
  GREEN: [114, 80, 39],
  RED: [5, 69, 54],
  DARK_GRAY: [0, 0, 31], 
  LIGHT_GRAY: [62, 1, 83],
};

/** Loads the map with country polygons when page loads. */
function initMap() {
  // Enable the popover dialogues on hover.
  $(document).ready(function(){
    $('[data-toggle="popover"]').popover();   
  });

  map = new google.maps.Map(document.getElementById('map'), {
    center: WORLD.CENTER_COORDINATES,
    zoom: WORLD.ZOOM_LEVEL,
    styles: mapStyle,
    mapTypeControl: false,
  });
  map.controls[google.maps.ControlPosition.BOTTOM_LEFT]
      .push(document.getElementById('legend'));
  map.controls[google.maps.ControlPosition.BOTTOM_RIGHT]
      .push(document.getElementById('timeline-slider-div'));

  infowindow = new google.maps.InfoWindow({});

  // Set up the style rules and events for google.maps.Data.
  map.data.setStyle(styleFeature);
  map.data.addListener('mouseover', mouseInToRegion);
  map.data.addListener('mouseout', mouseOutOfRegion);
  map.data.addListener('click', onClickRegion);

  // Loads the country boundary polygons from a GeoJSON source.
  map.data.loadGeoJson(WORLD.GEOJSON);
}

/** Update the map legend's max and min values. */
function updateLegends() {
  let dataMin = isSentimentMode ? DATA_MIN_SENTIMENT : DATA_MIN_POPULARITY;
  document.getElementById('data-min').textContent =
      dataMin.toLocaleString();
  document.getElementById('data-max').textContent =
      DATA_MAX.toLocaleString();
}

/** 
 * Gets the selected mode (sentiment or popularity) from the webpage and loads
 * corresponding data on the map.
 */
function loadRegionDataByMode() {
  const topicHeader = document.getElementById('topic-header');
  if (isWorldLevel) {
    isSentimentMode = !document.getElementById('sentiment-popularity-check').checked;
    topicHeader.innerText = isSentimentMode ?
        'Worldwide sentiment scores of search results for "' + getCurrentTopic() + '"' :
        'Worldwide search interest scores for "' + getCurrentTopic() + '"';
  } else {
    isSentimentMode = false;  // Sentiment mode is not available at US level.    
    topicHeader.innerText = 
        'State-level search interest scores for "' + getCurrentTopic() + '"';
  }
  updateLegends();

  isWorldLevel ?  loadCountryData() : loadStateData();
}

/** 
 * Loads the sentiments or search interests for all countries from Datastore 
 * depending on what mode has been specified.
 */
function loadCountryData() {
  // Minimum and maximum scores for current topic. 
  let dataVariableMax = Number.MIN_VALUE;  // Smallest positive number.
  let dataVariableMin = Number.MAX_VALUE;
  // Countries with the minimum and maximum scores for current topic. 
  let countryMax = '';
  let countryMin = '';

  map.data.forEach(row => {
    let countryData = getCurrentSearchData().dataByCountry
        .filter(data => data.country === row.getId());
    const country = row.getProperty('name');
    let dataVariable = null;
    if (countryData.length !== 0) {
      dataVariable = 
          isSentimentMode ? countryData[0].averageSentiment : countryData[0].interest;
      if (dataVariable > dataVariableMax) {
        dataVariableMax = dataVariable;
        countryMax = country;
      }
      if (dataVariable < dataVariableMin && 
          dataVariable !== NO_RESULTS_DEFAULT_SCORE) {
        dataVariableMin = dataVariable;
        countryMin = country;
      }
    }

    row.setProperty('country_data', dataVariable);
  });

  document.getElementById('extrema-sentiment').innerText = 
      isSentimentMode ?
          'Most Positive Country: ' + countryMax + ', Most Negative Country: ' + countryMin :
          'Most Popular Country: ' + countryMax;
}

/** Loads the search interest data for US states on the map. */
function loadStateData() {
  // Minimum and maximum scores for current topic. 
  let dataVariableMax = Number.MIN_VALUE;
  let dataVariableMin = Number.MAX_VALUE; 
  // States with the minimum and maximum scores for current topic. 
  let stateMax = '';
  let stateMin = '';

  let stateInterests = getCurrentSearchData();
  map.data.forEach(function(row) {
    let stateName = row.getProperty('NAME');
    let interest = stateInterests.filter(stateInterest => 
        stateInterest.geoName === stateName);
    let dataVariable = interest.length === 0 ? 
        NO_RESULTS_DEFAULT_SCORE : interest[0].value[0];

    if (dataVariable > dataVariableMax) {
      dataVariableMax = dataVariable;
      stateMax = stateName;
    }
    if (dataVariable < dataVariableMin && 
        dataVariable !== NO_RESULTS_DEFAULT_SCORE) {
      dataVariableMin = dataVariable;
      stateMin = stateName;
    }

    row.setProperty('state_data', dataVariable);
  });

  document.getElementById('extrema-sentiment').innerText = 
      'Most Popular State: ' + stateMax;
}

/**
 * Applies a gradient style based on the 'country_data' or 'state_data' column.
 * This is the callback passed to data.setStyle() and is called for each row in
 * the data set.
 * @param {google.maps.Data.Feature} feature
 * @return {googe.maps.Data.StyleOptions} Styling information for feature.
 */
function styleFeature(feature) {
  let low = RegionColorCodes.RED;
  let high = RegionColorCodes.GREEN;
  let color = [];
  let regionData = isWorldLevel ? 
      feature.getProperty('country_data') : feature.getProperty('state_data');

  if (regionData == null) {
    // Set region color to be light grey if that region is disabled (occurs in
    // user search for countries not selected).
    color = RegionColorCodes.LIGHT_GRAY;
  } else if (regionData === NO_RESULTS_DEFAULT_SCORE) {
    // Set region color to be dark grey if that region has no results.
    color = RegionColorCodes.DARK_GRAY;
  } else {
    let dataMin = isSentimentMode ? DATA_MIN_SENTIMENT : DATA_MIN_POPULARITY;  
    // Delta represents where the value sits between the min and max.
    let delta = (regionData - dataMin) / (DATA_MAX - dataMin);
    color = [];
    // Calculate hsl color integer values based on the delta.
    for (let i = 0; i < high.length; i++) {
      color[i] = (high[i] - low[i]) * delta + low[i];
    }
  }

  let outlineWeight = 0.5, zIndex = 1;
  if (feature.getProperty('status') === 'hover') {
    outlineWeight = zIndex = 2;
  }

  return {
    fillColor: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)',
    fillOpacity: 0.75,
    strokeColor: '#fff',
    strokeWeight: outlineWeight,
    visible: true,
    zIndex: zIndex,
  };
}

/**
 * Responds to the mouse-in event on a map shape (country or state).
 * @param {?google.maps.MouseEvent} e Mouse-in event.
 */
function mouseInToRegion(e) {
  let regionData = 
      isWorldLevel ? 
          e.feature.getProperty('country_data') : 
          e.feature.getProperty('state_data');

  if (regionData == null) {
    return;
  }
  // Set the hover region so the `setStyle` function can change the border.
  e.feature.setProperty('status', 'hover');
  regionInfo = 
      isWorldLevel ? 
          e.feature.getProperty('name') + ': ' : 
          e.feature.getProperty('NAME') + ': ';

  // Display "N/A" on hover when there are no results and thererfore the
  // sentiment score is the no results default score.
  regionInfo +=
      ((regionData === NO_RESULTS_DEFAULT_SCORE) ?
          "N/A" : regionData.toLocaleString());

  // Add popup info window with region info.
  infowindow.setContent(regionInfo);
  infowindow.setPosition(e.latLng);
  infowindow.open(map);
}

/**
 * Responds to the mouse-out event on a map shape (country or state).
 * @param {?google.maps.MouseEvent} e Mouse-out event.
 */
function mouseOutOfRegion(e) {
  // Reset the hover status, returning the border to normal. Close infowindow.
  e.feature.setProperty('status', 'normal');
  infowindow.close();
}

/**
 * Resets the map according to the zoom level (US or world) selected by the 
 * user by adjusting the map center, zoom level, polygons, and displayed data.
 */
function resetMapZoomLevel() {
  const zoomLevel = document.getElementById('zoom-level-select').value;
  // Clear the previous map features.
  map.data.forEach(function(feature) {
    map.data.remove(feature);
  });
  toggleDisplay('switch-trends-click');
  toggleDisplay('switch-div');
  toggleDisplay('country-dropdown-button');

  if (zoomLevel === US.SELECT_VALUE) {
    map.setCenter(US.CENTER_COORDINATES);
    map.setZoom(US.ZOOM_LEVEL);
    isWorldLevel = false;
    isSentimentMode = false;  // Sentiment mode is not available at US level.

    map.data.loadGeoJson(US.GEOJSON, {idPropertyName: 'gx_id'}, function() {
      updateUsTrendsAndDisplayFirst();
    });
  } else { // Reset the map to world level.
    map.setCenter(WORLD.CENTER_COORDINATES);
    map.setZoom(WORLD.ZOOM_LEVEL);
    isWorldLevel = true;

    map.data.loadGeoJson(WORLD.GEOJSON, null, function() {
      updateGlobalTrendsAndDisplayFirst();
    });
  }
}