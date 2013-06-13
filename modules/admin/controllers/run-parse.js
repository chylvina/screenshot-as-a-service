// default settings
var urlStr = phantom.args[0] || '';
var basePath = phantom.args[1] || '/tmp/';
var defaultViewportSize = phantom.args[2] || '';
defaultViewportSize = defaultViewportSize.split('x');
defaultViewportSize = {
  width: ~~defaultViewportSize[0] || 1024,
  height: ~~defaultViewportSize[1] || 600
};

var createPage = function () {
  var page = new WebPage();

  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    //console.log(msg);
  };

  page.viewportSize = {
    width: defaultViewportSize.width,
    height: defaultViewportSize.height
  };
  page.settings['javascriptEnabled'] = true;
  page.settings['loadImages'] = true;    // we do not need show image here.
  //page.settings['localToRemoteUrlAccessEnabled'] = value;
  //page.settings['userAgent'] = value;

  return page;
};

var getURL = function (url) {
  if (~url.indexOf('://')) return url;
  return 'http://' + url;
};

var parse = function (urlStr, request, response) {
  // URL is required.
  var url = getURL(urlStr);
  if (!url || url == '') {
    console.error('error');
    phantom.exit();
    return;
  }
  var page = createPage();

  console.log('Opening: ' + url);
  page.open(url, function (status) {
    if (status !== 'success') {
      console.error('error');
      phantom.exit();
    }
    if (page.injectJs('inject.js')) {
      var result = page.evaluate(function(){
        return mynet_parse();
      });
      // !! important, NO MORE chars are allowed to output after this.
      // Or else the result string will be destroyed
      console.log('result:' + result);
      page.release();
      phantom.exit();
    }
    else {
      console.error('Failed to inject inject.js');
      page.release();
      phantom.exit();
    }
  });
};

parse(urlStr);