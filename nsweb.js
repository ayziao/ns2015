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
var URL_BASE = '/';

var httpStatus = {
	200 : ' OK',
	303 : ' See Other',             //他を参照せよ
	304 : ' Not Modified',          //未更新
	403 : ' Forbidden',             //禁止
	404 : ' NotFound',              //未検出
	405 : ' Method Not Allowed',    //許可されていないメソッド
	500 : ' Internal Server Error', //サーバ内部エラー
	503 : ' Service Unavailable',   //サービス利用不可
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

var formHtml = (function () {/*
		<form action="__urlbase__" method="POST" enctype="multipart/form-data">

			<script type="text/javascript">
				var textbox=document.getElementById('box');
				var submitButton=document.getElementById('btn');
				
				textbox.addEventListener(
					'keydown',
					function(e){
						key = e.which;
						if(sbmit==false&&e.metaKey&&e.which==13) {
							submitButton.click();
							sbmit = true;
						}
					},
					false
				)

				var key = "none";
				var sbmit = false;

				var bodylen = 0;
				var taglen = 0;

				function showmojilen(){
					var strlen = bodylen + taglen;
					document.getElementById('strcount').innerHTML="<span style='font-weight: bold;color:blue ;'>"+strlen+"</span>文字 " + key;
				}
				
				function mojilenbody(str){
					bodylen = str.length;
				}

				function mojilentag(str){
					taglen = str.length;
				}
			</script>

			<textarea id="box" style="width:100%;" rows="4" name="body" onKeyup="mojilenbody(value);"></textarea>
			tag<input type="text" name="tags" onKeyup="mojilentag(value);">
			<input id="btn" type="submit" name="submit" value="post" style="width: 100px;height: 60px;font-size: 2em;">
			<input type="file" name="file" accept="image/*">
			<input type="hidden" name="user" value="__user__">
			<span id="strcount">文字数</span><br>

		</form>	
*/}).toString().match(/\n([\s\S]*)\n/)[0];

	console.log(formHtml);


/**
 * モジュール
 */

//nodeコアモジュール
var path = require('path');
var http = require('http');

//npm : Node Package Manager
var formidable = require('formidable');

//自作モジュール
var ns = require('./ns');


/**
 * モジュールローカル関数
 */
//GETリクエスト
function httpGet(request, response,logs){
	if (request.url == '/') { //トップへのアクセス
		//タイムライン 
		ns.timeline('/','html',function(err,content){
			//TODO トップへのアクセス時の機能はサイト管理ユーザが設定できるようにする
			//PENDING 権限を持ったユーザがアクセスした時にHTMLには機能を付与して表示する その方法を考える

			//FIXME 投稿フォーム埋め込み
			var reshtml = content.split("__form__").join(formHtml).split("__urlbase__").join(URL_BASE);
			returnResponse(response,200,reshtml,'html',logs);
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
				returnResponse(response,404,'404' + httpStatus[404],'txt',logs);
			}
		});
	}
}

//POSTリクエスト
function httpPost(request, response,logs){
	var form = new formidable.IncomingForm();
	var user = 'test'; //FIXME ユーザー取得
	//TODO 権限チェック

	form.parse(request, function( err, fields, files) {
		console.log(files);
		if(typeof fields.body != "undefined" && fields.body.trim() !== "" ){
			var body = fields.body.replace(/\r\n?/g,"\n").trim();
			var tags = fields.tags.trim().replace(/\s/, " ").replace(/\s{2,}/, " ").split(" ").filter(Boolean);
			ns.post(body,tags,'test',function(err){
				if (err){
					returnResponse(response,500,'err','txt',logs);
					errorLog({msg:'投稿失敗',err:err});
				} else {
					returnResponse(response,200,'posted','txt',logs);
				}
			});
		} else { //本文無しは転送
			redirect(response,303,'',logs);
		}
	});
}

//返送
function returnResponse(response,statusCode,content,type,logs){
	response.writeHead(statusCode, {'Content-Type': contentType[type]});
	response.end(content);

	logs.statusCode = statusCode;
	accessLog(logs);
}

//転送
function redirect(response,statusCode,url,logs){
	response.writeHead(statusCode, {"location": URL_BASE + url});
	response.end();

	logs.statusCode = statusCode;
	accessLog(logs);
}

//アクセスログ
function accessLog(logs){
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(logs.requestTime + ' ' + logs.host + ' ' + logs.httpVersion + ' ' + logs.method + ' ' + logs.url + ' ' + logs.statusCode + httpStatus[logs.statusCode] + ' ' + logs.userAgent + logs.msg);
	console.log(logs.statusCode + httpStatus[logs.statusCode]);
}

//エラーログ
function errorLog(log){
	//TODO オブジェクト受け取るようにする
	//TODO apache形式でファイルに書き出したりできるように	
	console.log(log);
}


/** ニアスケイプwebモジュール本体
 * 
 * node httpモジュールから呼ばれる	
 * リクエストメソッドによって処理を振り分ける
 */
function nsweb(request, response) {

	var requestTime = new Date();

	var logs = {
		requestTime : requestTime ,
		host        : request.headers.host ,
		url         : request.url ,
		httpVersion : request.httpVersion ,
		method      : request.method ,
		statusCode  : 500 ,
		userAgent   : request.headers['user-agent'] ,
		msg         : '' ,
	}

 	//PENDING 先にURLで振り分けるべき？
	if (request.method == 'GET') {
		httpGet(request, response,logs);
	} else if (request.method == 'POST') { 
		httpPost(request, response,logs);
	} else { //非許可HTTPメソッドは405
		returnResponse(response,405,'405' + httpStatus[403],'txt',logs);
	}

	//TODO あとで消す デバッグ用
	// /*
	console.log({
		request            : "######################################" ,
		requestTime        : requestTime ,
		url                : request.url ,
		headers            : request.headers ,
		http               : 'v' + request.httpVersion + ' ' + request.method ,
		idleStart          : Date(request.client._idleStart) ,
		monotonicStartTime : request.client._monotonicStartTime ,
	});
	// */
	//console.log(request);
}

/**
 * エクスポート
 */
module.exports = nsweb;
