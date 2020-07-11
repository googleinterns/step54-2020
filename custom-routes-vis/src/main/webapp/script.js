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

// Array holding origin and destination markers.
let markers = []

/** Creates the world map and markers. */
function createWorldMap() {
  map = new google.maps.Map(
    document.getElementById('map'),
    {center: {lat: 38.46049, lng: -5.428423}, zoom: 10});
  
  // Create origin and destination markers, but hides them until user selects
  // coordinates.
  createMarker('origin-coordinates', 'A', 'Origin',  {lat: 0.0, lng: 0.0});
  createMarker('destination-coordinates', 'B', 'Destination',
      {lat: 0.0, lng: 0.0});
}

/**
 * Creates hidden marker that updates coordiantes on page when moved.
 * @param {string} containerId id of container to update coordinates in.
 * @param {string} label Label to display on container.
 * @param {Object} latLng Default coordinates of where to place marker.
 */
function createMarker (containerId, label, title, latLng) {
  let marker = new google.maps.Marker({
    draggable: true,
    label: label,
    map: map,
    position: latLng,
    title: title,
    visible: false,
  });
  // Add marker to markers array to access in other functions.
  markers.push(marker);

  marker.addListener('dragend', function(event){
    updateCoordinates(event.latLng.lat(), event.latLng.lng(), containerId);
  });
}

/**
 * Updates the displayed coordinates on the page.
 * @param {string} containerId id of container to update coordinates in.
 */
function updateCoordinates(lat, lng, containerId) {
  document.getElementById(containerId).innerHTML = 
      "Latitude: " + lat + "<br>Longitude: " + lng + "<br>";
}

/**
 * Hides 'place marker' button and waits for user to select coordinate for
 * marker. Updates marker to be in correct location, and show 'delete marker'
 * button.
 * @param {int} markerIndex Index of corresponding marker in markers array.
 */
function showMarker(markerIndex) {
  let containerName = ((markerIndex === 0) ? 'origin' : 'destination');
  let placeMarkerListener = google.maps.event.addListener(map, 'click', 
      function (event) {
    markers[markerIndex].setPosition(event.latLng);
    google.maps.event.removeListener(placeMarkerListener);
    markers[markerIndex].setVisible(true);
    updateCoordinates(event.latLng.lat(), event.latLng.lng(),
        containerName + '-coordinates');
    document.getElementById('hide-' + containerName + '-marker')
        .style.display = 'block';

    // Display generate routes button when both markers have been placed.
    if (document.getElementById('hide-' + 
        ((markerIndex !== 0) ? 'origin' : 'destination') + '-marker')
            .style.display === 'block') {
      document.getElementById('generate-routes').style.display = 'block';
    }
  });

  let containerToHide =
      'show-' + ((markerIndex === 0) ? 'origin' : 'destination') + '-marker';
  document.getElementById(containerToHide).style.display = 'none';
  document.getElementById(containerName + '-coordinates').innerHTML =
      'Click the map to select location!';
}

/**
 * Hides specified marker and toggles buttons to show 'place marker' button.
 * @param {int} markerIndex Index of corresponding marker in markers array.
 */
function hideMarker(markerIndex) {
  markers[markerIndex].setVisible(false);
  let containerName = ((markerIndex === 0) ? 'origin' : 'destination');
  document.getElementById(containerName + '-coordinates').innerHTML = '';
  document.getElementById('show-' + containerName + '-marker').style.display =
      'block';
  document.getElementById('hide-' + containerName + '-marker').style.display =
      'none';
  document.getElementById('generate-routes').style.display = 'none';
}

function generateRoutes() {
  // get coordinates
  // make api call
  fetch('https://maps.googleapis.com/maps/api/directions/json?'
      + 'origin=Toronto&destination=Montreal' +
      + '&key=' + process.env.DIRECTIONS_API_KEY).then(response => {
    console.log(response);
  }).catch(error => {
    console.log(error);
  });
}