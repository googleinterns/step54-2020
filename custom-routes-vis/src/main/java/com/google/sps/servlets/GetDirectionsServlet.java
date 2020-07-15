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
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
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
    String apiKey = request.getParameter("apiKey");

    String directions = getRoutesFromApi(origin, destination, endpoint, apiKey);
    System.out.println(directions);

    response.setContentType("application/json;");
    response.getWriter().println(directions);
  }

  public String getRoutesFromApi(String origin, String destination, String endpoint, String apiKey)
     throws IOException, MalformedURLException {
    String urlString;
    String directionsApiKey = System.getenv("DIRECTIONS_API_KEY");
    String key = apiKey == "" ? apiKey : directionsApiKey;

    switch (endpoint) {
      case "compute-routes":
        urlString = "https://routespreferred.googleapis.com/v1:computeRoutes?"
          + "travelMode=DRIVE"
          + "&computeAlternativeRoutes=true";
        break;
      case "compute-routes-alpha":
        urlString = "https://routespreferred.googleapis.com/v1alpha:computeCustomRoutes?"
          + "travelMode=DRIVE";
        break;
      default:  // Default to use the Directions API.
        urlString = "https://maps.googleapis.com/maps/api/directions/json?"
          + "mode=driving"
          + "&alternatives=true";
        break;
    }
    String originDestination = "&origin=" + origin + "&destination=" + destination;
    URL directionsUrl = new URL(urlString + originDestination + "&key=" + key);

    URLConnection connection = directionsUrl.openConnection();
    connection.setRequestProperty("Accept-Charset", "UTF-8");

    InputStream response = connection.getInputStream();
    try (Scanner scanner = new Scanner(response)) {
      String responseBody = scanner.useDelimiter("\\A").next();
      return responseBody;
    }
  }
}
