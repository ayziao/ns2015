//HTTPサーバ

var http = require('http');

var config = require('./config.json');
var port = config.port || 80;
var user = config.user || 'node';

var httpStatus = {
	200 : 'OK',
	403 : 'Forbidden',
	404 : 'NotFound',
}

http.createServer(function (request, response) {

	statusCode = 200;
	requestTime = new Date();

	if (request.method == 'GET') {
		if (request.url == '/') {
			response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
			response.end('ハロー');
		} else {
			statusCode = 404;
			response.writeHead(statusCode, {'Content-Type': 'text/plain;charset=UTF-8'});
			response.end(statusCode + ' ' + httpStatus[statusCode]);
		}
	} else {
		statusCode = 403;
		response.writeHead(statusCode, {'Content-Type': 'text/plain;charset=UTF-8'});
		response.end(statusCode + ' ' + httpStatus[statusCode]);
	}
	console.log(requestTime + ' ' + request.url + ' ' + statusCode + ' ' + httpStatus[statusCode]);

}).listen(port, function () {
    console.log('ポート' + port + 'でHTTP接続待ち受け開始');
    if(port < 1025){
	    console.log('実行ユーザを' + user + 'に変更');
	    process.setuid(user);
    }
});


