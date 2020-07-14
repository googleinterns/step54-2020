// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.


function searchTopic() {
  let topic = document.getElementById("search-topic").value;
  let topTrends = getTopTrends();
  // Maximum of 3 countries. If given more, only take first 3.
  let countries = $('#country-select').val().slice(0, 3);

  // Get new search results when given a topic and at least 1 country.
  if (topic.length !== 0 && countries.length !== 0) {
    // Get search results from existing custom search data when search topic is
    // in the top global trends.
    let trendFilter = topTrends.filter(trends => 
        trends.trendTopic.toLowerCase() === topic.toLowerCase());
    if (trendFilter.length !== 0) {
      console.log("in top trends")
      // use data from custom search
    } else {
      fetch('/search/testTopic/'+JSON.stringify('[UK, US]'));
    }
  }
}


function countrySelectSetUp() {
  let container = document.getElementById('country-select');
  fetch("country-code.json").then(response => response.json())
      .then(json => {
    json.forEach(country => {
      container.innerHTML += 
          '<option value="' + country.id + '">' + country.name + '</option>';
    })
  });
}