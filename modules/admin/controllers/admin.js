/**
 * Admin Controller
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 下午4:57
 * Description:
 */

var request = require('request'),
    phantom = require('node-phantom'),
    util = require('../../../lib/utils'),
    config = require('config');

exports.findall = function (req, res, next) {
  var db = require("mongojs").connect(config.db.url, [config.db.collections]);

  var index = 0;
  var sites = null;

  db.sites.find(function (err, result) {
    if (err || !result) {
      return res.send(500, 'Failed when indexing db.');
    }

    sites = result;
    doFind();
    return res.send(200, 'Running.'); // 不等待全部运行完毕，直接返回。
  });

  var doFind = function () {
    if (index >= sites.length) {
      return;
    }

    var domain = (sites[index++]).domain1;
    /*request.get('http://' + config.phantom.host + ':' + config.phantom.port
     + '/find?url=' + domain, function(error, response, body) {
     if (error || response.statusCode != 200) {
     console.log('Error while requesting the phantom');
     }

     doFind();
     });*/
    var url = util.url(domain);
    var basePath = config.phantom.path;
    var path = basePath + 'sc_' + url.replace(/^https?:\/\//, '').replace(/[\/\\\:\*\?\"\'\<\>\|]+/g, '-').substr(0, 128) + '.png';


    phantom.create(function (err, ph) {
      return ph.createPage(function (err, page) {
        return page.open("http://tilomitra.com/repository/screenscrape/ajax.html", function (err, status) {
          console.log("opened site? ", status);
          page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function (err) {
            //jQuery Loaded.
            //Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
            setTimeout(function () {
              return page.evaluate(function () {
                //Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
                var h2Arr = [],
                    pArr = [];
                $('h2').each(function () {
                  h2Arr.push($(this).html());
                });
                $('p').each(function () {
                  pArr.push($(this).html());
                });

                return {
                  h2: h2Arr,
                  p: pArr
                };
              }, function (err, result) {
                console.log(result);
                ph.exit();
              });
            }, 5000);
          });
        });
      });
    });


    ///
    phantom.create(function (err, ph) {
      console.log(1, err);
      return ph.createPage(function (err, page) {
        console.log(2);
        return page.open(url, function (err, status) {
          console.log(3);
          if (status !== 'success') {
            console.log('Unable to access network');
          }
          if (page.injectJs('jquery-1.10.0.min.js')) {
            page.evaluate(function () {
                  // helpers
                  var distance = function (ax, ay, bx, by) {
                    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
                  };
                  var theBody = $('body');
                  theBody.prepend('<div id="mynetwarning" style="position: absolute;font-size: 50px;color: #d14836;font-weight: bold;background-color:#fff;padding: 20px;border: solid 1px #000;"></div>');
                  var warning = function (s) {
                    $('#mynetwarning').append('<div style="height: 56px;  border-bottom: solid 1px #000;  line-height: 1;">' + s + '</div>');
                  };
                  var highlight = function (elem, color) {
                    elem.css('border', 'solid 2px ' + color);
                  };
                  var addPoint = function (x, y, color) {
                    $('body').append($('<div style="width: 2px;height: 2px;position: absolute;border: solid 2px ' + color + ';background-color: ' + color + ';"></div>').css('top', y + 'px').css('left', x + 'px'));
                  };

                  /// verify whether this is a mynet webpage
                  var container = $('#spanMasterTemplateBackgroundBody');
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

                  /// find logo
                  var imgJQeryList = [];

                  $('img').each(function (index, elem) {
                    elem = $(elem);

                    // rule 1, width & height
                    if (elem.width() < 30 || elem.height() > 300 || elem.height() < 30) {
                      console.log('----------', elem.get(0));
                      return;
                    }

                    // rule 2, top, left position
                    if (elem.offset().left >= 800 || elem.offset().top >= 300) {
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

                  if (imgJQeryList.length > 0) {
                    // rule 3, sort distance from center to document leftTop
                    if (imgJQeryList.length > 1) {
                      imgJQeryList.sort(function (a, b) {
                        return a.data('distance') - b.data('distance');
                      });
                    }

                    // highlight the result
                    highlight(imgJQeryList[0], '#ffff00');
                  }

                  /// find menu
                  highlight($('.mynetMenuBox'), '#ff0000');
                  /// find block
                  var blocks = $('div').filter(function () {
                    var elem = $(this);
                    return (elem.css('z-index') > 0) && (elem.css('position') == 'absolute');
                  });
                  highlight(blocks, '#000');
                  console.log('####################### parse complete.');
                },
                function (err, result) {
                  console.log(result);
                  ph.exit();
                });

            //
            console.log('start render.');
            page.render(path);
            console.log('Capture url success: ' + url);
            page.release();

            // continue
            doFind();
          }
          else {
            console.log('Failed to inject jquery-1.10.0.min.js');
            page.release();

            // continue
            doFind();
          }
        });
      });
    });
  };
};

exports.captureAll = function (req, res, next) {
  var db = require("mongojs").connect(config.db.url, [config.db.collections]);

  var index = 0;
  var sites = null;

  db.sites.find(function (err, result) {
    if (err || !result) {
      return res.send(500, 'Failed when indexing db.');
    }

    sites = result;
    doCapture();
    return res.send(200, 'Running.'); // 不等待全部运行完毕，直接返回。
  });

  var doCapture = function () {
    if (index >= sites.length) {
      return;
    }

    var domain = (sites[index++]).domain1;
    request.get('http://' + config.phantom.host + ':' + config.phantom.port
        + '/capture?url=' + domain, function (error, response, body) {
      if (error || response.statusCode != 200) {
        console.log('Error while requesting the phantom');
      }

      doCapture();
    });
  };
};