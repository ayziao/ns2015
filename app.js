//HTTPサーバ

var http = require('http');

var config = require('./config.json');
var port = config.port || 80;

http.createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
	response.end('ハロー');
}).listen(port, function () {
    console.log('ポート' + port + 'でHTTP接続待ち受け開始');
});
