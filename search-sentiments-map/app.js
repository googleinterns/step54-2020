// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

const PORT = process.env.PORT || 3000;
const HTTP = require('http');
const FS = require('fs');
const PATH = require('path');

// Create server that displays the webpage with the html, css, javascript, and
// png files in the public folder.
HTTP.createServer(function(req, res) {
  const publicPath = PATH.join(__dirname, 'public', req.url);

  if (req.url === "/") {
    FS.readFile("./public/index.html", "UTF-8", function(err, html) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(html);
    });
  } else if (req.url.match("\.css$")) {
    var fileStream = FS.createReadStream(publicPath, "UTF-8");
    res.writeHead(200, {"Content-Type": "text/css"});
    fileStream.pipe(res);
  } else if (req.url.match("\.js$")) {
    var fileStream = FS.createReadStream(publicPath, "UTF-8");
    res.writeHead(200, {"Content-Type": "text/javascript"});
    fileStream.pipe(res);
  } else if (req.url.match("\.png$")) {
    var fileStream = FS.createReadStream(publicPath);
    res.writeHead(200, {"Content-Type": "image/png"});
    fileStream.pipe(res);
  } else {
    res.writeHead(404, {"Content-Type": "text/html"});
    res.end("No Page Found");
  }
}).listen(PORT);

const googleTrends = require('google-trends-api');

// Testing that google-trends-api works. Delete later.
googleTrends.interestOverTime({keyword: 'Women\'s march'})
.then(function(results) {
  console.log('These results are awesome', results);
})
.catch(function(err) {
  console.error('Oh no there was an error', err);
});

function setTopTrends() {
  
}
