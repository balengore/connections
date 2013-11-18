var express = require('express');
var Facebook = require('facebook-node-sdk');
var scope = "user_location,friends_location"

var app = express();

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'balen testing foo bar' }));
  app.use(Facebook.middleware({ appId: '635478493171548', secret: '6f4d17ef22fdedf0f835ffbdf6e5d6b9', scope: scope}));
});

app.get('/', Facebook.loginRequired({scope: scope}), function (req, res) {
  req.facebook.api('/me', function(err, user) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello, ' + user.name + '!');
  });
});

app.get('/friends', Facebook.loginRequired(), function (req, res) {
  req.facebook.api('/me/friends', function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log(data);
    res.end('Hello, ' + data + '!');
  });
});

app.get('/friend/:facebook_id', Facebook.loginRequired(), function (req, res) {
  req.facebook.api('/' + req.params.facebook_id, function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log(data);
    res.end('Hello, ' + data + '!');
  });
});

app.get('/friendloc/:facebook_id', Facebook.loginRequired(), function (req, res) {
  req.facebook.api('/' + req.params.facebook_id + "?fields=id,name,location", function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log(data);
    res.end('Hello, ' + data + '!');
  });
});

app.get('/friendmap', Facebook.loginRequired(), function (req, res) {
	req.facebook.api({method: 'fql.multiquery', queries: {"friends":"select uid2 from friend where uid1 = me()",
"locations":"select current_location,name,uid from user where uid in (SELECT uid2 FROM #friends)"}}, function (err, data) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		console.log(err);
		console.log(data);
		
		var friend_ids = [];
		var friend_names = [];
		var friend_locations = [];
		var html = "<html><body>";
		
		for(var i in data[0].fql_result_set) {
			var uid = data[0].fql_result_set[i].uid2;
			var location = data[1].fql_result_set[i].current_location;
			var name = data[1].fql_result_set[i].name;
			
			friend_ids.push(uid);
			friend_names.push(name);
			friend_locations.push(location);
			if(location && location.city) {
				html += "<div>" + name + ": " + location.city + ", " + location.state + ", (" + location.name + ") " + location.latitude + "," + location.longitude + "</div>";
			} else {
				html += "<div>" + name + "</div>";
			}
		}

		html += "</body></html>";
		
		console.log(friend_ids);
		console.log(friend_names);
		console.log(friend_locations);
    res.end(html);
	});
});

app.listen(5000);
console.log('Listening on port 5000');
