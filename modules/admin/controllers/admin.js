/**
 * Admin Controller
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 下午4:57
 * Description:
 */

var request = require('request'),
    config = require('config');

exports.findall = function (req, res, next) {
  var db = require("mongojs").connect(config.db.url, [config.db.collections]);

  var index = 0;
  var sites = null;

  db.sites.find(function(err, result) {
    if(err || !result) {
      return res.send(500, 'Failed when indexing db.');
    }

    sites = result;
    doFind();
    return res.send(200, 'Running.'); // 不等待全部运行完毕，直接返回。
  });

  var doFind = function() {
    if(index >=sites.length) {
      return;
    }

    var domain = (sites[index++]).domain1;
    request.get('http://' + config.phantom.host + ':' + config.phantom.port
        + '/find?url=' + domain, function(error, response, body) {
      if (error || response.statusCode != 200) {
        console.log('Error while requesting the phantom');
      }

      doFind();
    });
  };
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
    request.get('http://' + config.phantom.host + ':' + config.phantom.port
        + '/capture?url=' + domain, function(error, response, body) {
      if (error || response.statusCode != 200) {
        console.log('Error while requesting the phantom');
      }

      doCapture();
    });
  };
};