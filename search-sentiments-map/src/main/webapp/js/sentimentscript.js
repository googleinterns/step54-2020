function getSentiment() {
  const searchTopic = document.getElementById('search-topic').value;
  const sentimentScoreElement = document.getElementById('sentiment-score');
  const searchTopicObject = "search-topic="+encodeURIComponent(searchTopic);
  sentimentScoreElement.innerText = 'BLAAAbeforegettingresponse';
  fetch('/sentiment', {method: 'POST',  // Sends a request to the URL.
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded', // <-- Specifying the Content-Type
    }),
    body: searchTopicObject // <-- Post parameters
    })
    .then(response => response.json())
    .then((score) => { 
      console.log('ntarn debug:' + score.sentimentScore);
      sentimentScoreElement.innerHTML = "<p>Sentiment analysis score: " + score.sentimentScore + "</p>";

    });
}  