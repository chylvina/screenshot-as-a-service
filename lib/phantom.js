/**
 *
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-31 下午4:51
 * Description:
 */

PhantomService.prototype.startService = function() {
  var phantom = spawn(this.config.command, [__dirname + '/run.js', this.config.path, this.config.port, this.config.viewport]);
  var self = this;
  phantom.stderr.on('data', function (data) {
    console.log('phantomjs error: ' + data);
  });
  phantom.stdout.on('data', function (data) {
    console.log('phantomjs output: ' + data);
  });
  phantom.on('exit', function (code) {
    if (self.isStopping) return;
    console.log('phantomjs failed; restarting');
    self.startService();
  });
  this.phantom = phantom;
  this.lastHealthCheckDate = Date.now();
  this.pingServiceIntervalId = setInterval(this.pingService.bind(this), this.pingDelay);
  this.checkHealthIntervalId = setInterval(this.checkHealth.bind(this), 1000);
  console.log('Phantomjs internal server listening on port ' + this.config.port);
  return this;
};