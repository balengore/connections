
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.flights = function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok');
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

		var hipmunk = require('./hipmunk');
		for(var loc in sorted_locations) {
			console.log(sorted_locations[loc]);
			req.params.hipmunk_start_location = "SFO"
			req.params.hipmunk_query_location = sorted_locations[loc].location;
			req.params.hipmunk_date_range = "Nov22.Nov24";
			hipmunk.search(req, res, function(){});
		}

		// console.log(friend_ids);
		// console.log(friend_names);
		// console.log(friend_locations);
		res.render('friends', { title: 'Friends', friend_ids: friend_ids, friend_names: friend_names, friend_locations: friend_locations, location_to_friend_map:location_to_friend_map, sorted_locations: sorted_locations});
	});
};