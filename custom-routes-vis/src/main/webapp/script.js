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

/** Creates the world map and markers. */
function createWorldMap() {
  map = new google.maps.Map(
    document.getElementById('map'),
    {center: {lat: 38.46049, lng: -5.428423}, zoom: 3});
  
  // First click creates origin marker, second click creates destination
  // marker. Removes listener after first two clicks.
  let clickCount = 0;
  let placeOriginListener = google.maps.event.addListener(map, 'click', 
      function (event) {
    if (clickCount == 0) {
      createMarker('origin-coordinates', 'Origin', event.latLng);
      clickCount++;
    } else if (clickCount == 1) {
      createMarker('destination-coordinates', 'Destination', event.latLng);
      clickCount++;
`   } else {`
      google.maps.event.removeListener(placeOriginListener);
    }
  });
}

/**
 * Creates marker that updates coordiantes on page when moved.
 * @param {string} containerId id of container to update coordinates in.
 * @param {string} label Label to display on container.
 * @param {Object} latLng Coordinates of where user clicked.
 */
function createMarker (containerId, label, latLng) {
  updateCoordinates(latLng.lat(), latLng.lng(), containerId);

  let marker = new google.maps.Marker({
    position: latLng,
    map: map,
    draggable: true,
    label: label,
  });

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