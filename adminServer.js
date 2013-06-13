/**
 * Admin Server
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 14:26
 * Description:
 */

var UglifyJS = require("uglify-js"),
    fs = require('fs');

var res = UglifyJS.minify([ "./modules/admin/controllers/inject-src/jquery-1.10.0.min.js",
                  "./modules/admin/controllers/inject-src/parse.js" ]);

fs.writeFile("./modules/admin/controllers/inject.js", res.code, function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("inject.js updated!");
  }
});

var config = require('config'),
    express = require('express'),
    hbs = require('./lib/hbsExt'),
    cacher = require('./lib/cacher'),
    app = express();

/// ------ all environments
app.set('view engine', 'hbs');                  // hbs view engine
app.set('views', __dirname + '/views');     // set views for error and 404 pages
app.use(cacher.cache(__dirname + '/views', '/views', app.get('env')));
app.use(express.bodyParser());
console.log(app.get('env'));


/// ------ development, staging, etc
if ('production' != app.get('env')) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/// ------ production
if ('production' == app.get('env')) {
  /*process.on('uncaughtException', function (err) {
    console.error("[uncaughtException]", err);
    process.exit(1);
  });

  process.on('SIGTERM', function () {
    process.exit(0);
  });

  process.on('SIGINT', function () {
    process.exit(0);
  });*/
}

/// ------ route
require('./modules/admin/controllers/router')(app);

/// ------ error handler
app.use(function (err, req, res, next) {  // log
  console.error(err.stack);
  next(err);
});
app.use(function (err, req, res, next) {  // client

});
app.use(function (err, req, res, next) {  // error handler

});

app.listen(config.adminServer.port);
console.log('Phantomservice listening on port ' + config.adminServer.port);