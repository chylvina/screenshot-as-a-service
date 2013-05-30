/**
 * Admin Server
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-29 14:26
 * Description:
 */

var config = require('config'),
    express = require('express'),
    app = express();

/// ------ all environments
app.use(express.bodyParser());

/// ------ development only
if ('development' == app.get('env')) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/// ------ production or staging
if ('development' != app.get('env')) {
  process.on('uncaughtException', function (err) {
    console.error("[uncaughtException]", err);
    process.exit(1);
  });

  process.on('SIGTERM', function () {
    process.exit(0);
  });

  process.on('SIGINT', function () {
    process.exit(0);
  });
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