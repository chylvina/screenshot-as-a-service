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
  page.onConsoleMessage = function (msg) {
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

var getURL = function (url) {
  if (~url.indexOf('://')) return url;
  return 'http://' + url;
};

/// find logo
var parse = function (urlStr, request, response) {
  // URL is required.
  var url = getURL(urlStr);
  if (!url || url == '') {
    console.log('error');
    phantom.exit();
    return;
  }
  var page = createPage();

  console.log('Opening: ' + url);
  page.open(url, function (status) {
    if (status !== 'success') {
      console.log('error');
      phantom.exit();
    }
    if (page.injectJs('jquery-1.10.0.min.js')) {
      page.evaluate(function () {
        /// Block type constants
        var TYPE_LOGO = 0,
            TYPE_MENU = TYPE_LOGO + 1,
            TYPE_NAVVAR = TYPE_MENU + 1,
            TYPE_FORM = TYPE_NAVVAR + 1,
            TYPE_FOOTER = TYPE_FORM + 1;

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
            IMAGE_MAX_HEIGHT = 800,
            LAYOUT_OFFSET = 5,
            FOOTER_INDEX_MAX = 6;

        /// helpers
        var distance = function (ax, ay, bx, by) {
          return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        };
        var warning = function (s) {
          $('#mynetwarning').append('<div style="height: 56px;  border-bottom: solid 1px #000;  line-height: 1;">' + s + '</div>');
        };
        var highlight = function (elem, color) {
          elem.css('border', 'solid 2px ' + color);
        };
        var addPoint = function (x, y, color) {
          $('body').append($('<div style="z-index: 999;width: 2px;height: 2px;position: absolute;border: solid 2px ' + color + ';background-color: ' + color + ';"></div>').css('top', y + 'px').css('left', x + 'px'));
        };
        var setBlockType = function (block, type) {
          block.data('mynetBlockType', type);
        };
        var getBlockType = function (block) {
          return block.data('mynetBlockType');
        };

        /// find logo
        var findlogo = function () {
          var imgList = [];
          var result = {};

          // we assume the logo will only exist in blocks
          blocks.find('img').each(function (index, elem) {
            elem = $(elem);

            // rule 1, width & height
            if (elem.width() < LOGO_MIN_WIDTH || elem.height() > LOGO_MAX_HEIGHT || elem.height() < LOGO_MIN_HEIGHT) {
              return;
            }

            // rule 2, top, left position
            if (elem.offset().left >= LOGO_MAX_LEFT || elem.offset().top >= LOGO_MAX_TOP) {
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

          if (imgList.length > 0) {
            // rule 3, sort distance from center to document leftTop
            if (imgList.length > 1) {
              imgList.sort(function (a, b) {
                return a.data('distance') - b.data('distance');
              });
            }

            setBlockType(imgList[0].parents('div[id*="mynetdivd"]'), TYPE_LOGO);

            // highlight the result for testing
            highlight(imgList[0], '#ffff00');

            result.src = imgList[0].attr('src');
            if(imgList[0].parent().is('a')) {
              result.url = imgList[0].parent().attr('href');
            }
          }

          return result;
        };

        /// find menu
        var findmenu = function () {
          var navs = $('.mynetMenuBox').parents('div[id*="mynetdivd"]');
          setBlockType(navs, TYPE_MENU);
        };

        /// find form
        var findform = function () {
          var forms = $(':input').filter(':not([type="hidden"])').parents('div[id*="mynetdivd"]');
          setBlockType(forms, TYPE_FORM);
        };

        /// find footer
        var findfooter = function () {
          for (var i = 0; i < blocksLayout.length; i++) {
            if (i > FOOTER_INDEX_MAX) {
              return;
            }

            var block = blocksLayout[blocksLayout.length - i - 1].elem;
            if (block.text().search(/技术支持：中国万网|版权|icp备|copyright|备\d+号/i) > -1) {
              // founded
              setBlockType(block, TYPE_FOOTER);
              return;
            }
          }
        };

        /// find layout
        var findlayout = function () {
          var topLeftSort = function (arr, offset) {
            if (!arr || !offset) {
              return false;
            }

            var result = [];

            // y axis sort
            arr.sort(function (a, b) {
              return a.top - b.top;
            });

            // x axis sort
            while (arr.length > 0) {
              var tempArr = [];
              tempArr.push(arr.shift());
              while (arr.length > 0
                  && Math.abs(tempArr[tempArr.length - 1].top - arr[0].top) <= offset) {
                tempArr.push(arr.shift());
              }
              tempArr.sort(function (a, b) {
                return a.left - b.left;
              });
              result = result.concat(tempArr);
            }

            return result;
          };

          var layout = [];
          blocks.each(function (index, elem) {
            elem = $(elem);

            var data = {};
            data.elem = elem;
            data.top = elem.offset().top;
            data.left = elem.offset().left;
            layout.push(data);
          });

          return topLeftSort(layout, LAYOUT_OFFSET);
        };

        /// parse common block
        var parseCommonBlock = function (block) {
          // helpers
          var isValidImage = function (img) {
            return img.width() >= IMAGE_MIN_WIDTH || img.height() >= IMAGE_MIN_HEIGHT;
          };
          var isTitle = function (elem) {
            return (elem.is('div')) || (elem.css('font-weight') == 'bold');
          };

          // remove script tag
          block.find('script').remove();
          // remove flash tag
          block.find('object').remove();

          var resultArr = [];
          var titleFound = false; // we assume there is only one title exists.

          var doParse = function (container) {   // 必须是深度优先遍历
            container.contents().each(function (index, elem) {
              elem = $(elem);
              var data;

              // if this is a text node
              if (elem.get(0).nodeType == 3
                  && elem.text() && elem.text() != '') {
                if (!titleFound && isTitle(container)) {
                  data = {};
                  data.type = 'title';
                  data.value = elem.text();
                  resultArr.push(data);
                  titleFound = true;    // title founded!
                  return;
                }
                // get the last elem in the array
                var lastElem1 = resultArr[resultArr.length - 1];
                if (lastElem1 && lastElem1.type == 'text') {
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

              switch (String(elem.get(0).tagName).toLowerCase()) {
                case 'a':
                  // verify the anchor is valid
                  if (!elem.attr('href') || elem.attr('href') == '') {
                    return;
                  }

                  // we assume there is only one node under the anchor
                  if (elem.find('img').length > 0) {
                    data = {};
                    data.type = 'image';
                    data.url = elem.attr('href');
                    data.target = elem.attr('target') || '';
                    data.src = elem.find('img').attr('src');
                    resultArr.push(data);
                  }
                  else if (elem.text() && elem.text() != '') {
                    data = {};
                    data.type = 'link';
                    data.url = elem.attr('href');
                    data.target = elem.attr('target') || '';
                    data.value = elem.text();
                    resultArr.push(data);
                  }

                  return;
                case 'img':
                  /*if (!isValidImage(elem)) {
                    console.log('--------------', elem.get(0));
                    return;
                  }*/
                  data = {};
                  data.type = 'image';
                  data.src = elem.attr('src');
                  resultArr.push(data);
                  return;
                case 'br':
                  // get the last elem in the array
                  var lastElem2 = resultArr[resultArr.length - 1];
                  if (lastElem2 && lastElem2.type == 'text') {
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
          while (resultArr.length > 0) {
            var data = resultArr.shift();
            switch (data.type) {
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
                  "text": data.value,
                  "target": data.target
                });
                break;
            }
          }

          if (result.length > 0) {
            return JSON.stringify(result);
          }

          return null;
        };

        /// init global objects
        var theBody = $('body'),
            container = $('#spanMasterTemplateBackgroundBody'),
            blocks = $('div[id*="mynetdivd"]'),
            blocksLayout = findlayout(),
            result = {};

        /// init UI for testing
        theBody.prepend('<div id="mynetwarning" style="position: absolute;font-size: 50px;color: #d14836;font-weight: bold;background-color:#fff;padding: 20px;border: solid 1px #000;"></div>');
        addPoint(container.offset().left + container.width() / 2, container.offset().top, '#ff0000');
        highlight($('.mynetMenuBox'), '#ff0000');
        highlight(blocks, '#000');

        /// verify whether this is a mynet webpage
        if (container.length < 1) {
          warning('这不是万网建站。');
          return;
        }
        if ($('#spanMasterRepeat').length < 1) {
          warning('没有spanMasterRepeat');
        }
        if ($('#spanMasterBottom').length < 1) {
          warning('spanMasterBottom');
        }
        if ($('#spanMasterTop').length < 1) {
          warning('spanMasterTop');
        }

        /// find
        findmenu();
        findform();
        findfooter();

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

        // parse blocks after all special blocks founded.
        result.content = [];
        for (var i = 0; i < blocksLayout.length; i++) {
          var block = blocksLayout[i].elem;
          var data;
          switch (getBlockType(block)) {
            case TYPE_LOGO:
              // do nothing
              break;
            case TYPE_MENU:
              data = {};
              data.t = 'navbar';
              data.level1 = [];
              block.find("script:contains('mynetMenuRegisterData')")
                  .text().replace(/[\r\n]*/img, '').split(';')
                  .filter(function (item, index) {
                    return item.search(/mynetMenuData/i) > -1;
                  })
                  .map(function (item, index) {
                    return item.replace(/^.*mynetMenueItem\(/im, '')
                        .replace(/\)\)|'|"|\\/g, '')
                        .replace(/onclick=window\.location\.href=/i, '')
                        .split(',');
                  })
                  .forEach(function (item, index, array) {
                    if(item[1] == '') {
                      data.level1.push({
                        "t": "navbtn1",
                        "url": item[4],
                        "text": item[3]
                      });
                    }
                    else {
                      var lastelem = data.level1[data.level1.length - 1];
                      if(!lastelem.level2) {
                        lastelem.level2 = [];
                      }
                      lastelem.level2.push({
                        "t": "navbtn2",
                        "url": item[4],
                        "text": item[3]
                      });
                    }
                  });
              result.content.push(data);
              break;
            case TYPE_FORM:
                // do nothing currently
              break;
            case TYPE_FOOTER:
              if(result.footer) {   // we assert there is only one footer
                console.log('One more footer founded!');
                return;
              }
              result.footer = parseCommonBlock(block);
              break;
            default:
                data = parseCommonBlock(block);
                if(data) {
                  result.content = result.content.concat(data);
                }
              break;
          }
        }

        // header
        result.header = {};
        if (result.logo.src) {
          result.header.t = 'image';
          result.header.src = result.logo.src;
        }
        else {
          result.header.t = 'text';
          result.header.src = result.title;
        }

        console.log('####################### parse complete.', result);
      });

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