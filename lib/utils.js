var _ = require('underscore')
    , xss = require('xss')
    , crypto = require('crypto');

/**
 * Imply "http://" for `url`.
 */

exports.url = function(url){
  if (~url.indexOf('://')) return url;
  return 'http://' + url;
};

exports.mergeObject = function (a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

exports.format_date = function (date, friendly) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();

  if (friendly) {
    var now = new Date();
    var mseconds = -(date.getTime() - now.getTime());
    var time_std = [ 1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000 ];
    if (mseconds < time_std[3]) {
      if (mseconds > 0 && mseconds < time_std[1]) {
        return Math.floor(mseconds / time_std[0]).toString() + ' 秒前';
      }
      if (mseconds > time_std[1] && mseconds < time_std[2]) {
        return Math.floor(mseconds / time_std[1]).toString() + ' 分钟前';
      }
      if (mseconds > time_std[2]) {
        return Math.floor(mseconds / time_std[2]).toString() + ' 小时前';
      }
    }
  }

  //month = ((month < 10) ? '0' : '') + month;
  //day = ((day < 10) ? '0' : '') + day;
  hour = ((hour < 10) ? '0' : '') + hour;
  minute = ((minute < 10) ? '0' : '') + minute;
  second = ((second < 10) ? '0' : '') + second;

  thisYear = new Date().getFullYear();
  year = (thisYear === year) ? '' : (year + '-');
  return year + month + '-' + day + ' ' + hour + ':' + minute;
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function (html) {
  var codeSpan = /(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm;
  var codeBlock = /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g;
  var spans = [];
  var blocks = [];
  var text = String(html).replace(/\r\n/g, '\n')
      .replace('/\r/g', '\n');

  text = '\n\n' + text + '\n\n';

  text = text.replace(codeSpan, function (code) {
    spans.push(code);
    return '`span`';
  });

  text += '~0';

  return text.replace(codeBlock, function (whole, code, nextChar) {
    blocks.push(code);
    return '\n\tblock' + nextChar;
  })
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/`span`/g, function () {
        return spans.shift();
      })
      .replace(/\n\tblock/g, function () {
        return blocks.shift();
      })
      .replace(/~0$/, '')
      .replace(/^\n\n/, '')
      .replace(/\n\n$/, '');
};

/**
 * 过滤XSS攻击代码
 *
 * @param {string} html
 * @return {string}
 */
exports.xss = function (html) {
  return xss(html);
};

exports.encrypt = function (str, secret) {
  var cipher = crypto.createCipher('aes192', secret);
  var enc = cipher.update(str, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
}
exports.decrypt = function (str, secret) {
  var decipher = crypto.createDecipher('aes192', secret);
  var dec = decipher.update(str, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}
exports.md5 = function (str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}
exports.sha1 = function (str) {
  var sha1sum = crypto.createHash('sha1');
  sha1sum.update(str);
  str = sha1sum.digest('hex');
  return str;
}
exports.randomString = function (size) {
  size = size || 6;
  var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var max_num = code_string.length + 1;
  var new_pass = '';
  while (size > 0) {
    new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
    size--;
  }
  return new_pass;
}

// return a 8 characters long unique string
exports.uid = function() {
  var now = new Date();
  return Math.floor(Math.random() * 10) + parseInt(now.getTime()).toString(36).toLowerCase();
};

// https://gist.github.com/dperini/729294
exports.isDomain = function (str) {
  var re_weburl = new RegExp(
      "^" +
          "(?:" +
        // IP address exclusion
        // private & local networks
          "(?!10(?:\\.\\d{1,3}){3})" +
          "(?!127(?:\\.\\d{1,3}){3})" +
          "(?!169\\.254(?:\\.\\d{1,3}){2})" +
          "(?!192\\.168(?:\\.\\d{1,3}){2})" +
          "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broacast addresses
        // (first & last IP address of each class)
          "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
          "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
          "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
          "|" +
        // host name
          "(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" +
        // domain name
          "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" +
        // TLD identifier
          "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
          ")" +
          "$", "i"
  );
  return str.length < 2083 && str.match(re_weburl);
}
