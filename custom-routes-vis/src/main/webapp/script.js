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

// Array holding origin and destination markers.
let originDestinationMarkers = [];
// Array holding routes displayed on the map.
let displayedRoutes = [];
// Colors of the routes displayed.
const ROUTE_COLORS = ['#ff0000', '#eb8f1e', '#3299d1'];
let selectedRouteNum = 0;  // The index of the route selected.
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
 * @param {string} title Title of marker.
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
    displayedRoutes[i].setMap(null);
  }
  displayedRoutes = [];
  selectedRouteNum = 0;
}

/**
 * Generates routes from origin to destination by calling the selected API.
 * Precondition: Two markers exist in the originDestinationMarkers array.
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
        // Log the response status from the Directions API.
        // TODO(chenyuz): Find equivalence for Routes Preferred API.
        console.log(directions.status);

        let routes = directions.routes;
        console.log('num routes:', routes.length);

        for (let routeNum = 0; routeNum < routes.length; routeNum++) {
          createRoutePolyline(routeNum, routes[routeNum], 
              serviceEndpoint === 'directions');
        }
      });
}

/**
 * Creates a polyline for a route on the map.
 * @param {num} routeNum The index of the route in the order that it is returned
 * from the selected API.
 * @param {!Object} routeJson JSON object containing all information of the target
 * route.
 * @param {boolean} directionsApi Whether the route is obtained by the Directions
 * API; if false, assume it is obtained by the Routes Preferred API.
 */
function createRoutePolyline(routeNum, routeJson, directionsApi) {
  let routeLegs = routeJson.legs;
  let routeCoordinates = [];

  // Total duration of route in seconds.
  let totalRouteDurationSec = directionsApi ? 0 : routeJson.duration;
  // Total distance of route in meters.
  let totalDistanceMeters = directionsApi ? 0 : routeJson.distanceMeters;
  // Note: Routes Preferred has duration and distanceMeters attributes for each
  // route, but Directions only has them for each leg of the route.

  // Get all coordinates given by the steps of the legs of the route.
  for (let i = 0; i < routeLegs.length; i++) {
    let legSteps = routeLegs[i].steps;
    console.log('num steps', legSteps.length);

    for (let j = 0; j < legSteps.length; j++) {
      directionsApi ?
          routeCoordinates.push(legSteps[j].start_location) :
          routeCoordinates.push(legSteps[j].startLocation.LatLng);
    }

    // Add the end location to the coordinates array.
    if (i == routeLegs.length - 1) {
      directionsApi ?
          routeCoordinates.push(legSteps[legSteps.length - 1].end_location) :
          routeCoordinates.push(legSteps[legSteps.length - 1].endLocation.LatLng);
    }

    if (directionsApi) {
      // Accumulate duration and distance because the total is not directly
      // available in results from the Directions API.
      totalRouteDurationSec += parseInt(routeLegs[i].duration.value);
      totalDistanceMeters += parseInt(routeLegs[i].distance.value);
    }
  }

  createRouteFromCoordinates(routeCoordinates, routeNum, totalRouteDurationSec,
      totalDistanceMeters);
}

/**
 * Creates the route on the map and stores it in the routes array.
 * @param {Array} routeCoordinates The coordinates that the route goes through.
 * @param {num} routeNum The index of the selected route in the routes array.
 * @param {num} totalDuration The duration of the route in seconds.
 * @param {num} totalDistance The distance of the route in meters.
 */
function createRouteFromCoordinates(
    routeCoordinates, 
    routeNum, 
    totalDuration, 
    totalDistance) {
  let route = new google.maps.Polyline({
    path: routeCoordinates,
    geodesic: true,
    strokeColor: ROUTE_COLORS[routeNum % 3],
    strokeOpacity: 0.3,
    strokeWeight: 6,
  });
  route.setMap(map);
  displayedRoutes.push(route);

  // Select the first route as default.
  if (routeNum == 0) {
    selectRouteDisplayDetails(0, totalDuration, totalDistance);
  }

  route.addListener('click', function(event) {
    selectRouteDisplayDetails(routeNum, totalDuration, totalDistance);
  });
}

/** 
 * Highlights the selected route and displays its duration and distance.
 * @param {num} routeNum The index of the selected route in the routes array.
 * @param {num} totalDuration The duration of the route in seconds.
 * @param {num} totalDistance The distance of the route in meters.
 * TODO(carmenbenitez): Add in the route token returned from the Routes Preferred API.
 */
function selectRouteDisplayDetails(routeNum, totalDuration, totalDistance) {
  displayedRoutes[selectedRouteNum].setOptions({ strokeOpacity: 0.3, })
  selectedRouteNum = routeNum;
  displayedRoutes[routeNum].setOptions({ strokeOpacity: 1.0, });

  let routeInfoElement = document.getElementById('route-info');
  routeInfoElement.innerText = 'Selected Route Info:\n' 
      + 'Duration: ' + totalDuration + ' seconds\n'
      + 'Distance: ' + totalDistance + ' meters\n'
      + 'Route Token: ';
}
