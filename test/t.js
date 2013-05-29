var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open('http://www.quick-markup.com', function(status) {
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
});