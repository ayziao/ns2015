/* global require, module */
'use strict';

/**
 * @fileoverview ニアスケイプwebモジュール
 *
 * HTTPに関わるところを処理する HTTPヘッダとかレスポンス処理とかHTTPのアクセスログとか
 * HTMLはコマンドラインでも使うのでcontents部分はns本体でやる
 * webアプリとしてのHTMLやjsはこのモジュールで差し込む
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
var tree2flat = require('../lib/utility').tree2flat;
var templateReplace = require('../lib/utility').templateReplace;


/*
 * 設定
 */
//PENDING 動的な設定変更を設定ファルでやるか？DBの設定テーブルでやるか？
var domainName = require('../config/config.json').http.domainName;
var staticDir  = require('../config/config.json').ns.staticDir || './static/';


/*
 * 定数的なの
 */
var URL_BASE = '/';
var httpStatus = {
	200: ' OK',
	303: ' See Other',               //他を参照せよ
	304: ' Not Modified',            //未更新
	403: ' Forbidden',               //禁止
	404: ' NotFound',                //未検出
	405: ' Method Not Allowed',      //許可されていないメソッド
	413: ' Request entity too large',//大きすぎる
	500: ' Internal Server Error',   //サーバ内部エラー
	503: ' Service Unavailable'      //サービス利用不可
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
 * モジュールローカル関数
 */

//アクセスログ
function _accessLog(logs) {
//TODO apache形式でファイルに書き出したりできるように
	console.log(logs.requestTime
			+ ' ' + logs.host + ' ' + logs.httpVersion + ' ' + logs.method
			+ ' ' + logs.url + ' ' + logs.statusCode + httpStatus[logs.statusCode]
			+ ' ' + logs.userAgent + logs.msg);
	console.log(logs.statusCode + httpStatus[logs.statusCode]);
}

//エラーログ
function _errorLog(log) {
	//TODO apache形式でファイルに書き出したりできるように
	console.log(log);
	console.trace();
}

//GETリクエスト
function _httpGet(request, response, logs) {
	var extname, formHtmlPath, replacelist, resHtml;

	var user = _requestFromUser(request);
	var parseurl = url.parse(request.url.replace('/@' + user, ''), true); //FIXME サブドメインのときいらない ディレクトリの時も先頭マッチがいる
	var requestUrl = parseurl.pathname; //request.url.replace('/@' + user, '');

	//FIXME 現状デバッグ用かな とりあえずテストユーザ入れてる
	//PENDING ユーザ指定ない時どうするか考える
	if (user === '') {
		user = 'test';
	}

	//TODO DBから取得するだけの動的ページの場合は全文のハッシュをetagにする
	if (parseurl.query.hasOwnProperty('tag')){
		ns.searchtag(user, parseurl.query.tag, 'html', function (err, content) {
			if (err) { //エラー
				_returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				_errorLog({_httpGet: 'tag 取得エラー', err: err});
				return;
			}
			resHtml = content.replace('__form__', '');
			_returnResponse(response, 200, resHtml, {type: 'html'}, logs);
		});
	} else if (parseurl.query.hasOwnProperty('searchbody')){
		ns.searchbody(user, parseurl.query.searchbody, 'html', function (err, content) {
			if (err) { //エラー
				_returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				_errorLog({_httpGet: '検索 取得エラー', err: err});
				return;
			}
			resHtml = content.replace('__form__', '');
			_returnResponse(response, 200, resHtml, {type: 'html'}, logs);
		});
	} else if (requestUrl === '/') { //トップへのアクセス
		//タイムライン
		ns.timeline(user, '/', 'html', function (err, content) {
			if (err) { //エラー
				_returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				_errorLog({_httpGet: 'timeline 取得エラー', err: err});
				return;
			}

			//TODO トップへのアクセス時の機能はサイト管理ユーザが設定できるようにする
			//PENDING 権限を持ったユーザがアクセスした時にHTMLには機能を付与して表示する その方法を考える

			//FIXME 投稿フォーム埋め込み
			formHtmlPath = staticDir + 'default/form.html'; //XXX 動的にする
			fs.readFile(formHtmlPath, 'utf8', function (error, formHtml) {
				if (error) {
//TODO					callback(error, null);
					return;
				}
				replacelist = {urlbase: URL_BASE, user: user};
				if (parseurl.query.form) {
					replacelist.textval = parseurl.query.form;
				}
				formHtml = templateReplace(formHtml, replacelist, true);
				resHtml = content.replace('__form__', formHtml);
				_returnResponse(response, 200, resHtml, {type: 'html'}, logs);
			});
		});

	} else if (requestUrl.search(/^\/\d{8}$/) === 0) { //数字のみ8個 日サマリ
		//PENDING タイトル検索で見つからなかった時だけ？
		ns.daysummary(user, requestUrl.slice(1), 'html', function (err, content) {
			if (err) { //エラー
				_returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
				_errorLog({_httpGet: 'daysummary 取得エラー', err: err});
				return;
			}
			resHtml = content.replace('__form__', '');
			_returnResponse(response, 200, resHtml, {type: 'html'}, logs);
		});
	} else { //トップ以外
		//FIXME 拡張子関連
		extname = path.extname(requestUrl).replace('.', '');
		if (extname === '') {
			extname = 'html';
		}
		//PENDING etagが静的ファイルのやつっぼかったらファイル実体は取得せずファイル情報だけ取得して比較してからファイル実体取得？
		ns.content(user, requestUrl, extname, function (err, content, contentStatus) {
			if (err){ //エラー
				contentStatus.requestType = contentStatus.type;
				contentStatus.type = 'txt';
				_returnResponse(response, 500, '500' + httpStatus[500], contentStatus, logs);
				_errorLog({_httpGet: 'content 取得エラー', err: err, contentStatus: contentStatus});
				return;
			}
			if (!content) { //コンテントがない場合404
				contentStatus.requestType = contentStatus.type;
				contentStatus.type = 'txt';
				_returnResponse(response, 404, '404' + httpStatus[404], contentStatus, logs);
				return;
			}

			if (typeof contentStatus.fileStat !== 'undefined') { //静的ファイルの場合etagを組み立てる
				contentStatus.etag = contentStatus.fileStat.mtime + contentStatus.fileStat.size;
				logs.msg += ' readFile:' + contentStatus.filePath; //ファイルパスをログに保存 デバッグ用？
			}
			if (request.headers['if-none-match']) { //クライアントがキャッシュを持っている
				if (request.headers['if-none-match'] === contentStatus.etag) {
					_returnResponse(response, 304, content, contentStatus, logs);
					return;
				}
			}
			if (contentStatus.type === 'html') {
//TODO タグ修正フォーム
				resHtml = content.replace('__form__', '');
				content = resHtml;
			}

			_returnResponse(response, 200, content, contentStatus, logs);
		});
	}
}

//POSTリクエスト
function _httpPost(request, response, logs) {
	var body, redirectUrl, taglist;
	var user = _requestFromUser(request);
	var form = new formidable.IncomingForm();

	//TODO 権限チェック
	if (user === '') {
		_returnResponse(response, 405, '405' + httpStatus[403], {type: 'txt'}, logs);
		return;
	}

	redirectUrl = '';
	if (request.url.indexOf('/@' + user + '/') === 0) {
		redirectUrl = '@' + user + '/';
	}

	form.parse(request, function (err, fields, files) {
		if (err) { //エラー
			_returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
			_errorLog({_httpPost: 'parse error', err: err});
			return;
		}

		console.log(files);
		if (typeof fields.body !== 'undefined' && fields.body.trim() !== '') {
			body = fields.body.replace(/\r\n?/g, '\n').trim();
			taglist = fields.tags.trim().replace(/\s/, ' ').replace(/\s{2,}/, ' ')
					.split(' ').filter(Boolean);
			ns.post(body, taglist, files, user, function (error) {
				if (error) {
					_returnResponse(response, 500, '500' + httpStatus[500], {type: 'txt'}, logs);
					_errorLog({_httpPost: '投稿失敗', err: error});
				} else {
//					_returnResponse(response,200,'posted',{type:'txt'},logs);
					_redirect(response, 303, redirectUrl, logs);
				}
			});
		} else { //本文無しは転送
			_redirect(response, 303, redirectUrl, logs);
		}
	});
}

//転送
function _redirect(response, statusCode, redirectUrl, logs) {

	var headers = {'location': URL_BASE + redirectUrl};

	//PENDING デバッグ用 デバッグモードの時だけ出力？
	headers['debug-requestTime']        = logs.debug.requestTime;
	headers['debug-idleStart']          = logs.debug.idleStart;
	headers['debug-monotonicStartTime'] = logs.debug.monotonicStartTime;

	response.writeHead(statusCode, headers);
	response.end();

	logs.statusCode = statusCode;
	_accessLog(logs);
}

/**
 * リクエストヘッダからユーザ取得
 * @param {http.IncomingMessage} request httpモジュールのリクエストオブジェクト
 * @returns {String} サイト名
 */
function _requestFromUser(request) {

	//FIXME ポート番号指定じゃないと動かん
	var host = request.headers.host;
	var arrayOfStrings = host.split('.' + domainName);
	var atsplit;

	if (arrayOfStrings.length === 2) {
		return arrayOfStrings[0];
	} else {
		atsplit = request.url.split('@');
		if (atsplit.length === 2) {
			return atsplit[1].split('/')[0];
		} else {
			return '';
		}
	}
}

//返送
function _returnResponse(response, statusCode, content, contentStatus, logs) {
	var headers = {'Content-Type': contentType[contentStatus.type]};

	if (typeof contentStatus.fileStat !== 'undefined') { //静的ファイル
		headers['Cache-Control'] = 'max-age=86400'; //1日 PENDING ファイルの種類とかで延長するか？
		headers.ETag             = contentStatus.etag;
	}

	//PENDING デバッグ用 デバッグモードの時だけ出力？
	tree2flat(headers, contentStatus, 'debug');
	tree2flat(headers, logs.debug, 'debug');
//		console.log(contentStatus);

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
	_accessLog(logs);
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
 * @param {type} request httpモジュールのリクエストオブジェクト
 * @param {type} response httpモジュールのレスポンスオブジェクト
 * @returns {undefined} 返り値無し
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
			}
	};

	//TODO あとで消す デバッグ用
	console.log('############', requestTime, '################################################################');
//console.log(request);

	//PENDING 先にURLで振り分けるべき？
	if (request.method === 'GET') {
		_httpGet(request, response, logs);
	} else if (request.method === 'POST') {
		_httpPost(request, response, logs);
	} else { //非許可HTTPメソッドは405
		_returnResponse(response, 405, '405' + httpStatus[403], {type: 'txt'}, logs);
	}
}

/**
 * エクスポート
 */
module.exports = nsweb;
