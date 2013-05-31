var utils = require('../../../lib/utils'),
    join = require('path').join,
    fs = require('fs'),
    path = require('path'),
    adminController = require('./admin'),
    request = require('request');

module.exports = function (app) {
  app.get('/admin/captureall', adminController.captureAll);
  app.get('/admin/findall', adminController.findall);
};