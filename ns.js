//ニアスケイプモジュール
//文字列と表示形式を受け取ってコールバックに渡す

var config    = require('./config.json').ns;
var dbf = config.db || 'db.sqlite3';

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbf);


//コンテント取得
function getContent(str,type,callback){

	db.serialize(function(){
		var user = 'test';
		var sql = "SELECT * FROM basedata WHERE user = '"+ user +"' AND tags NOT LIKE '% gyazo_posted %' ORDER BY identifier DESC LIMIT 10";
		db.all(sql, function(err, rows){
			if (!err) {
			    console.log(rows);
			}
		}); 
	    console.log(sql);
	});

	callback(null,'ハロー');
}

//投稿
module.exports = {
	getContent : getContent
}
