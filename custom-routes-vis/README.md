This web application visualizes custom routes selection on a map and will be used
for testing by the NavSDK team.
It utilizes the Maps API and Java Servlets as the backend.

1. Run the local server on localhost:4503 with
`mvn clean package appengine:run`
2. Deploy to custom-routes-visualization.appspot.com with
`mvn clean package appengine:deploy`

Before running: Run `export DIRECTIONS_API_KEY=apiKey` in the terminal to set the
environment variable.
Before deploying: Change line 50 of GetDirectionsServlet.java to set the actual
Directions API key in the code, because the environment variable cannot be accessed
in the deployed version. Change it back before pushing to git.