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

var imgJQeryList = [];

$('img').each(function( index, elem ) {
	elem = $(elem);

	// rule 1, width & height
	if(elem.width() >= 500 || elem.width() <= 20 || elem.height() >= 400 || elem.height() <= 20) {
		console.log('----------', elem.get(0));
		//imgJQeryList.splice(index, 1);
		return;
	}

	// rule 2, top, left position
	if(elem.offset().left >= 800 || elem.offset().top >= 300) {
		console.log('----------', elem.get(0));
		//imgJQeryList.splice(index, 1);
		return;
	}

	// calculate center
  	elem.data('center', { x: elem.offset().left + elem.width() / 2, y: elem.offset().top + elem.height() / 2 });
  	// test center
  	//$('body').append($('<div style="width: 2px;height: 2px;position: absolute;border: solid 2px #ff0000;background-color: #ff0000;"></div>').css('top', elem.data('center').y + 'px').css('left', elem.data('center').x + 'px'));
  	// calculate distance from center to document leftTop
  	elem.data('distance', squareRoot(elem.data('center').x, elem.data('center').y));

  	imgJQeryList.push(elem);
});

if(imgJQeryList.length > 0) {
	// rule 3, sort distance from center to document leftTop
	if(imgJQeryList.length > 1) {
		imgJQeryList.sort(function(a, b) {
			return a.data('distance') - b.data('distance');
		});
	}

	// highlight the result
	imgJQeryList[0].css('border', 'solid 2px #ffff00');
}

var squareRoot = function(a, b) {
  return Math.sqrt(a*a + b*b);
};