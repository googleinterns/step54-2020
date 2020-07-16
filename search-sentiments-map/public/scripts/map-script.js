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
/* 
 * Hold the minimum and maximum values of the sentiment scores.
 * The sentiment API returns scores from -1.0 to 1.0.
 */

 // TODO(ntarn@): Change this to 100 and -100 when sentiment scores rescaled.
const DATAMIN = 1.0;
const DATAMAX = -1.0;

/** Loads the map with country polygons when page loads. */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 29.246630, lng: 29.678410 },
    zoom: 3,
    styles: mapStyle,
    mapTypeControl: false,
  });
  map.controls[google.maps.ControlPosition.BOTTOM_LEFT]
      .push(document.getElementById('legend'));
  // Update and display the map legend.
  document.getElementById('data-min').textContent =
      DATAMIN.toLocaleString();
  document.getElementById('data-max').textContent =
      DATAMAX.toLocaleString();

  infowindow = new google.maps.InfoWindow({});

  // Set up the style rules and events for google.maps.Data.
  map.data.setStyle(styleFeature);
  map.data.addListener('mouseover', mouseInToRegion);
  map.data.addListener('mouseout', mouseOutOfRegion);
  map.data.addListener('click', onClickCountry);

  loadMapOutline();
}

/** Loads the country boundary polygons from a GeoJSON source. */
function loadMapOutline() {
  // Load country data after finished loading in geojson.
  map.data.loadGeoJson('countries.geojson', null, function () {
    setNewTrend();
  });
}

/** Loads the country sentiment score from Datastore. */
function loadCountryData() {
  map.data.forEach(function (row) {
    const countryCode = row.getId();
    let topicData = getCurrentCustomSearchData();
    let countryData = topicData.countries
      .filter(countries => countries.country === countryCode);
    let dataVariable = 0;
    if (countryData.length != 0) {
      dataVariable = countryData[0].averageSentiment;
    } else {
      dataVariable = null;
    }

    row.setProperty('country_data', dataVariable);
  });
}

/**
 * Applies a gradient style based on the 'country_data' column. This is the
 * callback passed to data.setStyle() and is called for each row in the data
 * set.
 * @param {google.maps.Data.Feature} feature
 * @returns {googe.maps.Data.StyleOptions} styling information for feature
 */
function styleFeature(feature) {
  let high = [5, 69, 54];  // Color of largest datum.
  let low = [151, 83, 34]; // Color of smallest datum.
  let color = [];
  let countryData = feature.getProperty('country_data');

  if (countryData == null) {
    // Set country color to be light grey if that country is disabled(occurs in
    // user search).
    color = [62, 1, 83];
  } else if (countryData === -500) {
    // Set country color to be dark grey if that coutnry has no results.
    color = [0, 0, 31];  
  } else if (countryData != null) {
    // Delta represents where the value sits between the min and max.
    let delta = (countryData - DATAMIN) /
        (DATAMAX - DATAMIN);

    color = [];
    for (let i = 0; i < 3; i++) {
      // Calculate an integer color based on the delta.
      color[i] = (high[i] - low[i]) * delta + low[i];
    }
  }

  let outlineWeight = 0.5, zIndex = 1;
  if (feature.getProperty('country') === 'hover') {
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
 * Responds to the mouse-in event on a map shape(country).
 * @param {?google.maps.MouseEvent} e Mouse-in event.
 */
function mouseInToRegion(e) {
  let countryData = e.feature.getProperty('country_data');
  // Add popup info window with country info.
  if (countryData != null) {
    // Set the hover country so the setStyle function can change the border.
    e.feature.setProperty('country', 'hover');
    countryInfo = e.feature.getProperty('name') + ': ';

    // Display "N/A" on hover when countryData is -500, the value signifying
    // there were no results.
    countryInfo +=
        ((countryData === -500) ? "N/A" : countryData.toLocaleString());

    infowindow.setContent(countryInfo);
    infowindow.setPosition(e.latLng);
    infowindow.open(map);
  }
}

/**
 * Responds to the mouse-out event on a map shape (country).
 * @param {?google.maps.MouseEvent} e Mouse-out event.
 */
function mouseOutOfRegion(e) {
  // Reset the hover country, returning the border to normal. Close infowindow.
  e.feature.setProperty('country', 'normal');
  infowindow.close();
}