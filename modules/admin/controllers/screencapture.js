/**
 * Screen Capture
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 下午2:58
 * Description: Capture Screen via phantom service
 */

var config = require('config'),
    request = require('request'),
    utils = require('../../../lib/utils');

exports.capture = function(urlStr, callback) {
  if(!urlStr) {
    return callback('urlStr is required.');
  }

  // start
  console.log('Start load page: ' + urlStr);
  var url = utils.url(urlStr);
  // required options
  var options = {
    uri: 'http://' + config.rasterizer.host + ':' + config.rasterizer.port + '/',
    headers: { url: url }
  };

  options.headers.filename = 'sc_'
      + urlStr.replace(/[\/\\\:\*\?\"\'\<\>\|]+/g, '-').substr(0, 128)  // escape file name forbiden characters
      + '.png';

  console.log('Request for %s - Rasterizing it', url);

  request.get(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      console.log('Error while requesting the rasterizer: %s', error.message);
      rasterizerService.restartService();
      return callback(new Error(body));
    }

    // success
    callback(null);
  });
};