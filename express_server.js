var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// app.get calls are routes to handle reponses given requested parameters

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})


// app.listen allows the web server to listen for requests on the choosen port number

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
