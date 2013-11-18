module.exports.search = function(req, res, next){

	if(req.params.hipmunk_start_location) {
		var start = req.params.hipmunk_start_location;
		var dest = req.params.hipmunk_query_location;
		var dates = req.params.hipmunk_date_range;
		var search = start + "." + dest + "," + dates;
		console.log(req.params);
	} else {
		next();
	}
  
  var options = { "Cache-Control": "no-cache,max-age=0", "Pragma": "no-cache", 
	  "User-Agent": "Mozilla/5.0 (Windows NT 6.0; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.77 Safari/535.7" 
	};

	var firebase = require('firebase');
	var rest = require('restler');
	// var escape = require('escape');
	var querystring = require('querystring');

	var url = "http://www.hipmunk.com/api/results";
	var query_id = querystring.escape(search).replace(/\./g,'-');
	console.log(query_id);
	var firebase_url = "https://connections.firebaseio.com/flights/" + start + "/" + dest + "/";
	var time = new Date();
	var revision = "2.0";

	// var url1 = "http://www.hipmunk.com/";
	// rest.get(url1, {headers: options}).on('complete', function(data) {
	//   var rev = data.match(/\$\.hipmunk\.revision = \"([0-9\.]*)\";/);
	//   if (rev && rev.length > 1) {
	//     revision = rev[1];
	//     console.log("hipmunk revision is: " + revision);
	//   } else {
	//     console.log("revision not found, using " + revision);
	//   }

	  var post_data = {"i": search, "revision": revision};

	  rest.post(url, {headers: options, data: post_data}).on('complete', function(data) {
	    console.log(data);
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
	    // fb.child(cheapest_flight_id).update({flight_id: cheapest_flight_id, price: cheapest, depart_time: dt, found_at: new Date().toString()}, function(){
	    fb.update({flight_id: cheapest_flight_id, price: cheapest, depart_time: dt, found_at: new Date().toString()}, function(){
	    	console.log("done firebase");
	    });
	  });
	// });
	next();
};