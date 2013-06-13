var utils = require('../../../lib/utils'),
    join = require('path').join,
    fs = require('fs'),
    path = require('path'),
    uuid = require('node-uuid'),
    UglifyJS = require("uglify-js"),
    adminController = require('./admin'),
    config = require('config'),
    phantomservice = require('../../phantomservice'),
    request = require('request');

module.exports = function (app) {
  app.get('/admin/findall', adminController.findall);
  app.get('/admin/find', adminController.find);
  app.get('/admin/parse', adminController.parse);
  app.get('/admin/transform', transform);
};

var transform = function(req, res, next) {
  var urlStr = req.query.url;
  if(!urlStr) {
    return res.send(400, 'url is required.');
  }
  console.log('urlStr:', urlStr);

  phantomservice.run(urlStr, 'inject.js', function(err, result) {
    if(err) {
      res.send(500, err);
    }

    var filename = utils.md5(urlStr);
    // 去掉 console.log 出来的 \n
    fs.writeFileSync("./tmp/" + filename, "var contentData = '" + utils.escape(result.trim()) + "';");

    //
    var minified = UglifyJS.minify([
      "./hbs/title.js",
      "./hbs/text.js",
      "./hbs/navbar.js",
      "./hbs/link.js",
      "./hbs/imagelist.js",
      "./hbs/image.js",
      "./hbs/header.js",
      "./hbs/footer-title.js",
      "./hbs/footer-text.js",
      "./hbs/footer-link.js",
      "./hbs/footer-image.js",
      "./tmp/" + filename,
      "./hbs/render.js"
    ]);

    fs.writeFileSync("./views/" + filename + ".js", minified.code);

    return res.render('frame', {
      src: filename + ".js"
    });
  });
};