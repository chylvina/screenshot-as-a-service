var port = phantom.args[1] || 3001;
var server = require('webserver').create();

server.listen(port, function (request, response) {
  if (request.url == '/healthCheck') {
    healthcheck(request, response);
    return;
  }

  if(request.url == '/capture') {
    capture(request, response);
    return;
  }

  if(request.url == '/findlogo') {
    findlogo(request, response);
    return;
  }

});

/// health check
var healthcheck = function (request, response) {
  response.statusCode = 200;
  response.write('up');
  response.close();
}

/// capture
var capture = function (request, response) {
  var basePath = phantom.args[0] || '/tmp/';
  var defaultViewportSize = phantom.args[2] || '';
  defaultViewportSize = defaultViewportSize.split('x');
  defaultViewportSize = {
    width: ~~defaultViewportSize[0] || 1024,
    height: ~~defaultViewportSize[1] || 600
  };

  var pageSettings = ['javascriptEnabled', 'loadImages', 'localToRemoteUrlAccessEnabled', 'userAgent', 'userName', 'password'];

  if (!request.headers.url) {
    response.statusCode = 400;
    response.write('Error: Request must contain an url header' + "\n");
    response.close();
    return;
  }
  var url = request.headers.url;
  var path = basePath + (request.headers.filename || (url.replace(new RegExp('https?://'), '').replace(/\//g, '.') + '.png'));
  var page = new WebPage();
  page.onConsoleMessage = function(msg) {
    console.log(msg);
  };
  var delay = request.headers.delay || 1000; //todo: considering if should set to 3000?
  try {
    page.viewportSize = {
      width: request.headers.width || defaultViewportSize.width,
      height: request.headers.height || defaultViewportSize.height
    };
    if (request.headers.clipRect) {
      page.clipRect = JSON.parse(request.headers.clipRect);
    }
    for (name in pageSettings) {
      if (value = request.headers[pageSettings[name]]) {
        value = (value == 'false') ? false : ((value == 'true') ? true : value);
        page.settings[pageSettings[name]] = value;
      }
    }
  }
  catch (err) {
    response.statusCode = 500;
    console.log('Error while parsing headers: ' + err.message);
    response.write('Error while parsing headers: ' + err.message);
    return response.close();
  }
  console.log('------------- Starting: ' + url);
  page.open(url, function (status) {
    if (status == 'success') {
      console.log('Open url success: ' + url);
      window.setTimeout(function () {
        page.render(path);
        console.log('Capture url success: ' + url);
        response.statusCode = 200;
        response.write('Success: Screenshot saved to ' + path + "\n");
        page.release();
        response.close();
      }, delay);
    }
    else {
      console.log('Open url failed: ' + url);
      response.statusCode = 404;
      response.write('Error: Url returned status ' + status + "\n");
      page.release();
      response.close();
    }
  });
  // must start the response now, or phantom closes the connection
  //response.statusCode = 200;
  //response.write('');
};

/// find logo
var findlogo = function (request, response) {
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
      });
    }
    else {
      console.log('Failed to inject jquery-1.10.0.min.js');
    }
  });
};
