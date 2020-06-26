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

const express = require('express');
const app = express();
// Listen to the App Engine-specified port, or 3000 otherwise
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from App Engine!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
