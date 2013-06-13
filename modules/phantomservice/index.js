/**
 *
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-6-13 下午3:09
 * Description:
 */

var spawn = require('child_process').spawn,
    utils = require('../../lib/utils'),
    config = require('config');


exports.run = function(urlStr, cmd, callback) {
  var phantom = spawn(config.phantom.command,
      [__dirname + '/run.js',
        urlStr,
        cmd,
        config.phantom.viewport,
        config.phantom.path]);
  phantom.stderr.on('data', function (data) {
    console.log('phantomjs error: ' + data);
    callback(data);
  });
  phantom.stdout.on('data', function (data) {
    data = String(data);
    if(data.indexOf('result:') == 0) {
      //console.log('result:', JSON.parse(data.substr(7)));

      //
      callback(null, data.substr(7));
    }
    else {
      console.log('phantomjs output: ' + data);
    }
  });
  phantom.on('exit', function (code) {
    console.log('phantomjs exit');
  });
};