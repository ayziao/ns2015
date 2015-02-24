//HTTPサーバ

var http = require('http');

var config = require('./config.json');
var port = config.port || 80;
var user = config.user || 'node';

http.createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
	response.end('ハロー');
}).listen(port, function () {
    console.log('ポート' + port + 'でHTTP接続待ち受け開始');
    if(port < 1025){
	    console.log('実行ユーザを' + user + 'に変更');
	    process.setuid(user);
    }
});
