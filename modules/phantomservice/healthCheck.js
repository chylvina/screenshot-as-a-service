/**
 *
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-30 上午10:19
 * Description:
 */

exports.check = function (request, response) {
  response.statusCode = 200;
  response.write('up');
  response.close();
}