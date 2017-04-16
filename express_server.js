"use strict";


const express = require("express");
const bodyParser = require("body-parser");
const randomize = require("randomatic");
const serveStatic = require("serve-static");
// const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session')
const bcrypt = require("bcrypt");


const app = express();
const PORT = process.env.PORT || 3000; // default port 8080


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(serveStatic(`${__dirname}/public`));
// app.use(cookieParser());
app.use(cookieSession( {
  name: "session",
  keys: ["key1", "key2"]
}))


const urlDatabase = {
  "b2xVn2": {
    userId: "randomId1",
    longURL: "http://www.lighthouselabs.ca",
    clickCount: 2
  },
  "9sm5xK": {
    userId: "randomId2",
    longURL: "http://www.google.com",
    clickCount: 4
  }
};

const users = {
  "u01": {
    id: "randomId1",
    email: "test1@email.com",
    password: "$2a$10$MetWsNszAFymAZzXZqHpQehnkZ8EiEdHNE1xmwsYEpGOInGjhLNnC"
  },
  "u02": {
    id: "randomId2",
    email: "test2@email.com",
    password: "$2a$10$IohW25g4Mj9Im1cIhxHnhezCSs6/GkuYAmwVnKtJFx4TNgzLxCAay"
  }
}



// app.get calls are routes to handle reponses given requested parameters
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    req.session = null;
  res.redirect("/login");
  }

});


// this route returns the login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    req.session = null;
    res.render("urls_login");
  }

})


// this route receives the login form parameters and redirects to the users
// index page
app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Email and Password fields cannot be empty!")
  } else if (!verifyUser(req.body.email, req.body.password)) {
      res.status(401).end("No user found!");
  } else {
      let userLogin = getUserByEmail(req.body.email);
      // res.cookie("user", userLogin.id);
      req.session.user_id = userLogin.id;
      res.redirect("/urls");
  }
});


// this route logs the user out by clearing the user cookie
app.post("/logout", (req, res) => {
  // res.clearCookie("user");
  req.session = null;
  res.redirect("/login");
});


// this route returns the urlDatabase value to the browser
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// this route returns a page for users to register to the website
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    req.session = null;
    res.render("urls_registration");
  }
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
      // res.cookie("user", users[newUser].id);
      req.session.user_id = users[newUser].id;
      res.redirect("/urls");
  }
});


// this route renders a view to display a users URLs and their shortened forms
app.get("/urls", (req, res) => {
  if (!req.session.user_id){
    // res.status(401).redirect("/sorry");
    res.status(401).render("urls_sorry");
  } else {
    let foundUser = getUserById(req.session.user_id);
    let userURLS = getURLsByUserId(foundUser.id);
    let templateVars = { user: foundUser, urls: userURLS, error: "" };
    res.render("urls_index", templateVars);
  }
});


// this route receives form submission data for converting long URLs to
// short URLs
app.post("/urls", (req, res) => {
  if (!req.session.user_id){
    res.status(401).render("urls_sorry");
  } else if (req.body.longURL === "") {
    res.redirect("/urls");
  } else {
    let urlObject = createNewShortURL(req.session.user_id, req.body.longURL);
    // res.redirect(`/urls/${urlObject}`);
    res.redirect("urls");
  }
});


// this route renders a view for users to enter full URLs to a form to
// be converted to short URLs by the server
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id){
    res.status(401).render("urls_sorry");
  } else {
      let foundUser = getUserById(req.session.user_id)
      let templateVars = { user: foundUser };
      res.render("urls_new", templateVars);
  }
});


// this route renders a view to display a single URL and it's shortened form
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id){
    res.status(401).render("urls_sorry");
  } else {
      let errors = "";
      let urlObject = getURLByShortURL(req.params.id);
      let userObj = getUserById(req.session.user_id)
      let userURLS = getURLsByUserId(userObj.id);
      let templateVars = { shortURL: req.params.id, url: urlObject,
                            user: userObj, urls: userURLS, error: errors };
      if (!urlObject) {
        errors = "That URL does not exist!";
        templateVars.error = errors;
        res.status(404).render("urls_index", templateVars);
      } else if (!verifyUserOwnsShortURL(req.session.user_id, req.params.id)) {
        errors = "You do not have access to that URL!";
        templateVars.error = errors;
        res.status(403).render("urls_index", templateVars);
      } else {
        errors = "";
        templateVars.error = errors;
        res.render("urls_show", templateVars);
      }
  }
});


// this route updates a longURL given a shortURL value and redirects
// to the entire list of URLs
app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id){
    res.status(401).render("urls_sorry");
  } else {
      let errors = "";
      let urlObject = getURLByShortURL(req.params.id);
      let userObj = getUserById(req.session.user_id)
      let userURLS = getURLsByUserId(userObj.id);
      let templateVars = { shortURL: req.params.id, url: urlObject,
                            user: userObj, urls: userURLS, error: errors };
      if (!urlObject) {
        errors = "That URL does not exist!";
        templateVars.error = errors;
        res.status(404).render("urls_index", templateVars);
      } else if (!verifyUserOwnsShortURL(req.session.user_id, req.params.id)) {
        errors = "You do not have access to that URL!";
        templateVars.error = errors;
        res.status(403).render("urls_index", templateVars);
      } else {
      updateURL(req.session.user_id, req.body.shortURL, req.body.longURL);
      res.redirect("/urls");
      }
  }
});


// this route deletes a specified URL and redirects to the entire list of URLs
app.post("/urls/:id/delete", (req, res) => {
  deleteURL(req.session.user_id, req.body.shortURL);
  res.redirect("/urls");
});


// this route redirects from the short URL to the full URL
app.get("/u/:shortURL", (req, res) => {
  if (!getURLByShortURL(req.params.shortURL)) {
    res.status(404).send("The URL you tried to access does not exist!");
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    incrementClickCounter(req.params.shortURL);
    res.redirect(longURL);
  }
});

app.get("/sorry", (req, res) => {
  req.session = null;
  res.render("urls_sorry");
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
    users[newUserKey].password = bcrypt.hashSync(password, 10);
    return newUserKey;
}


// function to check if user exists by their email
function doesUserExist(email) {
  for (var i in users) {
    if (email === users[i].email) {
      return true;
    }
  }
  return false;
}


// function to find and return a user by their id number
function getUserById(id) {
  let user1 = {};
  for (var i in users) {
    if (id === users[i].id) {
      user1 = users[i];
      return user1;
    }
  }
}


// function to find and return a user by their email address
function getUserByEmail(email) {
  let user1 = {};
  for (var i in users) {
    if (email === users[i].email) {
      user1 = users[i];
      return user1;
    }
  }
}


// function to verify that a user is registered
function verifyUser(email, password) {
  for (var i in users) {
    if (email === users[i].email && bcrypt.compareSync(password, users[i].password)) {
      return true;
    }
  }
  return false;
}


function createNewShortURL(userId, longURL) {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].userId = userId;
  urlDatabase[shortURL].clickCount = 0;

  if (longURL.includes("http://") || longURL.includes("https://")) {
    urlDatabase[shortURL].longURL = longURL;
  } else {
    urlDatabase[shortURL].longURL = "https://" + longURL;
  }

  return shortURL;
}


function getURLsByUserId(userId) {
  let userURLS = {};
  for (var i in urlDatabase) {
    if (urlDatabase[i].userId === userId) {
      userURLS[i] = urlDatabase[i];
    }
  }
  return userURLS;
}


function getURLByShortURL(shortURL){
  let url = {};
  for (var i in urlDatabase) {
    if (i === shortURL) {
      return urlDatabase[i];
    }
  }
}

function verifyUserOwnsShortURL(userId, shortURL) {
  console.log("userId:", userId);
  console.log("shortURL:", shortURL);
  for (var i in urlDatabase) {
    console.log("i:", i);
    if (i === shortURL) {
      console.log("i-userId:", urlDatabase[i].userId);
      return urlDatabase[i].userId === userId;
    }
  }
  return false;
}


function updateURL(userId, shortURL, longURL) {
  for (var i in urlDatabase) {
    if ((shortURL === i && userId === urlDatabase[i].userId) && longURL !== "") {
      urlDatabase[i].longURL = longURL;
      urlDatabase[i].clickCount = 0;
    }
  }
}


function deleteURL(userId, shortURL) {
  for (var i in urlDatabase) {
    if (shortURL === i && userId === urlDatabase[i].userId) {
      delete urlDatabase[i];
    }
  }
}

function incrementClickCounter(shortURL) {
  let sURL = getURLByShortURL(shortURL);
  sURL.clickCount += 1;
}

