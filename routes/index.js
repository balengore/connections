
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.flights = function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok');

  var options = { "Cache-Control": "no-cache,max-age=0", "Pragma": "no-cache", 
	  "User-Agent": "Mozilla/5.0 (Windows NT 6.0; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.77 Safari/535.7" 
	};

	// var firebase = app.get("firebase");
	// var rest = app.get("restler");

	var firebase = require('firebase');
	var rest = require('restler');
	var url = "http://www.hipmunk.com/api/results";
	var search = req.params.hipmunk_query ? req.params.hipmunk_query : "SFO.LAS,Dec05.Dec09";
	console.log(req.params);

	var firebase_url = "https://connections.firebaseio.com/flights/" + search.replace(/\./g,'-') + "/";
	var time = new Date();
	var revision = "2.0";

	var url1 = "http://www.hipmunk.com/";
	rest.get(url1, {headers: options}).on('complete', function(data) {
	  var rev = data.match(/\$\.hipmunk\.revision = \"([0-9\.]*)\";/);
	  if (rev && rev.length > 1) {
	    revision = rev[1];
	    console.log("hipmunk revision is: " + revision);
	  } else {
	    console.log("revision not found, using " + revision);
	  }

	  var post_data = {"i": search, "revision": revision};

	  rest.post(url, {headers: options, data: post_data}).on('complete', function(data) {
	    var json_data = JSON.parse(data);
	    var itins = json_data.itins;
	    var routings = json_data.routings
	    var cheapest = 5000;
	    var cheapest_flight_id = "";
	    for (var i in itins) {
	      var idx = itins[i].idx_routings;
	      var d = routings[0][idx[0]];
	      var d_date = new Date(d.legs[0].depart);
	      var dt = d_date.getHours() + ":" + d_date.getMinutes();
	      var r = routings[1][idx[1]];
	      var r_date = new Date(r.legs[0].depart);
	      var rt = r_date.getHours() + ":" + r_date.getMinutes();
	      var flight_id = dt + "-" + d.legs[0].from_code + "-" + d.legs[0].to_code + "-" + d.legs[0].marketing_num[0] + "-" + d.legs[0].marketing_num[1] + "," 
	        + rt + "-" + r.legs[0].from_code + "-" + r.legs[0].to_code + "-" + r.legs[0].marketing_num[0] + "-" + r.legs[0].marketing_num[1];

	      if (itins[i].price < cheapest) {
	        cheapest = itins[i].price;
	        cheapest_flight_id = flight_id;
	        console.log("Cheapest is: " + flight_id + ", $" + cheapest);
	      }
	    }
	    var fb = new firebase(firebase_url);
	    fb.child(cheapest_flight_id).update({price: cheapest, depart_time: dt, found_at: new Date().toString()}, function(){
	    	console.log("done firebase");
	    });
	  });
	});
};

exports.friends = function(req, res){
	req.facebook.api({method: 'fql.multiquery', queries: {"friends":"select uid2 from friend where uid1 = me()",
"locations":"select current_location,name,uid,pic_square from user where uid in (SELECT uid2 FROM #friends)"}}, function (err, data) {
		console.log(err);
		// console.log(data);
		
		var friend_ids = [];
		var friend_names = [];
		var friend_locations = [];
		var location_to_friend_map = {};
		var sorted_locations = [];
		
		for(var i in data[0].fql_result_set) {
			var uid = data[0].fql_result_set[i].uid2;
			var location = data[1].fql_result_set[i].current_location;
			var name = data[1].fql_result_set[i].name;
			var pic = data[1].fql_result_set[i].pic_square;
			
			friend_ids.push(uid);
			friend_names.push(name);
			friend_locations.push(location);
			if(location) {
				if(!location_to_friend_map[location.name]) {
					location_to_friend_map[location.name] = [pic];
				} else {
					location_to_friend_map[location.name].push(pic);
				}
			}
		}

		for(var loc in location_to_friend_map) {
			sorted_locations.push({location: loc, count: location_to_friend_map[loc].length});
		}

		console.log(sorted_locations);
		sorted_locations = sorted_locations.sort(function(a, b) {
			if (a.count < b.count)
		    return -1;
		  if (a.count > b.count)
		    return 1;
		  return 0;
		}).reverse().slice(0, 10);
		console.log(sorted_locations);

		// console.log(friend_ids);
		// console.log(friend_names);
		// console.log(friend_locations);
		res.render('friends', { title: 'Friends', friend_ids: friend_ids, friend_names: friend_names, friend_locations: friend_locations, location_to_friend_map:location_to_friend_map, sorted_locations: sorted_locations});
	});
};