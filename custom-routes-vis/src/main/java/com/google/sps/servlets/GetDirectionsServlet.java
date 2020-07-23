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

package com.google.sps.servlets;

import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Scanner;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Servlet that renders customized routes by calling a specified API. */
@WebServlet("/get-directions")
public class GetDirectionsServlet extends HttpServlet {
  private static final String COMPUTE_ROUTES = "compute-routes";
  private static final String COMPUTE_ROUTES_ALPHA = "compute-routes-alpha";

  /** 
   * Handles the request to get routes and responds with results from a call to a specified API. 
   * @param request Servlet request that specifies the origin, destination, service endpoint, and,
   * optionally, an API key for the API request.
   * @param response Servlet response that sends back the JSON response from the API.
   */
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String origin = request.getParameter("origin");
    String destination = request.getParameter("destination");
    String endpoint = request.getParameter("endpoint");
    String rateCard = request.getParameter("rateCard");

    String requestApiKey = request.getParameter("apiKey");
    String directionsApiKey = System.getenv("DIRECTIONS_API_KEY");
    // Use the Directions API key if no API key is specified.
    String apiKey = requestApiKey.isEmpty() ? directionsApiKey : requestApiKey;

    URLConnection connection;

    switch (endpoint) {
      case COMPUTE_ROUTES:
        connection = connectToRoutesApi(origin, destination, false, apiKey, "");
        break;
      case COMPUTE_ROUTES_ALPHA:
        connection = connectToRoutesApi(origin, destination, true, apiKey, rateCard);
        break;
      default:  // Default to use the Directions API.
        connection = connectToDirectionsApi(origin, destination, apiKey);
        break;
    }

    response.setContentType("application/json;");
    response.getWriter().println(readResponse(connection));
  }

  /** 
   * Sends GET request to the Directions API and returns the connection.
   * @param origin Origin of the requested routes in "lat,lng" format.
   * @param destination Destination of the requested routes in "lat,lng" format.
   * @param apiKey The API key.
   */
  public URLConnection connectToDirectionsApi(String origin, String destination, String apiKey) 
      throws IOException, MalformedURLException {
    URL directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json?"
        + "origin=" + origin + "&destination=" + destination    
        + "&mode=driving" + "&alternatives=true" + "&key=" + apiKey);
    URLConnection connection = directionsUrl.openConnection();
    connection.setRequestProperty("Accept-Charset", "UTF-8");
    return connection;
  }

  /** 
   * Sends POST request to the Routes Preferred API and returns the connection.
   * @param origin Origin of the requested routes in "lat,lng" format.
   * @param destination Destination of the requested routes in "lat,lng" format.
   * @param shouldUseAlphaApi Whether to send the request to the alpha version of the API.
   * @param apiKey The API key.
   * @param rateCard The Rate Card for this call to the API.
   */
  public URLConnection connectToRoutesApi(String origin, String destination, boolean shouldUseAlphaApi,
      String apiKey, String rateCard) throws IOException, MalformedURLException {
    URL routesUrl;
    String rateCardString = "";
    if (alpha) {
      routesUrl = new URL("https://routespreferred.googleapis.com/v1alpha:computeCustomRoutes");
      rateCardString = "\"routeObjective\": {\"rateCard\": " + rateCard + "},";
    } else {
      routesUrl = new URL("https://routespreferred.googleapis.com/v1:computeRoutes");
    }

    HttpURLConnection connection = (HttpURLConnection) routesUrl.openConnection();
    connection.setRequestMethod("POST");
    connection.setRequestProperty("Content-Type", "application/json; utf-8");
    connection.setRequestProperty("Accept", "application/json");
    connection.setDoOutput(true);

    // TODO(chenyuz): Check with the Routes Preferred team to make sure that the request JSON is
    // correct.
    // 1. The origin and destination waypoints are simplified here.
    // 2. How do we add apiKey?
    // 3. Are there other fields that we should add?
    String requestParamsJson = "{"
        + "\"origin\": {\"location\":  {\"latLng\": "
        + "{\"latitude\": " + origin.split(",")[0]
        + ", \"longitude\": " + origin.split(",")[1] + "}}},"
        + "\"destination\": {\"location\":  {\"latLng\": "
        + "{\"latitude\": " + destination.split(",")[0]
        + ", \"longitude\": " + destination.split(",")[1] + "}}},"
        + "\"travelMode\": \"DRIVE\"," + rateCardString
        + "\"computeAlternativeRoutes\": true}";

    try(OutputStream os = connection.getOutputStream()) {
      byte[] input = requestParamsJson.getBytes("utf-8");
      os.write(input, 0, input.length);			
    }

    return connection;
  }

  /** Reads and returns the response from the API connection. */
  public String readResponse(URLConnection connection) throws IOException {
    InputStream response = connection.getInputStream();
    try (Scanner scanner = new Scanner(response)) {
      String responseBody = scanner.useDelimiter("\\A").next();
      return responseBody;
    }
  }
}
