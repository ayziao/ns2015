/**
 * ニアスケイプモジュール
 *
 * 文字列と表示形式を受け取ってコールバックに渡す
 */

//PENDING 権限チェックをどうするか どこでやるか

/**
 * 設定
 */
var config    = require('./config.json').ns;
var dbf = config.db || 'db.sqlite3';
var staticDir = config.staticDir || './static/';


/**
 * モジュール
 */
//nodeコアモジュール
var fs   = require('fs');

//npm : Node Package Manager
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(dbf);
db.on("trace", function(sql) {
  console.log(sql);
});


/**
 * 関数定義
 */

//timeline	
function timeline(str,type,callback){
	db.serialize(function(){
		var user = 'test';
		var sql = "SELECT * FROM basedata WHERE user = '"+ user +"' AND tags NOT LIKE '% gyazo_posted %' ORDER BY identifier DESC LIMIT 10";
		db.all(sql, function(err, rows){
			if (!err) {
				callback(null,JSON.stringify(rows,null,"\t"));
			} else {
				callback(err,null);
			}
		}); 
	});
}

//コンテント取得
function content(str,type,callback){
	var filePath = staticDir + 'default' + str;
	fs.readFile(filePath, function (err, buf) {
		if (err) { //静的ファイル無し
			db.serialize(function(){
				var user = 'test';
				var sql = "SELECT * FROM basedata WHERE identifier = '"+ str.slice(1) +"' AND user = '"+ user +"' ORDER BY identifier DESC LIMIT 1";
				db.all(sql, function(err, rows){
					if (!err) {
						callback(null,JSON.stringify(rows[0],null,"\t"));
					} else {
						callback(err,null);
					}
				}); 
			});
		} else { //ファイルあり
			callback(null,buf,filePath);
		}
	});

}

//TODO 投稿


/**
 * エクスポート
 */
module.exports = {
	timeline : timeline ,
	content  : content
}
