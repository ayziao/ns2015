//ニアスケイプwebモジュール
//node以外での利用は考慮しない

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

function accessLog(log){
	//PENDING クラス化が必要では
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
}

function errorLog(log){
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
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
			ns.getContent('/','txt',function(err,content){
				response.writeHead(200, {'Content-Type': contentType['txt']});
				response.end(content);
				accessLog(requestTime + ' ' + request.headers.host + ' ' + request.url + ' ' + statusCode + httpStatus[statusCode] + ' ' + request.headers['user-agent'] + msg);
			});
		} else { //トップ以外は静的ファイルを探す
			var filePath = staticDir + 'default' + request.url;
			msg += ' readFile:' + filePath;
			fs.readFile(filePath, function (err, buf) {
				if (err) { //ファイル無し
					//TODO コンテント取得

					//静的ファイルもコンテントも無い場合404
					statusCode = 404;
					response.writeHead(statusCode, {'Content-Type': contentType['txt']});
					response.end(statusCode + ' ' + httpStatus[statusCode]);
					accessLog(requestTime + ' ' + request.headers.host + ' ' + request.url + ' ' + statusCode + httpStatus[statusCode] + ' ' + request.headers['user-agent'] + msg);
				} else { //ファイルあり
					var extname  = path.extname(request.url).replace(".", '');
					response.writeHead(statusCode, {"Content-Type": contentType[extname]});
					response.end(buf);
					accessLog(requestTime + ' ' + request.headers.host + ' ' + request.url + ' ' + statusCode + httpStatus[statusCode] + ' ' + request.headers['user-agent'] + msg);
				}
			});
		}

	} else { //非許可HTTPメソッドは403
		statusCode = 403;
		response.writeHead(statusCode, {'Content-Type': 'text/plain;charset=UTF-8'});
		response.end(statusCode + httpStatus[statusCode]);
		accessLog(requestTime + ' ' + request.headers.host + request.url + ' ' + statusCode + httpStatus[statusCode] + ' ' + request.headers['user-agent'] + msg);
	}
}
