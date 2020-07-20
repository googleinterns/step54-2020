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

/**
 * Changes current data being viewed to show data from new timerange
 */
function sliderChange() {
  let sliderVal = document.getElementById('timeline-slider').value;
  document.getElementById('timeline-slider-label').innerText =
      'See results from ' + ' from ' + sliderVal * 0.5 + ' days ago';

  changeTimeRange(parseInt(sliderVal));
}