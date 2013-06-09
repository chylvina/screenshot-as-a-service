/**
 *
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-6-9 上午11:24
 * Description:
 */

var lactate = require('lactate');

module.exports.cache = function (dir, from, env) {
  var staticFiles = lactate.dir(dir, {from: from});

  staticFiles.disable('minify');
  staticFiles.disable('gzip');
  staticFiles.disable('cache');
  staticFiles.enable('watch files');
  staticFiles.enable('debug');

  return staticFiles.toMiddleware();
}