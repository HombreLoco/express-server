"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const randomize = require('randomatic');
const serveStatic = require('serve-static');
const cookieParser = require('cookie-parser')

const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(serveStatic(`${__dirname}/public`));
app.use(cookieParser());


// this variable holds the short and full URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "u01": {
    id: "randomId1",
    email: "test1@email.com",
    password: "password"
  },
  "u02": {
    id: "randomId2",
    email: "test2@email.com",
    password: "password"
  }
}


// app.get calls are routes to handle reponses given requested parameters
app.get("/", (req, res) => {
  res.end("Hello!");
});

// this route returns the login page
app.get("/login", (req, res) => {
  res.render("urls_login");
})

// this route receives the login form parameters and redirects to the users
// index page
app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Email and Password fields cannot be empty!")
  } else if (!verifyUser(req.body.email, req.body.password)) {
      res.status(403).end("No user found!");
  } else {
      let user = getUserByEmail(req.body.email);
      res.cookie("user", user.id);
      res.redirect("/");
  }
});

// this route logs the user out by clearing the user cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});

// this route returns the urlDatabase value to the browser
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// this route returns a page for users to register to the website
app.get("/register", (req, res) => {
  res.render("urls_registration");
});

// this route calls the createNewUser function, checks if email already
// exists or if email/password are empty strings, creates the user, and
// redirects back to the root page
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Email and Password fields cannot be empty!")
  } else if (doesUserExist(req.body.email)) {
      res.status(400).end("User alreadsy exists with that email!");
  } else {
      let newUser = addNewUser(req.body.email, req.body.password);
      res.cookie("user", users[newUser].id);
      res.redirect("/");
  }
});

// this route renders a view to display all URLs and their shortened forms
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: getUserById(req.cookies["user"]) };
  res.render("urls_index", templateVars);
});

// this route receives form submission data for converting long URLs to
// short URLs
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  let templateVars = { user: getUserById(req.cookies["user"]) };
  res.redirect(`/urls/${shortURL}`, templateVars);
});

// this route renders a view for users to enter full URLs to a form to
// be converted to short URLs by the server
app.get("/urls/new", (req, res) => {
  let templateVars = { user: getUserById(req.cookies["user"]) };
  res.render("urls_new", templateVars);
});

// this route renders a view to display a single URL and it's shortened form
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id],
                        user: getUserById(req.cookies["user"]) };
  res.render("urls_show", templateVars);
});

// this route updates a longURL given a shortURL value and redirects
// to the entire list of URLs
app.post("/urls/:id", (req, res) => {
  let templateVars = { user: getUserById(req.cookies["user"]) };
  urlDatabase[req.body.shortURL] = req.body.longURL;
  res.redirect("/urls", templateVars);
})

// this route deletes a specified URL and redirects to the entire list of URLs
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.body.shortURL]
  let templateVars = { user: getUserById(req.cookies["user"]) };
  res.redirect("/urls", templateVars);
});

// this route redirects from the short URL to the full URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

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

// function to add a new user to the users object
function addNewUser(email, password) {
  let newUserKey = "";
  let newUserNumber = (Object.keys(users).length + 1);
    if (newUserNumber < 10) {
      newUserKey = "u0" + newUserNumber.toString();
    } else {
      newUserKey = "u" + newUserNumber.toString();
    }
    users[newUserKey] = {};
    users[newUserKey].id = generateRandomString();
    users[newUserKey].email = email;
    users[newUserKey].password = password;

    return newUserKey;
}

// function to check if user exists by their email
function doesUserExist(email) {
  for (var i in users) {
    if (email === users[i].email) {
      return true;
    }
    return false;
  }
}

// function to find and return a user by their id number
function getUserById(id) {
  let user = {};
  for (var i in users) {
    if (id === users[i].id) {
      user = users[i];
      return user;
    }
  }
}

// function to find and return a user by their email address
function getUserByEmail(email) {
  let user = {};
  for (var i in users) {
    if (email === users[i].email) {
      user = users[i];
      return user;
    }
  }
}

// function to verify that a user is registered
function verifyUser(email, password) {
  for (var i in users) {
    if (email === users[i].email && password === users[i].password) {
      return true;
    }
  }
  return false;
}



