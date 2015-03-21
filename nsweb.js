/**
 * ニアスケイプwebモジュール
 * 
 * HTTPに関わるところを処理する HTTPヘッダとかレスポンス処理とかHTTPのアクセスログとか
 * HTMLはコマンドラインでも使うのでns本体でやる
 *
 * node以外での利用は考慮しない
 */

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
var path = require('path');
var http = require('http');

//npm : Node Package Manager

//自作モジュール
var ns = require('./ns');

function returnResponse(response,statusCode,content,type,logs){
	response.writeHead(statusCode, {'Content-Type': contentType[type]});
	response.end(content);
	accessLog(logs);
}

/**
 * ニアスケイプwebモジュール本体
 */
function nsweb(request, response) {

	var logs = {
		requestTime : new Date() ,
		host        : request.headers.host ,
		url         : request.url ,
		userAgent   : request.headers['user-agent'] ,
		msg         : '' ,
		statusCode  : 200
	}

	if (request.method == 'GET') {
		if (request.url == '/') { //トップへのアクセス
			//タイムライン //TODO トップへのアクセス時の機能はサイト管理ユーザが設定できるようにする
			ns.timeline('/','html',function(err,content){
				returnResponse(response,200,content,'html',logs);
			});
		} else { //トップ以外
			//FIXME 拡張子関連
			ns.content(request.url,'txt',function(err,content,filePath){
				if (content != null){
					var extname = path.extname(request.url).replace(".", '');
					if(extname == ''){
						extname = 'txt';
					}
					if (filePath) {
						logs.msg += ' readFile:' + filePath;
					}
					returnResponse(response,200,content,extname,logs);
				} else {
					//コンテントがない場合404
					logs.statusCode = 404;
					returnResponse(response,404,'404 ' + httpStatus[404],'txt',logs);
				}
			});
		}

	} else { //非許可HTTPメソッドは403
		logs.statusCode = 403;
		returnResponse(response,403,'403 ' + httpStatus[403],'txt',logs);
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
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(logs.requestTime + ' ' + logs.host + ' ' + logs.url + ' ' + logs.statusCode + httpStatus[logs.statusCode] + ' ' + logs.userAgent + logs.msg);
}

function errorLog(log){
	//TODO オブジェクト受け取るようにする
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
}


/**
 * エクスポート
 */
module.exports = nsweb;
