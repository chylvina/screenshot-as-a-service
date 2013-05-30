var healthCheck = require('./healthCheck');
var capture = require('./capture');

service = server.listen(port, function (request, response) {
  if (request.url == '/healthCheck') {
    healthCheck.check(request, response);
    return;
  }

  if(request.url == '/capture') {
    capture.do(request, response);
    return;
  }

});
