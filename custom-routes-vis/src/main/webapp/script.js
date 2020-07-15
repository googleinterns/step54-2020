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

let originDestinationMarkers = [];
let displayedRoutes = [];
const routeColors = ['#ff0000', '#f7cb52', '#3299d1'];
let selectedRouteNum = 0;
var map;

/** Creates the world map and markers. */
function initMapWithMarkers() {
  let chicago = new google.maps.LatLng(41.850033, -87.6500523);
  let mapOptions = {
    zoom: 7,
    center: chicago,
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);

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

  marker.addListener('dragend', function(event) {
    updateCoordinates(event.latLng.lat(), event.latLng.lng(), containerId);
    if (originDestinationMarkers.length == 2 
        && originDestinationMarkers[0].getVisible() 
        && originDestinationMarkers[1].getVisible()) {
      generateRoutes();
    }
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
      google.maps.event.addListener(map, 'click', function(event) {
        originDestinationMarkers[markerIndex].setPosition(event.latLng);
        google.maps.event.removeListener(placeMarkerListener);
        originDestinationMarkers[markerIndex].setVisible(true);
        updateCoordinates(event.latLng.lat(), event.latLng.lng(),
            markerName + '-coordinates');
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
  clearRoutes();

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
}

/** Removes all routes from the DOM. */
function clearRoutes() {
  for (let i = 0; i < displayedRoutes.length; i++) {
    console.log('removing route')
    displayedRoutes[i].setMap(null);
  }
  displayedRoutes = [];
  selectedRouteNum = 0;
}

/**
 * Generates routes from origin to destination by calling Directions API.
 * Precondition: two markers exist in the originDestinationMarkers array.
 */
function generateRoutes() {
  clearRoutes();

  // Get coordinates of origin and destination.
  let startLatLng = originDestinationMarkers[0].getPosition();
  let endLatLng = originDestinationMarkers[1].getPosition();
  let origin = startLatLng.lat() + ',' + startLatLng.lng();
  let destination = endLatLng.lat() + ',' + endLatLng.lng();

  let serviceEndpoint = document.getElementById('service-endpoint').value;
  let apiKey = document.getElementById('api-key').value;

  // Get the routes and display them on map.
  fetch('/get-directions?origin=' + origin + '&destination=' + destination
      + '&endpoint=' + serviceEndpoint + '&apiKey=' + apiKey)
      .then(response => response.json()).then(directions => {
        console.log(directions.status);
        let routes = directions.routes;
        console.log('num routes:', routes.length);

        for (let routeNum = 0; routeNum < routes.length; routeNum++) {
          let routeLegs = routes[routeNum].legs;
          console.log('num legs', routeLegs.length);
          createRoutePolyline(routeNum, routeLegs);
        }
      });
}

/** 
 * Creates a polyline for a route on the map.
 * @param {num} routeNum The index of the route in the order as it is returned 
 * from the API.
 * @param {!Array} routeLegs JSON array containing all information of legs of 
 * the target route. We'll have more than one legs if waypoints are specified.
 */
function createRoutePolyline(routeNum, routeLegs) {
  let routeCoordinates = [];
  // Note: Routes Preferred has duration and distanceMeters attributes for each
  // route, but Directions only has those for each leg of the route.
  let totalDuration = 0;  // Total duration of route in seconds.
  let totalDistance = 0;  // Total distance of route in meters.

  for (let i = 0; i < routeLegs.length; i++) {
    let legSteps = routeLegs[i].steps;
    console.log('num steps', legSteps.length);

    for (let j = 0; j < legSteps.length; j++) {
      // Routes Preferred: .startLocation.LatLng
      routeCoordinates.push(legSteps[j].start_location);
    }
    if (i == routeLegs.length - 1) {
        // Routes Preferred: .endLocation.LatLng
        routeCoordinates.push(legSteps[legSteps.length - 1].end_location);
    }
    totalDuration += parseInt(routeLegs[i].duration.value);
    totalDistance += parseInt(routeLegs[i].distance.value);
  }

  let route = new google.maps.Polyline({
    path: routeCoordinates,
    geodesic: true,
    strokeColor: routeColors[routeNum % 3],
    strokeOpacity: 0.5,
    strokeWeight: 6,
  });
  route.setMap(map);
  displayedRoutes.push(route);

  // Select the first route as default.
  if (routeNum == 0) {
    selectRouteDisplayDetails(0, totalDuration, totalDistance);
  }

  route.addListener('click', function(event) {
    console.log('route click');
    selectRouteDisplayDetails(routeNum, totalDuration, totalDistance);
  });
}

/** 
 * Highlights the selected route and displays its duration and distance.
 * @param {num} routeNum The index of the selected route in the routes array.
 * @param {num} totalDuration The duration of the route in seconds.
 * @param {num} totalDistance The distance of the route in meters.
 */
function selectRouteDisplayDetails(routeNum, totalDuration, totalDistance) {
  displayedRoutes[selectedRouteNum].setOptions({ strokeOpacity: 0.5, })
  selectedRouteNum = routeNum;
  displayedRoutes[routeNum].setOptions({ strokeOpacity: 1.0, });

  let routeInfoElement = document.getElementById('route-info');
  routeInfoElement.innerText = 'Selected Route Info:\n' 
      + 'Duration: ' + totalDuration + ' seconds\n'
      + 'Distance: ' + totalDistance + ' meters\n'
      + 'Route Token: ';
}
