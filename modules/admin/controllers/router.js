var utils = require('../../../lib/utils'),
    join = require('path').join,
    fs = require('fs'),
    path = require('path'),
    adminController = require('./admin'),
    request = require('request');

module.exports = function (app) {
  app.get('/admin/capture', adminController.capture);    // /admin/capture?url=xxxxxxxx
  app.get('/admin/captureall', adminController.captureAll);
  app.get('/admin/findlogo', adminController.findlogo);
};