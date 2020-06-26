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

package com.google.sps.data;

/** A search topic and the sentiment of its results. */
public final class SearchTopicResult {

  private final long id;
  private final String searchTopic;
  private final long timestamp;
  private final double sentimentScore;

  public SearchTopicResult(long id, String searchTopic, long timestamp, double sentimentScore) {
    this.id = id;
    this.searchTopic = searchTopic;
    this.timestamp = timestamp;
    this.sentimentScore = sentimentScore;
  }
  
  public SearchTopicResult(String searchTopic, long timestamp, double sentimentScore) {
    this.id = 0;
    this.searchTopic = searchTopic;
    this.timestamp = timestamp;
    this.sentimentScore = sentimentScore;
  }
}