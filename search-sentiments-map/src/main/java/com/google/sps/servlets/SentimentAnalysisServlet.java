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

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.cloud.language.v1.Document;
import com.google.cloud.language.v1.LanguageServiceClient;
import com.google.cloud.language.v1.Sentiment;
import com.google.gson.Gson;
import com.google.sps.data.SearchTopicResult;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


/**
 * Servlet that processes search result sentiment. 
 */
@WebServlet("/sentiment")
public class SentimentAnalysisServlet extends HttpServlet {

  private static final String SEARCHTOPICRESULT = "Search Topic Result";
  private static final String SEARCHTOPIC = "searchTopic";
  private static final String TIMESTAMP = "timestamp";
  private static final String SENTIMENTSCORE = "sentimentScore";

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
 
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String searchTopic = request.getParameter("search-topic");
    long timestamp = System.currentTimeMillis();

    Document doc =
        Document.newBuilder().setContent(searchTopic).setType(Document.Type.PLAIN_TEXT).build();
    LanguageServiceClient languageService = LanguageServiceClient.create();
    Sentiment sentiment = languageService.analyzeSentiment(doc).getDocumentSentiment();
    double score = sentiment.getScore();
    languageService.close();

    Entity searchTopicResultEntity = new Entity(SEARCHTOPICRESULT);
    searchTopicResultEntity.setProperty(SEARCHTOPIC, searchTopic);
    searchTopicResultEntity.setProperty(TIMESTAMP, timestamp);
    searchTopicResultEntity.setProperty(SENTIMENTSCORE, score);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    datastore.put(searchTopicResultEntity);
    
    Gson gson = new Gson();

    response.setContentType("application/json;");
    response.getWriter().println(gson.toJson(new SearchTopicResult(searchTopic, timestamp, score)));
  }

}
