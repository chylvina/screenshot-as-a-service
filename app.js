/**
 * Module dependencies.
 */
var config = require('config');
var express = require('express');
var RasterizerService = require('./modules/phantomservice');
var app = express();

/// ------ all environments
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

app.use(express.static(__dirname + '/public'));
app.use(app.router);
app.set('rasterizerService', new RasterizerService(config.phantom).startService());

/// ------ development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/// ------ production or staging
if ('development' != app.get('env')) {

}

/// ------ route
require('./routes')(app);

app.listen(config.server.port);
console.log('Phantomservice listening on port ' + config.server.port);