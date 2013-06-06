// default settings
var urlStr = phantom.args[0] || '';
var basePath = phantom.args[1] || '/tmp/';
var defaultViewportSize = phantom.args[2] || '';
defaultViewportSize = defaultViewportSize.split('x');
defaultViewportSize = {
  width: ~~defaultViewportSize[0] || 1024,
  height: ~~defaultViewportSize[1] || 600
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
  page.settings['loadImages'] = false;    // we do not need show image here.
  //page.settings['localToRemoteUrlAccessEnabled'] = value;
  //page.settings['userAgent'] = value;

  return page;
};

var getURL = function(url) {
  if (~url.indexOf('://')) return url;
  return 'http://' + url;
};

/// find logo
var parse = function (urlStr, request, response) {
  // URL is required.
  var url = getURL(urlStr);
  if(!url || url == '') {
    console.log('error');
    phantom.exit();
    return;
  }
  var page = createPage();

  console.log('Opening: ' + url);
  page.open(url, function(status) {
    if (status !== 'success') {
      console.log('error');
      phantom.exit();
    }
    if(page.injectJs('jquery-1.10.0.min.js')) {
      page.evaluate(function() {
        /// global objects
        var theBody = $('body'),
            container = $('#spanMasterTemplateBackgroundBody'),
            blocks = $('div[id*="mynetdivd"]'),
            result = {};

        /// Block type constants
        var TYPE_LOGO = 0,
            TYPE_MENU = TYPE_LOGO + 1,
            TYPE_NAVVAR = TYPE_MENU + 1,
            TYPE_FORM = TYPE_NAVVAR + 1;

        /// constants
        var LOGO_MIN_WIDTH = 30,
            LOGO_MIN_HEIGHT = 30,
            LOGO_MAX_WIDTH = 800,
            LOGO_MAX_HEIGHT = 300,
            LOGO_MAX_LEFT = 800,
            LOGO_MAX_TOP = 300,
            IMAGE_MIN_WIDTH = 50,
            IMAGE_MIN_HEIGHT = 50,
            IMAGE_MAX_WIDTH = 800,
            IMAGE_MAX_HEIGHT = 800;

        /// helpers
        var distance = function(ax, ay, bx, by) {
          return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        };
        var warning = function(s) {
          $('#mynetwarning').append('<div style="height: 56px;  border-bottom: solid 1px #000;  line-height: 1;">' + s + '</div>');
        };
        var highlight = function(elem, color) {
          elem.css('border', 'solid 2px ' + color);
        };
        var addPoint = function(x, y, color) {
          $('body').append($('<div style="z-index: 999;width: 2px;height: 2px;position: absolute;border: solid 2px ' + color + ';background-color: ' + color + ';"></div>').css('top', y + 'px').css('left', x + 'px'));
        };
        var setBlockType = function(block, type) {
          block.data('mynetBlockType', type);
        };
        var getBlockType = function(block) {
          return block.data('mynetBlockType');
        };
        var isValidImage = function(img) {
          console.log(img.width(), img.height(), img.width() >= IMAGE_MIN_WIDTH && img.height() >= IMAGE_MIN_HEIGHT
              && img.width() <= IMAGE_MAX_WIDTH && img.height() <= IMAGE_MAX_HEIGHT);
          return img.width() >= IMAGE_MIN_WIDTH && img.height() >= IMAGE_MIN_HEIGHT
                    && img.width() <= IMAGE_MAX_WIDTH && img.height() <= IMAGE_MAX_HEIGHT;
        };
        var isTitle = function(elem) {
          return (elem.css('font-weight') == 'bold') && (elem.is('div'));
        };

        /// init UI for testing
        theBody.prepend('<div id="mynetwarning" style="position: absolute;font-size: 50px;color: #d14836;font-weight: bold;background-color:#fff;padding: 20px;border: solid 1px #000;"></div>');
        addPoint(container.offset().left + container.width() / 2, container.offset().top, '#ff0000');

        /// verify whether this is a mynet webpage
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
        var findlogo = function() {
          var result = {};
          var imgList = [];

          // we assume the logo will only exist in blocks
          blocks.find('img').each(function( index, elem ) {
            elem = $(elem);

            // rule 1, width & height
            if(elem.width() < LOGO_MIN_WIDTH || elem.height() > LOGO_MAX_HEIGHT || elem.height() < LOGO_MIN_HEIGHT) {
              console.log('----------', elem.get(0));
              return;
            }

            // rule 2, top, left position
            if(elem.offset().left >= LOGO_MAX_LEFT || elem.offset().top >= LOGO_MAX_TOP) {
              console.log('----------', elem.get(0));
              return;
            }

            // calculate center
            elem.data('center', { x: elem.offset().left + elem.width() / 2, y: elem.offset().top + elem.height() / 2 });
            // test center
            addPoint(elem.data('center').x, elem.data('center').y, '#ff0000');
            // calculate distance from center to document middleTop

            elem.data('distance',
                distance(elem.data('center').x, elem.data('center').y,
                    container.offset().left, container.offset().top));
            imgList.push(elem);
          });

          if(imgList.length > 0) {
            // rule 3, sort distance from center to document leftTop
            if(imgList.length > 1) {
              imgList.sort(function(a, b) {
                return a.data('distance') - b.data('distance');
              });
            }

            setBlockType(imgList[0], TYPE_LOGO);

            // highlight the result
            highlight(imgList[0], '#ffff00');

            result.src = imgList[0].attr('src');
          }

          return result;
        };

        /// start parsing
        // todo: escape unexpeced chars such as ' " etc
        // domain
        result.domain = urlStr.replace(/^.*\:\/\//gi, '').replace(/\/.*$/gi, '') || '';
        // url
        result.url = urlStr.replace(/^.*\:\/\//gi, '').replace(result.domain, '') || '/';
        // title
        result.title = document.title || '';
        // logo
        result.logo = findlogo();
        // header
        result.header = {};
        if(result.logo.src) {
          result.header.t = 'image';
          result.header.src = 'result.logo.src';
        }
        else {
          result.header.t = 'text';
          result.header.src = result.title;
        }

        /// find menu
        var findmenu = function() {
          var navs = $('.mynetMenuBox').parents('div[id*="mynetdivd"]');
          setBlockType(navs, TYPE_MENU);
        };

        /// find form
        var findform = function() {
          var forms = $(':input').filter(':not([type="hidden"])').parents('div[id*="mynetdivd"]');
          setBlockType(forms, TYPE_FORM);
        };

        highlight($('.mynetMenuBox'), '#ff0000');
        /// find block
        highlight(blocks, '#000');
        console.log('####################### parse complete.');
      });

      /// parse common block
      var parseCommonBlock = function(block) {
        // remove script tag
        block.find('script').remove();
        // remove flash tag
        block.find('object').remove();

        var resultArr = [];
        var titleFound = false; // we assume there is only one title exists.

        var doParse = function(container) {   // 必须是深度优先遍历
          container.contents().each(function( index, elem ) {
            elem = $(elem);
            var data;

            // if this is a text node
            if(elem.get(0).nodeType == 3
                && elem.text() && elem.text() != '') {
              if(!titleFound && isTitle(container)) {
                data = {};
                data.type = 'title';
                data.value = elem.text();
                resultArr.push(data);
                titleFound = true;    // title founded!
                return;
              }
              // get the last elem in the array
              var lastElem1 = resultArr[resultArr.length - 1];
              if(lastElem1 && lastElem1.type == 'text') {
                // merge two text node
                lastElem1.value += elem.text();
              }
              else {
                // create new text node
                data = {};
                data.type = 'text';
                data.value = elem.text();
                resultArr.push(data);
              }

              return;
            }

            switch(String(elem.get(0).tagName.toLowerCase())) {
              case 'a':
                // verify the anchor is valid
                if(!elem.attr('href') || elem.attr('href') == '') {
                  return;
                }

                // we assume there is only one node under the anchor
                if(elem.find('img').length > 0) {
                  if(!isValidImage(elem.find('img'))) {
                    return;
                  }
                  data = {};
                  data.type = 'image';
                  data.url = elem.attr('href');
                  data.target = elem.attr('target') || '';
                  data.src = elem.find('img').attr('src');
                  resultArr.push(data);
                }
                else if(elem.text() && elem.text() != '') {
                  data = {};
                  data.type = 'link';
                  data.url = elem.attr('href');
                  data.target = elem.attr('target') || '';
                  data.text = elem.text();
                  resultArr.push(data);
                }

                return;
              case 'img':
                if(!isValidImage(elem)) {
                  return;
                }
                data = {};
                data.type = 'image';
                data.src = elem.attr('src');
                resultArr.push(data);
                return;
              case 'br':
                // get the last elem in the array
                var lastElem2 = resultArr[resultArr.length - 1];
                if(lastElem2 && lastElem2.type == 'text') {
                  // append <br> to last text node
                  lastElem2.value += '<br>';
                }
                // else discard the <br>

                return;
            }

            doParse(elem);
          });
        };

        // processing
        doParse(block);

        // result
        var result = [];
        while(resultArr.length > 0) {
          var data = resultArr.shift();
          switch(data.type) {
            case 'title':
                result.push({
                  "t": "title",
                  "text": data.value.trim()
                });
              break;
            case 'text':
              result.push({
                "t": "text",
                "text": data.value.trim()
              });
              break;
            case 'image':
              result.push({
                "t": "image",
                "url": data.url,
                "src": data.src,
                "target": data.target
              });
              break;
            case 'link':
              result.push({
                "t": "link",
                "url": data.url,
                "text": data.text,
                "target": data.target
              });
              break;
          }
        }

        if(result.length > 0) {
          return JSON.stringify(result);
        }

        return null;
      };

      //
      console.log('Capture url success: ' + url);
      page.release();
      phantom.exit();
    }
    else {
      console.log('Failed to inject jquery-1.10.0.min.js');
      page.release();
      phantom.exit();
    }
  });
};

parse(urlStr);