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

// Maximum number of countries to get search results for.
const MAX_SELECTED_COUNTRIES = 3;
let countryList = [];

/**
 * Updates the current search topic for the given country and search topic.
 */
function searchTopic() {
  let topic = document.getElementById("search-topic").value;
  let topTrends = getTopTrends();

  console.log(topic);
  console.log(countryList);
  // Make sure there is at least 1 selected country and a non-empty topic.
  if (topic.length === 0 || countryList.length === 0) {
    let popoverText = (topic.length === 0) ? 'Add Search Topic!' : 'Select Countries!';
    $('#submit-user-search').attr('data-content', popoverText);
    $('#submit-user-search').popover("show");
    return;
  }

  $('#submit-user-search').popover("hide");

  //getUserSearchTopic(topic, countryList);
}

/**
 * Creates the selector for all of the countries in the relevant json.
 */
function countrySelectSetUp() {
  let dropdownContainer = document.getElementById('country-select-dropdown');
  fetch("country-name.json").then(response => response.json())
      .then(json => {
    json.forEach(country => {
      dropdownContainer.innerHTML += '<li><label><input type="checkbox" value="' +
          country.id + '">' + country.name + '</label></li>'
    })
  });

  $(".checkbox-menu").on("change", "input[type='checkbox']", function() {
    if (countryList.length >= MAX_SELECTED_COUNTRIES) {
      this.checked = false;
    }
    $(this).closest("li").toggleClass("active", this.checked);
    if (this.checked) {
      countryList.push(this.value);
    } else {
      const index = countryList.indexOf(this.value);
      if (index > -1) {
        countryList.splice(index, 1);
      }
    }
  });

  $(document).on('click', '.allow-focus', function (e) {
    e.stopPropagation();
  });
}