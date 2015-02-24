var http       = require('http');

var port = 8080;
var hostname = '127.0.0.1';

http.createServer(function (request, response) {
	response.writeHead(200, {
		'Content-Type': 'text/plain;charset=UTF-8' ,
	});
	response.end('ハロー');

}).listen(port, hostname, function () {
    console.log('listen');
});
