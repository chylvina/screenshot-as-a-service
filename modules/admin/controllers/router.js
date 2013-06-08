var utils = require('../../../lib/utils'),
    join = require('path').join,
    fs = require('fs'),
    path = require('path'),
    adminController = require('./admin'),
    request = require('request');

module.exports = function (app) {
  app.get('/admin/findall', adminController.findall);
  app.get('/admin/find', adminController.find);
  app.get('/admin/parse', adminController.parse);
};