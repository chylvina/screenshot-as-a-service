/**
 * Module dependencies.
 */

var spawn = require('child_process').spawn;
var request = require('request');

/**
 * Rasterizer service.
 *
 * The service starts, kills or restarts rasterizer server
 *
 * The constructor expects a configuration object as parameter, with these properties:
 *   command: Command to start a phantomjs process
 *   port: Server listerner port
 *   path: Destination of temporary images
 *   viewport: Width and height represent the viewport size (format: '1024x800')
 *
 * @param {Object} Server configuration
 * @api public
 */
var PhantomService = function(config) {
  this.isStopping = false;
  this.config = config;
  this.rasterizer = null;
  this.pingDelay = 10000; // every 10 seconds
  this.sleepTime = 30000; // three failed health checks, 30 seconds
  this.lastHealthCheckDate = null;
  var self = this;
  process.on('exit', function() {
    self.isStopping = true;
    self.killService();
  });
}

PhantomService.prototype.startService = function() {
  var rasterizer = spawn(this.config.command, ['scripts/rasterizer.js', this.config.path, this.config.port, this.config.viewport]);
  var self = this;
  rasterizer.stderr.on('data', function (data) {
    console.log('phantomjs error: ' + data);
  });
  rasterizer.stdout.on('data', function (data) {
    console.log('phantomjs output: ' + data);
  });
  rasterizer.on('exit', function (code) {
    if (self.isStopping) return;
    console.log('phantomjs failed; restarting');
    self.startService();
  });
  this.rasterizer = rasterizer;
  this.lastHealthCheckDate = Date.now();
  this.pingServiceIntervalId = setInterval(this.pingService.bind(this), this.pingDelay);
  this.checkHealthIntervalId = setInterval(this.checkHealth.bind(this), 1000);
  console.log('Phantomjs internal server listening on port ' + this.config.port);
  return this;
}

PhantomService.prototype.killService = function() {
  if (this.rasterizer) {
    this.rasterizer.kill();
    clearInterval(this.pingServiceIntervalId);
    clearInterval(this.checkHealthIntervalId);
    console.log('Stopping Phantomjs internal server');
  }
}

PhantomService.prototype.restartService = function() {
  if (this.rasterizer) {
    this.killService();
    this.startService();
  }
}

PhantomService.prototype.pingService = function() {
  if (!this.rasterizer) {
    this.lastHealthCheckDate = 0;
  }
  var self = this;
  request('http://localhost:' + this.getPort() + '/healthCheck', function(error, response) {
    if (error || response.statusCode != 200) return;
    self.lastHealthCheckDate = Date.now();
  });
}

PhantomService.prototype.checkHealth = function() {
  if (Date.now() - this.lastHealthCheckDate > this.sleepTime) {
    console.log('Phantomjs process is sleeping. Restarting.');
    this.restartService();
  }
}

PhantomService.prototype.getPort = function() {
  return this.config.port;
}

PhantomService.prototype.getPath = function() {
  return this.config.path;
}

module.exports = PhantomService;