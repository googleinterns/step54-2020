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
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.HttpURLConnection;
import java.util.Scanner;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/get-directions")
public class GetDirectionsServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

    String origin = request.getParameter("origin");
    String destination = request.getParameter("destination");
    String endpoint = request.getParameter("endpoint");
    String rateCard = request.getParameter("rateCard");

    String apiKey = request.getParameter("apiKey");
    String directionsApiKey = System.getenv("DIRECTIONS_API_KEY");
    String key = apiKey == "" ? apiKey : directionsApiKey;  // This works but it seems backwards to me.

    URLConnection connection;

    switch (endpoint) {
      case "compute-routes":
        connection = sendPostRequestToRoutesApi(origin, destination, false, key, "");
        break;
      case "compute-routes-alpha":
        connection = sendPostRequestToRoutesApi(origin, destination, true, key, rateCard);
        break;
      default:  // Default to use the Directions API.
        connection = sendGetRequestToDirectionsApi(origin, destination, key);
        break;
    }

    response.setContentType("application/json;");
    response.getWriter().println(readResponse(connection));
  }

  /** 
   * Sends request to the Directions API and returns the connection.
   * @param origin Origin of the requested routes in "lat,lng" format.
   * @param destination Destination of the requested routes in "lat,lng" format.
   * @param key The API key.
   */
  public URLConnection sendGetRequestToDirectionsApi(String origin, String destination, String key) 
      throws IOException, MalformedURLException {
    String originDestination = "&origin=" + origin + "&destination=" + destination;
    URL directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json?"
          + "mode=driving"
          + "&alternatives=true" + originDestination + "&key=" + key);
    URLConnection connection = directionsUrl.openConnection();
    connection.setRequestProperty("Accept-Charset", "UTF-8");
    return connection;
  }

  /** 
   * Sends request to the Routes Preferred API and returns the connection.
   * @param origin Origin of the requested routes in "lat,lng" format.
   * @param destination Destination of the requested routes in "lat,lng" format.
   * @param alpha Whether to send the request to the alpha version of the API.
   * @param key The API key.
   * @param rateCard The Rate Card for this call to the API.
   */
  public URLConnection sendPostRequestToRoutesApi(String origin, String destination, boolean alpha,
      String apiKey, String rateCard) throws IOException, MalformedURLException {
    URL routesUrl;
    String rateCardString;
    if (alpha) {
      routesUrl = new URL("https://routespreferred.googleapis.com/v1alpha:computeCustomRoutes");
      rateCardString = "\"routeObjective\": {\"rateCard\": " + rateCard + "},";
    } else {
      routesUrl = new URL("https://routespreferred.googleapis.com/v1:computeRoutes");
      rateCardString = "";
    }

    HttpURLConnection connection = (HttpURLConnection) routesUrl.openConnection();
    connection.setRequestMethod("POST");
    connection.setRequestProperty("Content-Type", "application/json; utf-8");
    connection.setRequestProperty("Accept", "application/json");
    connection.setDoOutput(true);

    String requestParamsJson = "{"
        + "\"origin\": {\"location: \"" + origin + "\"}," 
        + "\"destination\": {\"location: \"" + destination + "\"},"
        + "\"travelMode\": \"DRIVE\"," + rateCardString
        + "\"computeAlternativeRoutes\": true}";

    try(OutputStream os = connection.getOutputStream()) {
      byte[] input = requestParamsJson.getBytes("utf-8");
      os.write(input, 0, input.length);			
    }

    return connection;
  }

  /** Returns the response from the API connection. */
  public String readResponse(URLConnection connection) throws IOException {
    InputStream response = connection.getInputStream();
    try (Scanner scanner = new Scanner(response)) {
      String responseBody = scanner.useDelimiter("\\A").next();
      return responseBody;
    }
  }
}
