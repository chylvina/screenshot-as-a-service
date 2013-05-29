/*var page = require('webpage').create(),
	db = require("mongojs").connect('mongodb://localhost/mynetrnd', ["sites"]);

page.onConsoleMessage = function(msg) {
    console.log(msg);
};*/

/*page.open('http://www.quick-markup.com', function(status) {
	if (status !== 'success') {
        console.log('Unable to access network');
    }
	if(page.injectJs('jquery-1.10.0.min.js')) {
		page.evaluate(function() {
            console.log($('#main').offset().top);
        });
	    phantom.exit();
	}
	else {
		console.log('Failed to inject jquery-1.10.0.min.js');
	}
});*/

var db = require("mongojs").connect('mongodb://localhost/mynetrnd', ["sites"]);

db.sites.find(function(err, res) {
	for(var i = 0; i < res.length; i++) {
		var r = res[i];
		console.log(r._id);
	}
});