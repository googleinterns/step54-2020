This web application visualizes trending google search results geographically and performs sentiment analysis on the search results. It utilizes the Maps API, Charts API, Google Trends API, and Google Custom Search APIs. It also utilizes Java Servlets.

Commands to run:
1. Install node_modules with
`npm install`
2. Run the server on localhost:3000 with
`npm start`
3. Deploy to trending-search-sentiments.appspot.com with
`gcloud app deploy`

To set project ID: 
`gcloud config set project PROJECT_ID` or `export GCLOUD_PROJECT=...`

Northern Cyprus and Somaliland don't have country codes and therefore their IDs are marked as 'N/A' in countries.geojson. They are not present in the country-code.json file.
We won't be able to get trends / search data for them, so we should color them grey.
