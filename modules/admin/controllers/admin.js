/**
 * Admin Controller
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 下午4:57
 * Description:
 */

var request = require('request'),
    config = require('config');

var spawn = require('child_process').spawn;

exports.parse = function(req, res, next) {
  var urlStr = req.query.url;
  if(!urlStr) {
    return res.send(400, 'url is required.');
  }
  console.log('urlStr:', urlStr);

  var phantom = spawn(config.phantom.command, [__dirname + '/run-parse.js', urlStr, config.phantom.path, config.phantom.viewport]);
  phantom.stderr.on('data', function (data) {
    console.log('phantomjs error: ' + data);
  });
  phantom.stdout.on('data', function (data) {
    data = String(data);
    if(data.indexOf('result:') == 0) {
      //console.log('result:', JSON.parse(data.substr(7)));
      return res.render('index', {
        contentData: data.substr(7)//.replace(/\r/g, '').replace(/\n/g, '')
      });
    }
    else {
      console.log('phantomjs output: ' + data);
    }
  });
  phantom.on('exit', function (code) {
    console.log('phantomjs exit');
    //res.send(200, 'Done');
  });
};

exports.find = function(req, res, next) {
  var urlStr = req.query.url;
  if(!urlStr) {
    return res.send(400, 'url is required.');
  }
  console.log('urlStr:', urlStr);

  var phantom = spawn(config.phantom.command, [__dirname + '/run-find.js', urlStr, config.phantom.path, config.phantom.viewport]);
  phantom.stderr.on('data', function (data) {
    console.log('phantomjs error: ' + data);
  });
  phantom.stdout.on('data', function (data) {
    console.log('phantomjs output: ' + data);
  });
  phantom.on('exit', function (code) {
    console.log('phantomjs exit');
    res.send(200, 'Done');
  });
};

exports.findall = function (req, res, next) {
  var db = require("mongojs").connect(config.db.url, [config.db.collections]);

  var index = 0;
  var concurrent = 0;
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

    while(concurrent < config.phantom.concurrent) {
      concurrent++;
      var domain = (sites[index++]).domain1;
      var phantom = spawn(config.phantom.command, [__dirname + '/run-find.js', domain, config.phantom.path, config.phantom.viewport]);
      phantom.stderr.on('data', function (data) {
        console.log('phantomjs error: ' + data);
      });
      phantom.stdout.on('data', function (data) {
        console.log('phantomjs output: ' + data);
      });
      phantom.on('exit', function (code) {
        console.log('phantomjs exit');
        concurrent--;
        doFind();
      });
    }
  };
};