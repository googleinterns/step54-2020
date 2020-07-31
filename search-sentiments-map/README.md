This web application visualizes trending google search topics and their results geographically and performs sentiment analysis on the search results. 
It is built with NodeJS and it utilizes the Google Maps Javascript API, Google Custom Search API, Google Cloud Natural Language API, Google Charts API, the NodeJS Google Trends API and NodeJS sentiment module.

Commands:

1. Install node_modules with
`npm install`

2. Run the server on localhost:4503 with
`npm start`

3. Deploy to "trending-search-sentiments.appspot.com" with
`gcloud app deploy`

Make sure you have set the project ID before deploying or running. To do so, run:
`gcloud config set project PROJECT_ID` or `export GCLOUD_PROJECT=...`

Need to have an .env file to run with custom search. File format:
SEARCH_API_KEY=key

To update the Datastore indices:
`gcloud app deploy index.yaml`

To update the app engine's cron job:
`gcloud app deploy cron.yaml`

The cron job that updates trending search topics and their search results is currently set up to run every day at 11am and 11pm, New York time.
Data is kept in the Datastore for up to 7 days.

Country data:

The countries.geojosn file has outlines coordinates for each country. Northern Cyprus and Somaliland don't have country codes and therefore their IDs are marked as 'N/A' in countries.geojson. They are not present in the country-code.json file.

The country-code.json file has 2-letter country codes and their names, ordered alphabetically by the codes. This is used get search results for each country.

The country-name.json file also has 2-letter country codes and their names, but ordered alphabetically by the names. This is used to display the countries available for user searched topics.

The countries-with-trends.json file includes all the countries that we can get trending topics for from the trends API.

Countries that show up as N/A on sentiment mode: Those who don't have search results.