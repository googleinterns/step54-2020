// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const LATLNG = {lat: 0.0, lng: 0.0};

/**
 * Marker names.
 * @enum {string}
 */
const MarkerNames = {
  ORIGIN: 'origin',
  DESTINATION: 'destination',
};

const IOS_URL_ID = 'ios-url';
const V1_ANDROID_URL_ID = 'v1-android-url';
const V2_ANDROID_URL_ID = 'v2-android-url';
// Array holding origin and destination markers.
let originDestinationMarkers = []

/** Creates the world map with markers. */
function createWorldMapWithMarkers() {
  map = new google.maps.Map(
    document.getElementById('map'),
    {center: {lat: 38.46049, lng: -5.428423}, zoom: 3});
  
  // Create origin and destination markers, but hides them until user selects
  // coordinates.
  createMarker('origin-coordinates', 'A', 'Origin', LATLNG);
  createMarker('destination-coordinates', 'B', 'Destination', LATLNG);
}

/**
 * Creates hidden marker that updates coordiantes on page when moved.
 * @param {string} containerId ID of container to update coordinates in.
 * @param {string} label Label to display on container.
 * @param {Object} title Title of marker.
 * @param {Object} latLng Default coordinates of where to place marker.
 */
function createMarker(containerId, label, title, latLng) {
  let marker = new google.maps.Marker({
    draggable: true,
    label: label,
    map: map,
    position: latLng,
    title: title,
    visible: false,
  });
  // Add marker to originDestinationMarkers array to access in other functions.
  originDestinationMarkers.push(marker);

  marker.addListener('dragend', function(event){
    updateCoordinates(event.latLng.lat(), event.latLng.lng(), containerId);
    updateDeepLinkingUrl();
  });
}

/**
 * Updates the displayed coordinates on the page.
 * @param {num} lat Latitude coordinates of where to place marker.
 * @param {num} lng Longitude coordinates of where to place marker.
 * @param {string} containerId ID of container to update coordinates in.
 */
function updateCoordinates(lat, lng, containerId) {
  document.getElementById(containerId).innerHTML = 
      "Latitude: " + lat + "<br>Longitude: " + lng + "<br>";
}

/**
 * Updates the deep linking url to various test apps on the page.
 */
function updateDeepLinkingUrl() {
  var originPosition = originDestinationMarkers[0].position;
  var destinationPosition = originDestinationMarkers[1]
  if (document.getElementById('origin-coordinates').innerHTML !== '' && 
      document.getElementById('destination-coordinates').innerHTML !== '') {
    document.getElementById(IOS_URL_ID).innerHTML =
        '<a href=navsdkdemo://advanced?originLat=' + originDestinationMarkers[0].position.lat() + 
        '&originLng=' + originDestinationMarkers[0].position.lng() + '&destLat=' +
        originDestinationMarkers[1].position.lat() + '&destLng=' +
        // TODO: Update Route Token if we get access to Routes Preferred API.
        originDestinationMarkers[1].position.lng() + '&routeToken=TOKEN>' +  
        'IOS Test App' + '</a>';
    document.getElementById(V1_ANDROID_URL_ID).innerHTML =
        '<a href=navsdk://fragmentactivity?originlat=' + originDestinationMarkers[0].position.lat() +
        '&originlng=' + originDestinationMarkers[0].position.lng() + '&destinationlat=' +
        originDestinationMarkers[1].position.lat() + '&destinationlng=' +
        // TODO: Update Route Token if we get access to Routes Preferred API.
        originDestinationMarkers[1].position.lng() + '&precomputedroutetoken=TOKEN>' +
        'Android V1 Test App' + '</a>';
    document.getElementById(V2_ANDROID_URL_ID).innerHTML =
        '<a href=navsdk://supportnavmapfragmentactivity?originlat=' +
        originDestinationMarkers[0].position.lat() + '&originlng=' +
        originDestinationMarkers[0].position.lng() + '&destinationlat=' +
        originDestinationMarkers[1].position.lat() + '&destinationlng=' + 
        // TODO: Update Route Token if we get access to Routes Preferred API.
        originDestinationMarkers[1].position.lng() + '&precomputedroutetoken=TOKEN>' +
        'Android V2 Test App' + '</a>';
  } else if (document.getElementById('origin-coordinates').innerHTML === '' || 
      document.getElementById('destination-coordinates').innerHTML === '') { 
    document.getElementById(IOS_URL_ID).innerHTML = '';
    document.getElementById(V1_ANDROID_URL_ID).innerHTML = '';
    document.getElementById(V2_ANDROID_URL_ID).innerHTML = '';
  }
  
}
/**
 * Hides 'place marker' button and waits for user to select coordinate for
 * marker. Updates marker to be in correct location, and show 'delete marker'
 * button.
 * @param {string} markerName Name of corresponding marker in
 *     originDestinationMarkers array.
 */
function showMarker(markerName) {
  let containerOfOtherMarkerName;
  let markerIndex;
  switch (markerName) {
    case MarkerNames.ORIGIN:
      containerOfOtherMarkerName =
          'hide-' + MarkerNames.DESTINATION + '-marker';
      markerIndex = 0;
      break;
    case MarkerNames.DESTINATION:
      containerOfOtherMarkerName = 
          'hide-' + MarkerNames.ORIGIN + '-marker';
      markerIndex = 1;
      break;
  }
  let placeMarkerListener =
      google.maps.event.addListener(map, 'click', function (event) {
        originDestinationMarkers[markerIndex].setPosition(event.latLng);
        google.maps.event.removeListener(placeMarkerListener);
        originDestinationMarkers[markerIndex].setVisible(true);
        updateCoordinates(event.latLng.lat(), event.latLng.lng(),
            markerName + '-coordinates');
        updateDeepLinkingUrl();
        document.getElementById('hide-' + markerName + '-marker')
            .style.display = 'block';

        // Display generate routes button when both markers have been placed.
        if (document.getElementById(containerOfOtherMarkerName)
                .style.display === 'block') {
          document.getElementById('generate-routes').style.display = 'block';
        }
      });

  document.getElementById('show-' + markerName + '-marker').style.display =
      'none';
  document.getElementById(markerName + '-coordinates').innerHTML =
      'Click the map to select location!';
}

/**
 * Hides specified marker and toggles buttons to show 'place marker' button.
 * @param {string} markerName Name of corresponding marker in
 *     originDestinationMarkers array.
 */
function hideMarker(markerName) {
  let markerIndex;
  switch (markerName) {
    case MarkerNames.ORIGIN:
      markerIndex = 0;
      break;
    case MarkerNames.DESTINATION:
      markerIndex = 1;
      break;
  }

  originDestinationMarkers[markerIndex].setVisible(false);
  document.getElementById(markerName + '-coordinates').innerHTML = '';
  document.getElementById('show-' + markerName + '-marker').style.display =
      'block';
  document.getElementById('hide-' + markerName + '-marker').style.display =
      'none';
  document.getElementById('generate-routes').style.display = 'none';
  updateDeepLinkingUrl();
}

/**
 * Generates routes from origin to destination by calling Directions API.
 */
function generateRoutes() {
  // TODO(chenyuz): Write this code in separate branch.
}