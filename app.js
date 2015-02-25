//アプリケーション

//設定
var config    = require('./config.json');
var port      = config.port      || 80;
var user      = config.user      || 'node';
var staticDir = config.staticDir || './static/';

//定数的なの
var httpStatus = {
	200 : ' OK',
	403 : ' Forbidden',
	404 : ' NotFound',
}
var contentType = {
	html : 'text/html;charset=UTF-8' ,
	htm  : 'text/html;charset=UTF-8' ,
	js   : 'text/javascript;charset=UTF-8' ,
	css  : 'text/css;charset=UTF-8' ,
	gif  : 'image/gif' ,
	jpeg : 'image/jpeg' ,
	jpg  : 'image/jpeg' ,
	jpe  : 'image/jpeg' ,
	png  : 'image/png' ,
	ico  : 'image/vnd.microsoft.icon' ,
	txt  : 'text/plain;charset=UTF-8'
};

//モジュール
var fs   = require('fs');
var path = require('path');
var http = require('http');

//静的ファイル読み込み
function staticFileRead(filePath, hit, nothing){
	fs.readFile(filePath, function (err, buf) {
		if (err) { //ファイル無し
			console.log(err);
			nothing();
		} else { //ファイルあり
			//console.log(buf);
			hit(buf);
		}
	});
}

function accessLog(log){
	//TODO アパッチ形式でファイルに書き出したりできるように	
	console.log(log);
}

function errorLog(log){
	//TODO アパッチ形式でファイルに書き出したりできるように	
	console.log(log);
}

//静的ファイル返送
function staticResponse(requestUrl, response){
	var filePath = staticDir + 'default' + requestUrl;
	var extname  = path.extname(requestUrl).replace(".", '');
	var statusCode = 200;

	staticFileRead(filePath ,function (buf) { //ファイルあり
		response.writeHead(statusCode, {"Content-Type": contentType[extname]});
		response.end(buf);

	}, function () { //ファイルなし
		statusCode = 404;
		response.writeHead(statusCode, {'Content-Type': contentType['txt']});
		response.end(statusCode + ' ' + httpStatus[statusCode]);
	});

	return 'readFile:' + filePath;
}

//HTTPサーバ起動
http.createServer(function (request, response) {

	var statusCode = 200;
	var requestTime = new Date();
	var msg = '';

	if (request.method == 'GET') {
		if (request.url == '/') { //トップへのアクセス
			response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
			response.end('ハロー');

		} else { //トップ以外は静的ファイルを探す
			msg += ' ' + staticResponse(request.url, response);
		}

	} else { //非許可HTTPメソッドは403
		statusCode = 403;
		response.writeHead(statusCode, {'Content-Type': 'text/plain;charset=UTF-8'});
		response.end(statusCode + httpStatus[statusCode]);
	}
	accessLog(requestTime + ' ' + request.headers.host + request.url + ' ' + statusCode + httpStatus[statusCode] + ' ' + request.headers['user-agent'] + msg);

}).listen(port, function () {
    console.log('ポート' + port + 'でHTTP接続待ち受け開始');
    if(port < 1025 && user != 'root'){
	    process.setuid(user);
	    console.log('実行ユーザを' + user + 'に変更');
    }

});
