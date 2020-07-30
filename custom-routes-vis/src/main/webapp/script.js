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

/**
 * Test App URL container ids.
 * @enum {string}
 */
const url_ids = {
  IOS_URL_ID: 'ios-url', 
  V1_ANDROID_URL_ID: 'v1-android-url', 
  V2_ANDROID_URL_ID: 'v2-android-url',
};
// Array holding origin and destination markers.
let originDestinationMarkers = [];
// Array holding routes displayed on the map.
let displayedRoutes = [];
// Colors of the routes displayed.
// Colors in the array are red, orange, and blue, respectively.
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
    if (originDestinationMarkers.length === 2 
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
  // Show 6 decimal places of the lat and lng.
  document.getElementById(containerId).innerHTML = 
      "Latitude: " + lat.toFixed(6) + "<br>Longitude: " + lng.toFixed(6) + "<br>";
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

        // Display generate routes container when both markers have been placed.
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
  document.getElementById('route-info').innerText = '';

  // Hide the deep linking URLs.
  for (const id in url_ids) {
    document.getElementById(url_ids[id]).innerHTML = '';
  }
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
  fetch('/get-directions?origin=' + origin + '&destination=' + destination +
      '&endpoint=' + serviceEndpoint + '&apiKey=' + apiKey + '&rateCard=' +
      JSON.stringify(createRateCard()))
      .then(response => response.json()).then(directions => {
        let routes = directions.routes;
        console.log('num routes:', routes.length);

        for (let routeNum = 0; routeNum < routes.length; routeNum++) {
          createRoutePolyline(routeNum, routes[routeNum], serviceEndpoint);
        }
      });
}

/**
 * Creates formatted rate card object based on form input.
 * @returns {Object} Rate Card JSON Object.
 */
function createRateCard() {
  let costPerMin = parseFloat(document.getElementById('cost-per-minute').value);
  let costPerKm = parseFloat(document.getElementById('cost-per-km').value);
  let includeTolls = ('true' === document.getElementById('include-tolls').value);

  let rateCard = {'include_tolls': includeTolls};
  if (!isNaN(costPerMin)) {
    rateCard['cost_per_minute'] = {'value': costPerMin};
  }
  if (!isNaN(costPerKm)) {
    rateCard['cost_per_km'] = {'value': costPerKm};
  }

  return rateCard;
}

/**
 * Creates a polyline for a route on the map.
 * @param {num} routeNum The index of the route in the order that it is returned
 * from the selected API.
 * @param {!Object} routeJson JSON object containing all information of the 
 * target route.
 * @param {boolean} serviceEndpoint The service endpoint selected by the user. 
 * Can be one of 'directions', 'compute-routes', or 'compute-routes-alpha'.
 */
function createRoutePolyline(routeNum, routeJson, serviceEndpoint) {
  let isDirectionsApi = false;
  let routeToken = '';
  if (serviceEndpoint === 'directions') {
    isDirectionsApi = true;
  } else if (serviceEndpoint === 'compute-routes-alpha') {
    routeToken = routeJson.token;
    routeJson = routeJson.route;
  }

  let encodedPolyline = isDirectionsApi ? 
      routeJson.overview_polyline.points : routeJson.polyline.encodedPolyline;
  let routeCoordinates = google.maps.geometry.encoding.decodePath(encodedPolyline);

  // Total duration of route in seconds.
  let totalDurationSec = isDirectionsApi ? 
      0 : routeJson.duration.slice(0, routeJson.duration.length - 1);
  // Total distance of route in meters.
  let totalDistanceMeters = isDirectionsApi ? 0 : routeJson.distanceMeters;
  // Note: Routes Preferred has duration and distanceMeters attributes for each
  // route, but Directions only has them for each leg of the route.

  if (isDirectionsApi) {
    // Accumulate duration and distance because the total is not directly
    // available in results from the Directions API.
    let routeLegs = routeJson.legs;
    for (let i = 0; i < routeLegs.length; i++) {
      totalDurationSec += parseInt(routeLegs[i].duration.value);
      totalDistanceMeters += parseInt(routeLegs[i].distance.value);
    }
  }

  createRouteFromCoordinates(routeCoordinates, routeNum, totalDurationSec,
      totalDistanceMeters, routeToken);
}

/**
 * Creates the route on the map and stores it in the routes array.
 * @param {Array} routeCoordinates The coordinates that the route goes through.
 * @param {num} routeNum The index of the selected route in the routes array.
 * @param {num} totalDurationSec The duration of the route in seconds.
 * @param {num} totalDistanceMeters The distance of the route in meters.
 * @param {string} routeToken The route token returned from the Custom Routes
 * Alpha API.
 */
function createRouteFromCoordinates(
    routeCoordinates, 
    routeNum, 
    totalDurationSec, 
    totalDistanceMeters,
    routeToken) {
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
  if (routeNum === 0) {
    selectRouteDisplayDetails(0, totalDurationSec, totalDistanceMeters, 
        routeToken);
  }

  route.addListener('click', function(event) {
    selectRouteDisplayDetails(routeNum, totalDurationSec, totalDistanceMeters, 
        routeToken);
  });
}

/** 
 * Highlights the selected route and displays its formatted duration and 
 * distance in miles.
 * @param {num} routeNum The index of the selected route in the routes array.
 * @param {num} totalDurationSec The duration of the route in seconds.
 * @param {num} totalDistanceMeters The distance of the route in meters.
 * @param {string} routeToken The route token of the currently selected route.
 */
function selectRouteDisplayDetails(routeNum, totalDurationSec, totalDistanceMeters,
    routeToken) {
  displayedRoutes[selectedRouteNum].setOptions({ strokeOpacity: 0.3, })
  selectedRouteNum = routeNum;
  displayedRoutes[routeNum].setOptions({ strokeOpacity: 1.0, });

  let routeInfoElement = document.getElementById('route-info');
  routeInfoElement.innerText = 'Selected Route Info:' +
      '\nDuration: ' + formatDuration(totalDurationSec) +
      '\nDistance: ' + formatDistance(totalDistanceMeters);

  if (routeToken !== '') {
    routeInfoElement.innerText += '\nRoute Token: check the developer console';
    console.log(routeToken);
    updateDeepLinkingUrl(routeToken);
  }
}

/**
 * Updates the deep linking url to various test apps on the page.
 * @param {string} routeToken The route token of the currently selected route.
 */
function updateDeepLinkingUrl(routeToken) {
  var originPosition = originDestinationMarkers[0].position;
  var destinationPosition = originDestinationMarkers[1].position;
  document.getElementById(url_ids.IOS_URL_ID).innerHTML =
      '<a href=navsdkdemo://advanced?originLat=' + 
      originPosition.lat() + '&originLng=' + originPosition.lng() + 
      '&destLat=' + destinationPosition.lat() + 
      '&destLng=' + destinationPosition.lng() + 
      '&routeToken=' + routeToken + '>' + 'IOS Test App' + '</a>';
  document.getElementById(url_ids.V1_ANDROID_URL_ID).innerHTML =
      '<a href=navsdk://fragmentactivity?originlat=' +
      originPosition.lat() + '&originlng=' + originPosition.lng() + 
      '&destinationlat=' + destinationPosition.lat() + 
      '&destinationlng=' + destinationPosition.lng() +
      '&precomputedroutetoken=' + routeToken + '>' + 
      'Android V1 Test App' + '</a>';
  document.getElementById(url_ids.V2_ANDROID_URL_ID).innerHTML =
      '<a href=navsdk://supportnavmapfragmentactivity?originlat=' +
      originPosition.lat() + '&originlng=' + originPosition.lng() + 
      '&destinationlat=' + destinationPosition.lat() + 
      '&destinationlng=' + destinationPosition.lng() +
      '&precomputedroutetoken=' + routeToken + '>' + 
      'Android V2 Test App' + '</a>';
}

/** 
 * Formats the duration to be of the form "xx h xx min xx s."
 * @param {num} durationSec Duration in seconds.
 * @return {string} The duration in the form "xx h xx min xx s."
 */
function formatDuration(durationSec) {
  if (durationSec > 60) {
    let durationMin = Math.floor(durationSec / 60);
    let remainderSec = durationSec % 60;
    if (durationMin > 60) {
      let durationHours = Math.floor(durationMin / 60);
      let remainderMin = durationMin % 60;
      return durationHours + ' h ' + remainderMin + ' min ' + remainderSec + ' s';
    }
    return durationMin + ' min ' + remainderSec + ' s';
  }
  return durationSec + ' s';
}

/** 
 * Formats the distance to be in miles with 4 decimal places.
 * @param {num} distanceMeters Distance in meters.
 * @return {string} The distance in miles to be displayed.
 */
function formatDistance(distanceMeters) {
  return (distanceMeters * 0.0006213712).toFixed(4) + ' miles';
}

/** Shows or hides rate-card-data div when service endpoint changed. */
function changeServiceEndpoint() {
  let serviceEndpoint = document.getElementById('service-endpoint').value;

  // Only display rate card div if compute custom routes is selected.
  document.getElementById('rate-card-data').style.display = 
      (serviceEndpoint === 'compute-routes-alpha') ? 'block' : 'none';
}