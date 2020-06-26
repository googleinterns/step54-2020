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

import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


@WebServlet("/")
public class HomeServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
  }

  // static void authAppEngineStandard() throws IOException {
  //   // Explicitly request service account credentials from the app engine standard instance.
  //   GoogleCredentials credentials = AppEngineCredentials.getApplicationDefault();
  //   Storage storage = StorageOptions.newBuilder().setCredentials(credentials).build().getService();

  //   System.out.println("Buckets:");
  //   Page<Bucket> buckets = storage.list();
  //   for (Bucket bucket : buckets.iterateAll()) {
  //     System.out.println(bucket.toString());
  //   }
  // }
}
