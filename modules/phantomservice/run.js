var healthCheck = require('./healthCheck');
var capture = require('./capture');
var findlogo = require('./findLogo');

var server = require('webserver').create();
server.listen(port, function (request, response) {
  if (request.url == '/healthCheck') {
    healthCheck.check(request, response);
    return;
  }

  if(request.url == '/capture') {
    capture.do(request, response);
    return;
  }

  if(request.url == '/logo') {
    findlogo.do(request, response);
    return;
  }

});
