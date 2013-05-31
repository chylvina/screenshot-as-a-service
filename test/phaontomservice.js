var server = require('webserver').create();
server.listen(5000, function (request, response) {
	console.log(request.url.split('?url=')[1]);
});
console.log('5000');