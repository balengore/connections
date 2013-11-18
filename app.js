
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var facebook = require('facebook-node-sdk');
var rest = require("restler");
var cheerio = require("cheerio");
var firebase = require('firebase');

var hipmunk = require('./routes/hipmunk');
var scope = "user_location,friends_location,friends_birthday";


var app = express();

// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(facebook.middleware({ appId: '635478493171548', secret: '6f4d17ef22fdedf0f835ffbdf6e5d6b9', scope: scope}));
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

app.locals({
  getRandomColor: function() {
    var letters = '0123456789ABCDEF'.split('');
	  var color = '#';
	  for (var i = 0; i < 6; i++ ) {
	   	color += letters[Math.round(Math.random() * 15)];
	  }
	  return color;
  }
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/friends', facebook.loginRequired({scope: scope}), routes.friends);
app.get('/flights/:hipmunk_query', hipmunk.search, routes.flights);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
