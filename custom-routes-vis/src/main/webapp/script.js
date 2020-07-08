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

/** Creates the world map. */
function createWorldMap() {
  map = new google.maps.Map(
    document.getElementById('map'),
    {center: {lat: 38.46049, lng: -5.428423}, zoom: 3});
  
  let clickCount = 0;
  let placeOriginListener = google.maps.event.addListener(map, 'click', function (event) {
    if (clickCount == 0) {
      updateCoordinates(event.latLng.lat(), event.latLng.lng(), 'origin-coordinates');

      let originMarker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        draggable: true,
        label: 'Origin',
      });

      originMarker.addListener('dragend', function(event){
        updateCoordinates(event.latLng.lat(), event.latLng.lng(), 'origin-coordinates');
      });
      clickCount++;
    } else if (clickCount == 1) {
      updateCoordinates(event.latLng.lat(), event.latLng.lng(), 'destination-coordinates');

      let destinationMarker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        draggable: true,
        label: 'Destination',
      });

      destinationMarker.addListener('dragend', function(event){
        updateCoordinates(event.latLng.lat(), event.latLng.lng(), 'destination-coordinates');
      });
      clickCount++;
`   } else {`
      google.maps.event.removeListener(placeOriginListener);
    }
  });
}

function updateCoordinates(lat, lng, containerId) {
  document.getElementById(containerId).innerHTML =  "Latitude: " + lat + "<br>Longitude: " + lng;
}