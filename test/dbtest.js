var db = require("mongojs").connect('mongodb://localhost/mynetrnd', ["sites"]);

db.sites.update({domain1: 'jf68.com'}, {$set: {available: "0"}}, function(err, updated) {
//db.sites.find({domain1: 'jf68.com'}, function(err, updated) {
  if( err || !updated ) {
  	console.log(err);
  }
  else {
	console.log(updated);
  }
});