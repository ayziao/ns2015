//HTTPサーバ

var http       = require('http');

var port = 8080;

http.createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
	response.end('ハロー');
}).listen(port, function () {
    console.log('ポート' + port + 'でHTTP接続待ち受け開始');
});
