/**
 * Admin Controller
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 下午4:57
 * Description:
 */

var screencapture = require('./screencapture'),
    config = require('config');

exports.capture = function (req, res, next) {
  console.log(req.query.url);

  screencapture.capture(req.query.url, function(err) {
    if(err) {
      return res.send(500, 'Failed');
    }

    res.send(200, 'Done');
  });
};

exports.captureAll = function (req, res, next) {
  var db = require("mongojs").connect(config.db.url, [config.db.collections]);

  var index = 0;
  var sites = null;

  db.sites.find(function(err, result) {
    if(err || !result) {
      return res.send(500, 'Failed');
    }

    sites = result;
    doCapture();
  });

  var doCapture = function() {
    if(index >= sites.length) {
      return res.send(200, 'Done');
    }

    screencapture.capture((sites[index++]).domain1, function(err) {
      if(err) {
        return res.send(500, 'Failed');
      }

      res.send(200, 'Done');
    });
  };
};