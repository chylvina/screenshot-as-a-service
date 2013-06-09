// default settings
var basePath = phantom.args[0] || '/tmp/';
var port = phantom.args[1] || 3001;
var defaultViewportSize = phantom.args[2] || '';
defaultViewportSize = defaultViewportSize.split('x');
defaultViewportSize = {
  width: ~~defaultViewportSize[0] || 1024,
  height: ~~defaultViewportSize[1] || 600
};

// start server
var server = require('webserver').create();
server.listen(port, function (request, response) {
  var url = request.url.split('?')[0];

  if (url == '/healthCheck') {
    healthcheck(request, response);
    return;
  }

  if(url == '/capture') {
    capture(request, response);
    return;
  }

  if(url == '/find') {
    find(request, response);
    return;
  }

});

/// health check
var healthcheck = function (request, response) {
  response.statusCode = 200;
  response.write('up');
  response.close();
};

/// capture
var capture = function (request, response) {
  // URL is required.
  var url = getURL(request.url);
  if(!url || url == '') {
    response.statusCode = 400;
    response.write('Error: URL is required.');
    response.close();
    return;
  }

  var path = basePath + 'sc_' + url.replace(/^https?:\/\//, '').replace(/[\/\\\:\*\?\"\'\<\>\|]+/g, '-').substr(0, 128) + '.png';
  var delay = 1000; //todo: considering if should set to 3000?
  var page = createPage();
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
var find = function (request, response) {
  // URL is required.
  var url = getURL(request.url);
  if(!url || url == '') {
    response.statusCode = 400;
    response.write('Error: URL is required.');
    response.close();
    return;
  }

  var path = basePath + 'sc_' + url.replace(/^https?:\/\//, '').replace(/[\/\\\:\*\?\"\'\<\>\|]+/g, '-').substr(0, 128) + '.png';
  var delay = 1000; //todo: considering if should set to 3000?
  var page = createPage();

  page.open(url, function(status) {
    if (status !== 'success') {
      console.log('Unable to access network');
    }
    if(page.injectJs('jquery-1.10.0.min.js')) {
      page.evaluate(function() {
        // helpers
        var distance = function(ax, ay, bx, by) {
          return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        };
        var theBody = $('body');
        theBody.prepend('<div id="mynetwarning" style="position: absolute;font-size: 50px;color: #d14836;font-weight: bold;background-color:#fff;padding: 20px;border: solid 1px #000;"></div>');
        var warning = function(s) {
          $('#mynetwarning').append('<div style="height: 56px;  border-bottom: solid 1px #000;  line-height: 1;">' + s + '</div>');
        };
        var highlight = function(elem, color) {
          elem.css('border', 'solid 2px ' + color);
        };
        var addPoint = function(x, y, color) {
          $('body').append($('<div style="width: 2px;height: 2px;position: absolute;border: solid 2px ' + color + ';background-color: ' + color + ';"></div>').css('top', y + 'px').css('left', x + 'px'));
        };

        /// verify whether this is a mynet webpage
        var container = $('#spanMasterTemplateBackgroundBody');
        if(container.length < 1) {
          warning('这不是万网建站。');
          return;
        }
        if($('#spanMasterRepeat').length < 1) {
          warning('没有spanMasterRepeat');
        }
        if($('#spanMasterBottom').length < 1) {
          warning('spanMasterBottom');
        }
        if($('#spanMasterTop').length < 1) {
          warning('spanMasterTop');
        }

        /// find logo
        var imgJQeryList = [];

        $('img').each(function( index, elem ) {
          elem = $(elem);

          // rule 1, width & height
          if(elem.width() < 30 || elem.height() > 300 || elem.height() < 30) {
            console.log('----------', elem.get(0));
            return;
          }

          // rule 2, top, left position
          if(elem.offset().left >= 800 || elem.offset().top >= 300) {
            console.log('----------', elem.get(0));
            return;
          }

          // calculate center
          elem.data('center', { x: elem.offset().left + elem.width() / 2, y: elem.offset().top + elem.height() / 2 });
          // test center
          addPoint(elem.data('center').x, elem.data('center').y, '#ff0000');
          addPoint(container.offset().left + container.width() / 2, container.offset().top, '#ff0000');
          // calculate distance from center to document middleTop
          elem.data('distance',
              distance(elem.data('center').x, elem.data('center').y),
              container.offset().left + container.width() / 2, container.offset().top);

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
          highlight(imgJQeryList[0], '#ffff00');
        }

        /// find menu
        highlight($('.mynetMenuBox'), '#ff0000');
        /// find block
        /*var blocks = $('div').filter(function() {
          var elem = $(this);
          return (elem.css('z-index') > 0) && (elem.css('position') == 'absolute');
        });*/
        var blocks = $('div[id*="mynetdivd"]');
        highlight(blocks, '#000');
        console.log('####################### parse complete.');
      });

      //
      console.log('start render.');
      page.render(path);
      console.log('Capture url success: ' + url);
      response.statusCode = 200;
      response.write('Success: Screenshot saved to ' + path + "\n");
      page.release();
      response.close();
    }
    else {
      console.log('Failed to inject jquery-1.10.0.min.js');
      response.statusCode = 500;
      response.write('Failed to inject jquery-1.10.0.min.js');
      page.release();
      response.close();
    }
  });
};

var createPage = function() {
  var page = new WebPage();
  page.onConsoleMessage = function(msg) {
    console.log(msg);
  };

  page.viewportSize = {
    width: defaultViewportSize.width,
    height: defaultViewportSize.height
  };
  page.settings['javascriptEnabled'] = true;
  page.settings['loadImages'] = true;
  //page.settings['localToRemoteUrlAccessEnabled'] = value;
  //page.settings['userAgent'] = value;

  return page;
};

var getURL = function(urlStr) {
  var url = urlStr.split('?url=')[1] || '';
  console.log(url);
  if (~url.indexOf('://')) return url;
  return 'http://' + url;
};