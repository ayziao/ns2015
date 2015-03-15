//ニアスケイプモジュール
//文字列と表示形式を受け取ってコールバックに渡す

var config    = require('./config.json').ns;
var dbf = config.db || 'db.sqlite3';

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbf);

db.on("trace", function(sql) {
  console.log(sql);
});


//ダッシュボード	
function dashboard(str,type,callback){
	db.serialize(function(){
		var user = 'test';
		var sql = "SELECT * FROM basedata WHERE user = '"+ user +"' AND tags NOT LIKE '% gyazo_posted %' ORDER BY identifier DESC LIMIT 10";
		db.all(sql, function(err, rows){
			if (!err) {
				callback(null,JSON.stringify(rows));
			} else {
				callback(err,null);
			}
		}); 
	});
}

//コンテント取得
function content(str,type,callback){
	db.serialize(function(){
		var user = 'test';
		var sql = "SELECT * FROM basedata WHERE identifier = '"+ str +"' AND user = '"+ user +"' ORDER BY identifier DESC LIMIT 1";
		db.all(sql, function(err, rows){
			if (!err) {
				callback(null,JSON.stringify(rows[0]));
			} else {
				callback(err,null);
			}
		}); 
	});
}

//投稿
module.exports = {
	dashboard  : dashboard ,
	content : content
}
