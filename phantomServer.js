/**
 * Module dependencies.
 */
var config = require('config');
var RasterizerService = require('./modules/phantomservice');

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

new RasterizerService(config.rasterizer).startService();