//ニアスケイプwebモジュール

//設定
//PENDING 動的な設定変更を設定ファルでやるか？DBの設定テーブルでやるか？
var config    = require('./config.json').ns;
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
	txt  : 'text/plain;charset=UTF-8' ,
};

//nodeコアモジュール
var fs   = require('fs');
var path = require('path');
var http = require('http');

//npm : Node Package Manager

//自作モジュール
var ns = require('./ns');

//静的ファイル読み込み
function staticFileRead(filePath, hit, nothing){
	fs.readFile(filePath, function (err, buf) {
		if (err) { //ファイル無し
			errorLog(err);
			nothing();
		} else { //ファイルあり
			hit(buf);
		}
	});
}

function accessLog(log){
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
}

function errorLog(log){
	//TODO apache形式でファイルに書き出したりできるように	
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
		statusCode = 404; //TODO アクセスログへ渡るようにどうにか
		response.writeHead(statusCode, {'Content-Type': contentType['txt']});
		response.end(statusCode + ' ' + httpStatus[statusCode]);
	});

	return 'readFile:' + filePath;
}

module.exports = function (request, response) {

	var statusCode = 200;
	var requestTime = new Date();
	var msg = '';

	//TODO コマンドテーブルチェック
	//TODO 静的ファイルチェック
	//TODO データテーブルチェック

	if (request.method == 'GET') {
		if (request.url == '/') { //トップへのアクセス
			response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
			response.end('ハロー');

			//TODO ダッシュボード

		} else { //トップ以外は静的ファイルを探す
			msg += ' ' + staticResponse(request.url, response);
		}

	} else { //非許可HTTPメソッドは403
		statusCode = 403;
		response.writeHead(statusCode, {'Content-Type': 'text/plain;charset=UTF-8'});
		response.end(statusCode + httpStatus[statusCode]);
	}
	accessLog(requestTime + ' ' + request.headers.host + request.url + ' ' + statusCode + httpStatus[statusCode] + ' ' + request.headers['user-agent'] + msg);
}
