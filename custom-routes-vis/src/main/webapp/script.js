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
let route;

var map;

/** Creates the world map and markers. */
function initMap() {
  var chicago = new google.maps.LatLng(41.850033, -87.6500523);
  var mapOptions = {
    zoom:7,
    center: chicago,
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);

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
    if (markers.length == 2 && markers[0].getVisible() && markers[1].getVisible()) {
      generateRoutes();
    }
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
  if (route != null) {
    route.setVisible(false);
  }

  let containerName = ((markerIndex === 0) ? 'origin' : 'destination');
  document.getElementById(containerName + '-coordinates').innerHTML = '';
  document.getElementById('show-' + containerName + '-marker').style.display =
      'block';
  document.getElementById('hide-' + containerName + '-marker').style.display =
      'none';
  document.getElementById('generate-routes').style.display = 'none';
}

/** Precondition: two markers exist in the markers array. */
function generateRoutes() {
  if (route != null) {
    route.setVisible(false);  // Remove the current route from the DOM.
  }

  // Get coordinates of origin and destination.
  let startLatLng = markers[0].getPosition();
  let endLatLng = markers[1].getPosition();
  let origin = startLatLng.lat() + ',' + startLatLng.lng();
  let destination = endLatLng.lat() + ',' + endLatLng.lng();

  // Get the route and display on map.
  let routeCoordinates = [];
  fetch('/get-directions?origin=' + origin + '&destination=' + destination)
      .then(response => response.json()).then(directions => {
        console.log(directions.status);
        let routes = directions.routes;
        console.log('num routes:', routes.length);

        let firstRouteLegs = routes[0].legs;
        console.log('num legs', firstRouteLegs.length);

        for (let i = 0; i < firstRouteLegs.length; i++) {
          let legSteps = firstRouteLegs[i].steps;
          console.log('num steps', legSteps.length);

          for (let j = 0; j < legSteps.length; j++) {
            routeCoordinates.push(legSteps[j].start_location);
          }
          if (i == firstRouteLegs.length - 1) {
            routeCoordinates.push(legSteps[legSteps.length - 1].end_location);
          }
        }

        route = new google.maps.Polyline({
          path: routeCoordinates,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2
        });
        route.setMap(map);
    });
}