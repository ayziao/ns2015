/* global require, module, UNKNOWN */
'use strict';

/*
 * ニアスケイプwebモジュール
 * 
 * HTTPに関わるところを処理する HTTPヘッダとかレスポンス処理とかHTTPのアクセスログとか
 * HTMLはコマンドラインでも使うのでcontents部分はns本体でやる
 * webアプリとしてのHTMLやjsはこのモジュールで差し込む
 */


/*
 * 設定
 */
//PENDING 動的な設定変更を設定ファルでやるか？DBの設定テーブルでやるか？
var domainName = require('../config/config.json').http.domainName;
var userinsert = require('../config/config.json').userinsert;
var staticDir  = require('../config/config.json').ns.staticDir || './static/';


/*
 * 定数的なの
 */
var URL_BASE = '/';
var httpStatus = {
	200: ' OK',
	303: ' See Other',             //他を参照せよ
	304: ' Not Modified',          //未更新
	403: ' Forbidden',             //禁止
	404: ' NotFound',              //未検出
	405: ' Method Not Allowed',    //許可されていないメソッド
	413: ' Request entity too large',
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


/*
 * モジュール
 */

//nodeコアモジュール
var path = require('path');
var zlib = require('zlib');
var url  = require('url');
var fs   = require('fs');

//Node Package Manager
var formidable = require('formidable');

//自作モジュール
var ns = require('../lib/ns');


/*
 * モジュールローカル関数
 */

/**
 * リクエストヘッダからユーザ取得
 * 
 * @param {type} request
 * @returns {requestFromUser.arrayOfStrings|String}
 */ //リクエストヘッダからユーザ取得
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
	var parseurl = url.parse(request.url.replace("/@" + user, ""),true); //FIXME サブドメインのときいらない ディレクトリの時も先頭マッチがいる
	var requestUrl = parseurl.pathname; //request.url.replace("/@" + user, "");
	
	//FIXME 現状デバッグ用かな とりあえずテストユーザ入れてる
	//PENDING ユーザしていない時どうするか考える
	if (user === "") {
		user = 'test';
	}

	//TODO DBから取得するだけの動的ページの場合は全文のハッシュをetagにする

	if (requestUrl === '/') { //トップへのアクセス
		//タイムライン 
		ns.timeline(user, '/', 'html', function (err, content) {
			if (err) { //エラー
				returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				errorLog({httpGet: 'timeline 取得エラー', err: err});
				return;
			}
			//TODO トップへのアクセス時の機能はサイト管理ユーザが設定できるようにする
			//PENDING 権限を持ったユーザがアクセスした時にHTMLには機能を付与して表示する その方法を考える

			//FIXME 投稿フォーム埋め込み
			var formHtmlPath = staticDir + 'default/form.html'; //XXX 動的にする
			fs.readFile(formHtmlPath, 'utf8', function (err, formHtml) {
				if (err) {
					callback(err, null);
				} else {
					var reshtml = content.split("__form__").join(formHtml).split("__urlbase__").join(URL_BASE);

					//FIXME ユーザ指定文字列埋め込み
					if (userinsert[user]) {
						reshtml = reshtml.split("__userinsert__").join(userinsert[user]);
					} else {
						reshtml = reshtml.split("__userinsert__").join("");
					}

					//XXX 投稿ブックマークレットのアレ
					if (parseurl.query.form) {
						reshtml = reshtml.split("__textval__").join(parseurl.query.form);
					} else {
						reshtml = reshtml.split("__textval__").join("");
					}

					returnResponse(response, 200, reshtml, {type: 'html'}, logs);
				}
			});
		});

	} else if (requestUrl.search(/^\/\d{8}$/) !== -1) { //数字のみ8個
		//PENDING タイトル検索で見つからなかった時だけ？
		ns.daysummary(user, requestUrl.slice(1), 'html', function (err, content) {
			if (err) { //エラー
				returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				errorLog({httpGet: 'daysummary 取得エラー', err: err});
				return;
			}
			var reshtml = content.split("__form__").join('').split("__urlbase__").join(URL_BASE);

			//FIXME ユーザ指定文字列埋め込み
			if (userinsert[user]) {
				reshtml = reshtml.split("__userinsert__").join(userinsert[user]);
			} else {
				reshtml = reshtml.split("__userinsert__").join("");
			}

			//XXX 投稿ブックマークレットのアレ
			if (parseurl.query.form) {
				reshtml = reshtml.split("__textval__").join(parseurl.query.form);
			} else {
				reshtml = reshtml.split("__textval__").join("");
			}

			returnResponse(response, 200, reshtml, {type: 'html'}, logs);
		});

	} else { //トップ以外
		//FIXME 拡張子関連
		var extname = path.extname(requestUrl).replace(".", '');
		if (extname === '') {
			extname = 'html';
		}
		//PENDING etagが静的ファイルのやつっぼかったらファイル実体は取得せずファイル情報だけ取得して比較してからファイル実体取得？
		ns.content(user, requestUrl, extname, function (err, content, contentStatus) {
			if (err){ //エラー
				returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				errorLog({httpGet: 'content 取得エラー', err: err});
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
			
			if (contentStatus.type == 'html') {
				//TODO タグ修正フォーム
				var reshtml = content.split("__form__").join('').split("__urlbase__").join(URL_BASE);

				//FIXME ユーザ指定文字列埋め込み
				if (userinsert[user]) {
					reshtml = reshtml.split("__userinsert__").join(userinsert[user]);
				} else {
					reshtml = reshtml.split("__userinsert__").join("");
				}
				content = reshtml;
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
		if (err) { //エラー
			returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
			errorLog({httpPost: 'parse error', err: err});
			return;
		}
		
		console.log(files);
		if (typeof fields.body !== "undefined" && fields.body.trim() !== "") {
			var body = fields.body.replace(/\r\n?/g, "\n").trim();
			var tags = fields.tags.trim().replace(/\s/, " ").replace(/\s{2,}/, " ").split(" ").filter(Boolean);
			ns.post(body, tags, files, user, function (err) {
				if (err) {
					returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
					errorLog({httpPost: '投稿失敗', err: err});
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
		headers['debug-type']             = contentStatus.type;
		headers['debug-filePath']         = contentStatus.filePath;
		headers['debug-fileStat-dev']     = contentStatus.fileStat.dev;
		headers['debug-fileStat-mode']    = contentStatus.fileStat.mode;
		headers['debug-fileStat-nlink']   = contentStatus.fileStat.nlink;
		headers['debug-fileStat-uid']     = contentStatus.fileStat.uid;
		headers['debug-fileStat-gid']     = contentStatus.fileStat.gid;
		headers['debug-fileStat-rdev']    = contentStatus.fileStat.rdev;
		headers['debug-fileStat-blksize'] = contentStatus.fileStat.blksize;
		headers['debug-fileStat-ino']     = contentStatus.fileStat.ino;
		headers['debug-fileStat-size']    = contentStatus.fileStat.size;
		headers['debug-fileStat-blocks']  = contentStatus.fileStat.blocks;
		headers['debug-fileStat-atime']   = contentStatus.fileStat.atime;
		headers['debug-fileStat-mtime']   = contentStatus.fileStat.mtime;
		headers['debug-fileStat-ctime']   = contentStatus.fileStat.ctime;
//		console.log(contentStatus);
	}

	//PENDING デバッグ用 デバッグモードの時だけ出力？
	headers['debug-requestTime']        = logs.debug.requestTime;
	headers['debug-idleStart']          = logs.debug.idleStart;
	headers['debug-monotonicStartTime'] = logs.debug.monotonicStartTime;

	//TODO content-length
	//PENDING writeHeadの位置をどうにか
	if (statusCode === 304) {
		response.writeHead(statusCode, headers);
		response.end();
	} else {
		//文字系データはgzip圧縮する
		if (contentType[contentStatus.type].indexOf('charset') > 0) {
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
	
	var headers = {"location": URL_BASE + url};
	
	//PENDING デバッグ用 デバッグモードの時だけ出力？
	headers['debug-requestTime']        = logs.debug.requestTime;
	headers['debug-idleStart']          = logs.debug.idleStart;
	headers['debug-monotonicStartTime'] = logs.debug.monotonicStartTime;

	response.writeHead(statusCode, headers);
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
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
	console.trace();	
}


/*
 * 公開関数
 */

/** 
 * ニアスケイプwebモジュール
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
	
	//TODO あとで消す デバッグ用
	console.log("############" , requestTime ,"################################################################" );
//		url                : request.url ,
//		headers            : request.headers ,
//		http               : 'v' + request.httpVersion + ' ' + request.method ,
//console.log(request);


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

}

/**
 * エクスポート
 */
module.exports = nsweb;
