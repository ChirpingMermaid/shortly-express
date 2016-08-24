var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

//middleware function 
var restrict = function (req, res, next) {
  console.log('in restrict req session user------>', req.session.user);
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
};


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
//express.static sends back any static file in the public directory
app.use(express.static(__dirname + '/public'));

// app.use(function (req, res, next) {
//   console.log('Before', req);
//   next();
// });

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

// app.use(function (req, res, next) {
//   console.log('After', req);
//   next();
// });

app.get('/', restrict,
function(req, res) {
  res.render('index');
});

app.get('/create', restrict, 
function(req, res) {
  //if a user tries to create a link and is not signed in, redirect to /login
  res.render('index');
});

app.get('/links', restrict, 
function(req, res) {
  //if a user tries to see all of the links and is not signed in, redirect to /login
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });  
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({'username': username, 'password': password}).fetch().then(function(found) {
    if (found) {
      req.session.regenerate(function() {
        req.session.user = username;
        console.log('in post login---------->', req.session.user);
        res.status(200);
        res.redirect('/');
      });
    } else {
      res.redirect('login');
    }
  });
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username; //express and body parser allows this notation
  var password = req.body.password;

  new User({'username': username}).fetch().then(function(found) {
    if (found) {
      res.status(200);
      res.redirect('/login');

    } else {
      //creating a new model to collection and bookshelf will create a new row to the table
      Users.create({
        username: username,
        password: password
      })
      .then(function(newUser) {
        req.session.regenerate(function() {
          req.session.user = username;
          //console.log("req session user in post req--------->", req.session.user);
          res.status(200);
          res.redirect('/');
        });
      }).catch(function(err) {
        console.log("ERROR!!!!!", err);
      });
    }
  });


});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
