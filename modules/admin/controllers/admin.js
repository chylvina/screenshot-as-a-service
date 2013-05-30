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

exports.findlogo = function (req, res, next) {

};

exports.captureAll = function (req, res, next) {
  var db = require("mongojs").connect(config.db.url, [config.db.collections]);

  var index = 0;
  var sites = null;

  db.sites.find(function(err, result) {
    if(err || !result) {
      return res.send(500, 'Failed when indexing db.');
    }

    sites = result;
    doCapture();
    return res.send(200, 'Running.'); // 不等待全部运行完毕，直接返回。
  });

  var doCapture = function() {
    if(index >=sites.length) {
      return;
    }

    var domain = (sites[index++]).domain1;
    screencapture.capture(domain, function(err) {
      if(err) {
        // update db if capture failed
        db.sites.update({domain1: domain}, {$set: {available: "0"}}, function(err, updated) {
          if( err || !updated ) {
            console.log('Update database failed.');
          }

          // continue
          doCapture();
        });
        return;
      }

      // update db if capture suceceed
      db.sites.update({domain1: domain}, {$set: {available: "1"}}, function(err, updated) {
        if( err || !updated ) {
          console.log('Update database failed.');
        }

        // continue
        doCapture();
      });
    });
  };
};