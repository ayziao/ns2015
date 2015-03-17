/**
 * ニアスケイプwebモジュール
 * 
 * HTTPに関わるところを処理する HTTPヘッダとかレスポンス処理とかHTTPのアクセスログとか
 * HTMLはコマンドラインでも使うのでns本体でやる
 *
 * node以外での利用は考慮しない
 */

//TODO 静的ファイルから取得するのか動的に生成するのかはns本体側でやる


/**
 * 設定
 */
//PENDING 動的な設定変更を設定ファルでやるか？DBの設定テーブルでやるか？
var config    = require('./config.json').ns;
var staticDir = config.staticDir || './static/';


/**
 * 定数的なの
 */
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


/**
 * モジュール
 */

//nodeコアモジュール
var fs   = require('fs');
var path = require('path');
var http = require('http');

//npm : Node Package Manager

//自作モジュール
var ns = require('./ns');


/**
 * ニアスケイプwebモジュール本体
 */
function nsweb(request, response) {

	var logs = {
		requestTime : new Date() ,
		host : request.headers.host ,
		url : request.url ,
		userAgent : request.headers['user-agent'] ,
		msg : '' ,
		statusCode : 200
	}

	//TODO コマンドテーブルチェック
	//TODO 静的ファイルチェック
	//TODO データテーブルチェック

	if (request.method == 'GET') {
		if (request.url == '/') { //トップへのアクセス
			//タイムライン //TODO トップへのアクセス時の機能はサイト管理ユーザが設定できるようにする
			ns.timeline('/','txt',function(err,content){
				response.writeHead(200, {'Content-Type': contentType['txt']});
				response.end(content);
				accessLog(logs);
			});
		} else { //トップ以外は静的ファイルを探す
			var filePath = staticDir + 'default' + request.url;
			logs.msg += ' readFile:' + filePath;
			fs.readFile(filePath, function (err, buf) {
				if (err) { //ファイル無し
					ns.content(request.url.slice(1),'txt',function(err,content){
						if (content != null){
							response.writeHead(200, {'Content-Type': contentType['txt']});
							response.end(content);
							accessLog(logs);
						} else {
							//静的ファイルもコンテントも無い場合404
							var statusCode = 404;
							logs.statusCode = statusCode;
							response.writeHead(statusCode, {'Content-Type': contentType['txt']});
							response.end(statusCode + ' ' + httpStatus[statusCode]);
							accessLog(logs);
						}
					});
				} else { //ファイルあり
					var extname  = path.extname(request.url).replace(".", '');
					response.writeHead(200, {"Content-Type": contentType[extname]});
					response.end(buf);
					accessLog(logs);
				}
			});
		}

	} else { //非許可HTTPメソッドは403
		var statusCode = 403;
		logs.statusCode = statusCode;
		response.writeHead(statusCode, {'Content-Type': 'text/plain;charset=UTF-8'});
		response.end(statusCode + httpStatus[statusCode]);
		accessLog(logs);
	}


//TODO あとで消す デバッグ用
	console.log(request.headers);
	console.log('httpVersion : %s',request.httpVersion);
	console.log('url : %s',request.url);
	console.log('method : %s',request.method);
	console.log('idleStart : %s',request.client._idleStart);
	console.log('monotonicStartTime : %s',request.client._monotonicStartTime);

	//console.log(request);
}


/**
 * モジュール内関数
 */
function accessLog(logs){
	//PENDING クラス化が必要では
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(logs.requestTime + ' ' + logs.host + ' ' + logs.url + ' ' + logs.statusCode + httpStatus[logs.statusCode] + ' ' + logs.userAgent + logs.msg);
}

function errorLog(log){
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
}


/**
 * エクスポート
 */
module.exports = nsweb;
