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
// Countries selected on dropdown.
let countryCodeList = [];
let countryNameList = [];

/** Updates the current data on the map for the user input search topic. */
function searchTopic() {
  let topic = document.getElementById('search-topic').value;

  getIsWorldLevel() ?
      searchWorldTopic(topic) : setStateInterestsData(topic);
}

/** 
 * Updates the current data on the map for the user-selected countries and
 * topic at world level.
 * @param {string} topic The topic that the user entered.
 */
function searchWorldTopic(topic) {
  // Make sure there is at least 1 selected country and a non-empty topic.
  // Prompt user to input missing information.
  if (topic.length === 0 || countryCodeList.length === 0) {
    let modalText = (topic.length === 0) ? 
        'Input search topic in order to search' :
        'Select countries to view results for in order to search';
    document.getElementById('user-search-warning-text').innerHTML = modalText;
    $('#user-search-warning-modal').modal('show');
    return;
  }

  document.getElementById('submit-user-topic').innerHTML = 
      '<span class="spinner-border spinner-border-sm" role="status"' + 
      'aria-hidden="true"></span>Searching...';
  document.getElementById('submit-user-topic').disabled = true;

  setUserSearchTopic(topic, countryCodeList);
}

/**
 * Creates the dropdown checkbox for all of the countries in the relevant json.
 */
function countrySelectSetUp() {
  let dropdownContainer = document.getElementById('country-select-dropdown');
  // Fetch the list of countries ordered alphabetically by their names.
  fetch("country-name.json").then(response => response.json())
      .then(json => {
    json.forEach(country => {
      dropdownContainer.innerHTML +=
          '<li><label id="' + country.id + '"><input type="checkbox" value="' +
          country.id + '">' + country.name + '</label></li>';
    });
  });

  $(".checkbox-menu").on("change", "input[type='checkbox']", function() {
    // Do not allow user to select more that `MAX_SELECTED_COUNTRIES`.
    if (countryCodeList.length >= MAX_SELECTED_COUNTRIES) {
      this.checked = false;
    }
    $(this).closest("li").toggleClass("active", this.checked);

    // Keep track of checked countries.
    if (this.checked) {
      countryCodeList.push(this.value);
      countryNameList.push(document.getElementById(this.value).innerText);
    } else {
      const index = countryCodeList.indexOf(this.value);
      if (index > -1) {
        countryCodeList.splice(index, 1);
        countryNameList.splice(index, 1);
      }
    }

    // Update dropdown button to show currently selected countries.
    const dropdownButton = document.getElementById('country-dropdown-button');
    if (countryCodeList.length !== 0) {
      dropdownButton.innerHTML =
          countryNameList.join(', ') + '<span class="caret"></span>';
    } else {
      dropdownButton.innerHTML =
          'Countries to view results for(max 3)<span class="caret"></span>';
    }
  });

  // Keep dropdown open until user clicks out.
  $(document).on('click', '.allow-focus', function (e) {
    e.stopPropagation();
  });
}

/** Toggles the display of the user search and trends panel on the right. */
function toggleRightPanel() {
  toggleDisplay('right-div');
  let showHideButton = document.getElementById('show-hide-right-div');
  showHideButton.innerText = 
      showHideButton.innerText === '–' ? '+' : '–';
}