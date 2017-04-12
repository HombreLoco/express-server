"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const randomize = require('randomatic');

const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// app.get calls are routes to handle reponses given requested parameters
app.get("/", (req, res) => {
  res.end("Hello!");
});

// this route receives form submission data for converting long URLs to
// short URLs
app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");
})


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

// this route renders a view to display all URLs and their shortened forms
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// this route renders a view for users to enter full URLs to a form to
// be converted to short URLs by the server
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

// this route renders a view to display a single URL and it's shortened form
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
})

// this route sends back HTML code in the response
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


// app.listen allows the web server to listen for requests on the choosen port number

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// function to generate a shortURL
function generateRandomString() {
  let pattern = "Aa0";
  let length = 6;
  return randomize(pattern, length);
}
