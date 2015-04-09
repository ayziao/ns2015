/* global require, module, UNKNOWN */

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
var config     = require('../config/config.json').ns;
var staticDir  = config.staticDir || './static/';
var domainName = require('../config/config.json').http.domainName;

/**
 * 定数的なの
 */
var URL_BASE = '/';

var httpStatus = {
	200: ' OK',
	303: ' See Other', //他を参照せよ
	304: ' Not Modified', //未更新
	403: ' Forbidden', //禁止
	404: ' NotFound', //未検出
	405: ' Method Not Allowed', //許可されていないメソッド
	500: ' Internal Server Error', //サーバ内部エラー
	503: ' Service Unavailable'    //サービス利用不可
};
var contentType = {
	html: 'text/html;charset=UTF-8',
	htm : 'text/html;charset=UTF-8',
	xml : 'application/xml;charset=UTF-8',
	json: 'application/json; charset=utf-8',
	js  : 'text/javascript;charset=UTF-8',
	css : 'text/css;charset=UTF-8',
	gif : 'image/gif',
	jpeg: 'image/jpeg',
	jpg : 'image/jpeg',
	jpe : 'image/jpeg',
	png : 'image/png',
	ico : 'image/vnd.microsoft.icon',
	txt : 'text/plain;charset=UTF-8',
	csv : 'text/csv;charset=UTF-8',
	tsv : 'text/tab-separated-values;charset=UTF-8'
};

var formHtml = (function () {/*
		<form action="./" method="POST" enctype="multipart/form-data">
			<textarea id="box" style="width:100%;" rows="4" name="body" onKeyup="mojilenbody(value);"></textarea>
			tag<input type="text" name="tags" onKeyup="mojilentag(value);">
			<input id="btn" type="submit" name="submit" value="post" style="width: 100px;height: 60px;font-size: 2em;">
			<input type="file" name="file" accept="image/*">
			<input type="hidden" name="user" value="__user__">
			<span id="strcount">文字数</span><br>

			<script type="text/javascript">
				var key = "none";
				var sbmit = false;
				var textbox = document.getElementById('box');
				var submitButton = document.getElementById('btn');
				var bodylen = 0;
				var taglen = 0;

				textbox.addEventListener('keydown',
						function (e) {
							key = e.which;
							if (sbmit == false && e.metaKey && e.which == 13) {
								submitButton.click();
								sbmit = true;
							}
						},
						false
						)

				function showmojilen() {
					var strlen = bodylen + taglen;
					document.getElementById('strcount').innerHTML = "<span style='font-weight: bold;color:blue ;'>" + strlen + "</span>文字 " + key;
				}

				function mojilenbody(str) {
					bodylen = str.length;
					showmojilen();
				}

				function mojilentag(str) {
					taglen = str.length;
					showmojilen();
				}
			</script>

		</form>	
 */}).toString().match(/\n([\s\S]*)\n/)[0];
//console.log(formHtml);


/**
 * モジュール
 */

//nodeコアモジュール
var path = require('path');
var http = require('http');
var zlib = require('zlib');

//Node Package Manager
var formidable = require('formidable');

//自作モジュール
var ns = require('../lib/ns');


/**
 * モジュールローカル関数
 */

/**
 * リクエストヘッダからユーザ取得
 * 
 * @param {type} request
 * @returns {requestFromUser.arrayOfStrings|String}
 */
function requestFromUser(request) {

	//FIXME ポート番号指定じゃないと動かん
	var host = request.headers.host;
	var arrayOfStrings = host.split('.' + domainName);

	if (arrayOfStrings.length === 2) {
		return arrayOfStrings[0];
	} else {
		var atsplit = request.url.split('@');
		if (atsplit.length === 2) {
			return atsplit[1].split('/')[0];
		} else {
			return '';
		}
	}
}

//GETリクエスト
function httpGet(request, response, logs) {
	var user = requestFromUser(request);
	var requestUrl = request.url.replace("/@" + user, "");

	//FIXME DEBUG用かな とりあえずテストユーザ入れてる
	if (user === "") {
		user = 'test';
	}

	//TODO 変更がなければ304
	//TODO 静的ファイルの場合は日時とサイズ 動的ページの場合は全文のハッシュをetagにする

	if (requestUrl === '/') { //トップへのアクセス
		//タイムライン 
		ns.timeline(user, '/', 'html', function (err, content) {
			//TODO トップへのアクセス時の機能はサイト管理ユーザが設定できるようにする
			//PENDING 権限を持ったユーザがアクセスした時にHTMLには機能を付与して表示する その方法を考える

			//FIXME 投稿フォーム埋め込み
			var reshtml = content.split("__form__").join(formHtml).split("__urlbase__").join(URL_BASE);
			returnResponse(response, 200, reshtml, {type: 'html'}, logs);
		});
	} else { //トップ以外

		//FIXME 拡張子関連
		var extname = path.extname(requestUrl).replace(".", '');
		if (extname === '') {
			extname = 'txt';
		}
		//PENDING etagが静的ファイルのやつっぼかったらファイル実体は取得せずファイル情報だけ取得して比較してからファイル実体取得？		
		ns.content(user, requestUrl, extname, function (err, content, contentStatus) {
			if (err){ //エラー
				returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				return;
			}
			if (!content) { //コンテントがない場合404
				returnResponse(response, 404, '404' + httpStatus[404], {type: 'txt'}, logs);
				return;
			}

			//静的ファイルの場合ファイルパスをログに保存 デバッグ用？
			if (contentStatus && contentStatus.filePath) {
				logs.msg += ' readFile:' + contentStatus.filePath;
			}
			if (request.headers['if-none-match']) { //クライアントがキャッシュを持っている
				contentStatus['etag'] = contentStatus.fileStat.mtime + contentStatus.fileStat.size;
				if (request.headers['if-none-match'] === contentStatus.etag) {
					returnResponse(response, 304, content, contentStatus, logs);
					return;
				}
			}
			returnResponse(response, 200, content, contentStatus, logs);
		});
	}
}

//POSTリクエスト
function httpPost(request, response, logs) {
	var user = requestFromUser(request);
	var form = new formidable.IncomingForm();

	//TODO 権限チェック
	if (user === "") {
		returnResponse(response, 405, '405' + httpStatus[403], {type: 'txt'}, logs);
		return;
	}
	var redirectUrl = '';
	if (request.url.indexOf('/@' + user + '/') === 0) {
		redirectUrl = '@' + user + '/';
	}

	form.parse(request, function (err, fields, files) {
		console.log(files);
		if (typeof fields.body !== "undefined" && fields.body.trim() !== "") {
			var body = fields.body.replace(/\r\n?/g, "\n").trim();
			var tags = fields.tags.trim().replace(/\s/, " ").replace(/\s{2,}/, " ").split(" ").filter(Boolean);
			ns.post(body, tags, files, user, function (err) {
				if (err) {
					returnResponse(response, 500, 'err', {type: 'txt'}, logs);
					errorLog({msg: '投稿失敗', err: err});
				} else {
//					returnResponse(response,200,'posted',{type:'txt'},logs);
					redirect(response, 303, redirectUrl, logs);
				}
			});
		} else { //本文無しは転送
			redirect(response, 303, redirectUrl, logs);
		}
	});
}

//返送
function returnResponse(response, statusCode, content, contentStatus, logs) {

	var headers = {'Content-Type': contentType[contentStatus.type]};
	
	

	if (typeof contentStatus.fileStat !== "undefined") {
		contentStatus['etag'] = contentStatus.fileStat.mtime + contentStatus.fileStat.size;
		//TOOD Objectぐるぐるしてつけるの作る
		headers['ETag'] = contentStatus.etag;
		
		//PENDING デバッグ用 デバッグモードの時だけ出力？
		headers['debug-type'] = contentStatus.type;
		headers['debug-filePath'] = contentStatus.filePath;
		headers['debug-fileStat-dev'] = contentStatus.fileStat.dev;
		headers['debug-fileStat-mode'] = contentStatus.fileStat.mode;
		headers['debug-fileStat-nlink'] = contentStatus.fileStat.nlink;
		headers['debug-fileStat-uid'] = contentStatus.fileStat.uid;
		headers['debug-fileStat-gid'] = contentStatus.fileStat.gid;
		headers['debug-fileStat-rdev'] = contentStatus.fileStat.rdev;
		headers['debug-fileStat-blksize'] = contentStatus.fileStat.blksize;
		headers['debug-fileStat-ino'] = contentStatus.fileStat.ino;
		headers['debug-fileStat-size'] = contentStatus.fileStat.size;
		headers['debug-fileStat-blocks'] = contentStatus.fileStat.blocks;
		headers['debug-fileStat-atime'] = contentStatus.fileStat.atime;
		headers['debug-fileStat-mtime'] = contentStatus.fileStat.mtime;
		headers['debug-fileStat-ctime'] = contentStatus.fileStat.ctime;
//		console.log(contentStatus);
	}

	//TODO content-length
	//PENDING writeHeadの位置をどうにか
	if (statusCode === 304) {
		response.writeHead(statusCode, headers);
		response.end();
	} else {
		//文字系データはgzip圧縮する
		if (contentType[contentStatus.type].indexOf('text/') === 0) {
			zlib.gzip(content, function (_, result) {
				headers['content-encoding'] = 'gzip';
				headers['Content-Length'] = result.length;
				response.writeHead(statusCode, headers);
				response.end(result);
			});
		} else {
			headers['Content-Length'] = content.length;
			response.writeHead(statusCode, headers);
			response.end(content);
		}
	}

	logs.statusCode = statusCode;
	accessLog(logs);
}

//転送
function redirect(response, statusCode, url, logs) {
	response.writeHead(statusCode, {"location": URL_BASE + url});
	response.end();

	logs.statusCode = statusCode;
	accessLog(logs);
}

//アクセスログ
function accessLog(logs) {
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(logs.requestTime + ' ' + logs.host + ' ' + logs.httpVersion + ' ' + logs.method + ' ' + logs.url + ' ' + logs.statusCode + httpStatus[logs.statusCode] + ' ' + logs.userAgent + logs.msg);
	console.log(logs.statusCode + httpStatus[logs.statusCode]);
}

//エラーログ
function errorLog(log) {
	//TODO オブジェクト受け取るようにする
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
}


/** ニアスケイプwebモジュール本体
 * 
 * node httpモジュールから呼ばれる	
 * リクエストメソッドによって処理を振り分ける
 * 
 * @param {type} request
 * @param {type} response
 * @returns {undefined}
 */
function nsweb(request, response) {

	var requestTime = new Date();

	var logs = {
		requestTime : requestTime,
		host        : request.headers.host,
		url         : request.url,
		httpVersion : request.httpVersion,
		method      : request.method,
		statusCode  : 500,
		userAgent   : request.headers['user-agent'],
		msg         : '',
		debug       : {
			requestTime        : requestTime,
			idleStart          : Date(request.client._idleStart),
			monotonicStartTime : request.client._monotonicStartTime
//		url                : request.url ,
//		headers            : request.headers ,
//		http               : 'v' + request.httpVersion + ' ' + request.method ,
			}
	};

	//PENDING 先にURLで振り分けるべき？
	if (request.method === 'GET') {
		httpGet(request, response, logs);
	} else if (request.method === 'POST') {
		httpPost(request, response, logs);
	} else { //非許可HTTPメソッドは405
		returnResponse(response, 405, '405' + httpStatus[403], {type: 'txt'}, logs);
	}

	//TODO あとで消す デバッグ用
	// /*
	console.log("################################################################"
			//+ "request :", {
		//requestTime        : requestTime,
//		url                : request.url ,
//		headers            : request.headers ,
//		http               : 'v' + request.httpVersion + ' ' + request.method ,
//		idleStart          : Date(request.client._idleStart),
//		monotonicStartTime : request.client._monotonicStartTime
//	}
			);
	// */
	//console.log(request);
}

/**
 * エクスポート
 */
module.exports = nsweb;
