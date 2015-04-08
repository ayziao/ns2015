/* global require, process */

'use strict';

/**
 * アプリケーション
 *
 * httpサーバ起動するだけ
 */


/**
 * 設定
 */
var config = require('./config/config.json').http;
var port   = process.argv[2] || process.env.PORT || config.port || 8080; //PENDING コマンドライン引数ちゃんと考える
var user   = config.user || 'node';


/**
 * モジュール
 */
//コアモジュール
var http = require('http');

//Node Package Manager


//自作モジュール
var nsweb = require('./lib/nsweb');

/**
 * HTTPサーバ起動
 */
http.createServer(nsweb).listen(port, function () {
	console.log('ポート' + port + 'でHTTP接続待ち受け開始 ' + (new Date()).toISOString());
	if (port < 1025 && user !== 'root') {
		process.setuid(user);
		console.log('実行ユーザを' + user + 'に変更');
	}
});

//DEBUG あとで消す
console.log('env: ',process.env);
console.log('args: ', process.argv);
