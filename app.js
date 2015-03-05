//アプリケーション
//httpサーバ起動するだけ

//設定
var config    = require('./config.json').http;
var port      = config.port || 80;
var user      = config.user || 'node';

//コアモジュール
var http = require('http');

//npm : Node Package Manager

//自作モジュール
var nsweb   = require('./nsweb');

//HTTPサーバ起動
http.createServer(nsweb).listen(port, function () {
    console.log('ポート' + port + 'でHTTP接続待ち受け開始');
    if(port < 1025 && user != 'root'){
	    process.setuid(user);
	    console.log('実行ユーザを' + user + 'に変更');
    }
});
