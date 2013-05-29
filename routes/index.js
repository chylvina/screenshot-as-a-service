var utils = require('../lib/utils');
var join = require('path').join;
var fs = require('fs');
var path = require('path');
var request = require('request');

module.exports = function(app) {
  var rasterizerService = app.settings.rasterizerService;
  var fileCleanerService = app.settings.fileCleanerService;

  ///------ by chylvina ------
  var db = require("mongojs").connect('mongodb://localhost/mynetrnd', ["sites"]);

  var sites;
  var index = 0;

  db.sites.find(function(err, result) {
    sites = result;
    getImage();
  });

  var getImage = function() {
    // loop
    var res = sites[index++];
    if(!res) {
      return;
    }

    // init
    var domain = res.domain1;
    var id = res._id;

    // start
    console.log('Starting:' + domain);
    var url = utils.url(domain);
    // required options
    var options = {
      uri: 'http://localhost:' + rasterizerService.getPort() + '/',
      headers: { url: url }
    };

    //var filename = 'screenshot_' + utils.md5(url + JSON.stringify(options)) + '.png';
    var filename = 'sc_' + domain + '_index' + '.png';
    options.headers.filename = filename;

    var filePath = join(rasterizerService.getPath(), filename);

    var callbackUrl = false;

    if (fs.existsSync(filePath)) {
      console.log('Request for %s - Found in cache', url);
      processImageUsingCache(filePath, res, callbackUrl, function(err) { if (err) next(err); });
      return;
    }
    console.log('Request for %s - Rasterizing it', url);
    processImageUsingRasterizer(options, filePath, res, callbackUrl, function(err) {
      if(err) {
        // log
        console.log('Error:' + domain);

        db.sites.update({domain1: domain}, {$set: {available: "0"}}, function(err, updated) {
          if( err || !updated ) {
            console.log(err);
          }
          else {
            console.log(updated);
          }

          // loop
          getImage();
          next(err);
        });
      }
      else {
        // log
        console.log('Success:' + domain);

        db.sites.update({domain1: domain}, {$set: {available: "1"}}, function(err, updated) {
          if( err || !updated ) {
            console.log(err);
          }
          else {
            console.log(updated);
          }

          // loop
          getImage();
        });
      }

    });
  }
  ///------ end ------

  // routes
  app.get('/', function(req, res, next) {
    if (!req.param('url', false)) {
      return res.redirect('/usage.html');
    }

    var url = utils.url(req.param('url'));
    // required options
    var options = {
      uri: 'http://localhost:' + rasterizerService.getPort() + '/',
      headers: { url: url }
    };
    ['width', 'height', 'clipRect', 'javascriptEnabled', 'loadImages', 'localToRemoteUrlAccessEnabled', 'userAgent', 'userName', 'password', 'delay'].forEach(function(name) {
      if (req.param(name, false)) options.headers[name] = req.param(name);
    });

    //var filename = 'screenshot_' + utils.md5(url + JSON.stringify(options)) + '.png';
    var filename = 'sc_' + req.param('url') + '_index' + '.png';
    options.headers.filename = filename;

    var filePath = join(rasterizerService.getPath(), filename);

    var callbackUrl = req.param('callback', false) ? utils.url(req.param('callback')) : false;

    if (fs.existsSync(filePath)) {
      console.log('Request for %s - Found in cache', url);
      processImageUsingCache(filePath, res, callbackUrl, function(err) { if (err) next(err); });
      return;
    }
    console.log('Request for %s - Rasterizing it', url);
    processImageUsingRasterizer(options, filePath, res, callbackUrl, function(err) { if(err) next(err); });
  });

  app.get('*', function(req, res, next) {
    // for backwards compatibility, try redirecting to the main route if the request looks like /www.google.com
    res.redirect('/?url=' + req.url.substring(1));
  });

  // bits of logic
  var processImageUsingCache = function(filePath, res, url, callback) {
    if (url) {
      // asynchronous
      res.send('Will post screenshot to ' + url + ' when processed');
      postImageToUrl(filePath, url, callback);
    } else {
      // synchronous
      //sendImageInResponse(filePath, res, callback);
    }
  }

  var processImageUsingRasterizer = function(rasterizerOptions, filePath, res, url, callback) {
    if (url) {
      // asynchronous
      res.send('Will post screenshot to ' + url + ' when processed');
      callRasterizer(rasterizerOptions, function(error) {
        if (error) return callback(error);
        postImageToUrl(filePath, url, callback);
      });
    } else {
      // synchronous
      callRasterizer(rasterizerOptions, function(error) {
        if (error) return callback(error);
        else {
          callback(null);
        }
        //sendImageInResponse(filePath, res, callback);
      });
    }
  }

  var callRasterizer = function(rasterizerOptions, callback) {
    request.get(rasterizerOptions, function(error, response, body) {
      if (error || response.statusCode != 200) {
        console.log('Error while requesting the rasterizer: %s', error.message);
        rasterizerService.restartService();
        return callback(new Error(body));
      }
      callback(null);
    });
  }

  var postImageToUrl = function(imagePath, url, callback) {
    console.log('Streaming image to %s', url);
    var fileStream = fs.createReadStream(imagePath);
    fileStream.on('end', function() {
      fileCleanerService.addFile(imagePath);
    });
    fileStream.on('error', function(err){
      console.log('Error while reading file: %s', err.message);
      callback(err);
    });
    fileStream.pipe(request.post(url, function(err) {
      if (err) console.log('Error while streaming screenshot: %s', err);
      callback(err);
    }));
  }

  var sendImageInResponse = function(imagePath, res, callback) {
    console.log('Sending image in response');
    res.sendfile(imagePath, function(err) {
      fileCleanerService.addFile(imagePath);
      callback(err);
    });
  }

};