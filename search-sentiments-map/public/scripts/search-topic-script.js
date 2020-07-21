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

const MAX_SELECTED_COUNTRIES = 3;

/**
 * Updates the current search topic for the given country and search topic.
 */
function searchTopic() {
  let topic = document.getElementById("search-topic").value;
  let topTrends = getTopTrends();
  // The list of selected countries. If given more than the maximum permitted
  // number of countries, then ignore the extras.
  let selectedCountriesList =
      $('#country-select').val().slice(0, MAX_SELECTED_COUNTRIES);

  // Make sure there is at least 1 selected country and a non-empty topic.
  if (topic.length === 0 && selectedCountriesList.length === 0) {
    return;
  }

  setUserSearchTopic(topic, selectedCountriesList);
}

/**
 * Creates the selector for all of the countries in the relevant json.
 */
function countrySelectSetUp() {
  let container = document.getElementById('country-select');
  fetch("country-name.json").then(response => response.json())
      .then(json => {
    json.forEach(country => {
      container.innerHTML += 
          '<option value="' + country.id + '">' + country.name + '</option>';
    })
  });
}