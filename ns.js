/**
 * ニアスケイプモジュール
 *
 * 文字列と表示形式を受け取ってコールバックに渡す
 */

//PENDING 権限チェックをどうするか どこでやるか
//PENDING 初期化処理 設定ファイル無いとき作る？
//PENDING 初期化処理 DB無いとき作る？


/**
 * 設定
 */
var config    = require('./config.json').ns;
var dbf = config.db || 'db.sqlite3';
var staticDir = config.staticDir || './static/';
var gyazokey = require('./config.json').gyazo; //fixme DBに


/**
 * モジュール
 */
//nodeコアモジュール
var fs   = require('fs');

//Node Package Manager
var sqlite3 = require('sqlite3').verbose();
var Gyazo  = require('gyazo-api');

//自作モジュール
var mp = require('./mp');


/**
 * 定数的なの
 */

//投稿画面HTML //PENDING webで動かしてる時しか投稿フォームとか表示しない？	
var tophtml = (function () {/*
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width">
		<title>__title__ __user__</title>
		<link rel="stylesheet" type="text/css" href="./css.css" />
	</head>
	
	<body>
		<h1>__user__</h1>
		__form__
		__contents__
	</body>
</html>
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1].trim();


/**
 * 初期化
 */
//DB
var db = new sqlite3.Database(dbf);
db.on("trace", function(sql) {
  console.log(sql);
});

var gyazo_client = new Gyazo(gyazokey);

/**
 * モジュールローカル関数
 */

/**
 * 日付をフォーマットする
 * @param  {Date}   date     日付
 * @param  {String} [format] フォーマット
 * @return {String}          フォーマット済み日付
 */
var formatDate = function (date, format) {
	if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS';
	format = format.replace(/YYYY/g, date.getFullYear());
	format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
	format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
	format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
	format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
	format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
	if (format.match(/S/g)) {
		var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
		var length = format.match(/S/g).length;
		for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
	}
	return format;
};

//タイムライン組み立て
function timelinekumitate(rows){
	//PENDING 名前どうにか	
	//PENDING SQLの戻り行達から直で組み立てるのではなく日付とかでツリー構造のオブジェクトにする？
	var timeline = '\n\t\t<div>';
	var day = '';
	var gyou = 'guusuu';

	rows.forEach(function(row){
		if(gyou == 'guusuu'){
			gyou = 'kisuu';
		} else {
			gyou = 'guusuu';
		}
		if(day != formatDate(new Date(row.datetime),'YYYY-MM-DD')){
			day = formatDate(new Date(row.datetime),'YYYY-MM-DD');
			timeline = timeline + '\n\t\t\t<h5>' + day + '</h5>\n' ;
		}

		//PENDING 改行した時時刻がアレ	
		timeline += '\t\t\t<div class="'+ gyou +'">' 
			+ '<span class="time">' + '<a href="' + './' + row.identifier + '">' 
			+ formatDate(new Date(row.datetime),'hh:mm:ss') 
			+ '</a></span> ' 
			+ row.body.replace(/\n/g,"<br/>") + ' ' + row.tags.replace( "twitter_posted" , "" ) 
			+ "</div>\n";
	});
	return timeline + '\t\t</div>\n';
}

function date2identifier(date){
	var tmpdate = date === undefined ? new Date() : date;
	var time = process.hrtime();
	var microtime = ("00000000"+time[1]).slice(-9,-3);
	return formatDate(tmpdate,'YYYYMMDDhhmmss' + microtime);
}

function fileStat(err,content,contentStatus,callback){
	fs.stat(contentStatus.filePath,  function (err, stats) {
		if(!err){
			contentStatus['etag'] = stats.mtime + stats.size;
		}
	
		//DEBUG あとで消す
		console.log({fileStat:'*************************',
			contentStatus:contentStatus,
		});
		callback(null,content,contentStatus);
	});
}

/**
 * モジュール公開関数
 */

//timeline	
function timeline(user,str,type,callback){
	db.serialize(function(){
		var sql = "SELECT * FROM basedata WHERE user = '" + user 
			+ "' AND tags NOT LIKE '% gyazo_posted %' ORDER BY identifier DESC LIMIT 100";
		db.all(sql, function(err, rows){
			if (!err) {
				if(type == 'html'){
					var timeline = timelinekumitate(rows);
					var rtnhtml = tophtml.split("__user__").join(user)
						.split("__contents__").join(timeline)
						.split("__title__").join('タイムライン');
					callback(null,rtnhtml);
				} else {
					callback(null,JSON.stringify(rows,null,"\t"));
				}
			} else {
				callback(err,null);
			}
		});
	});
}

//コンテント取得
function content(user,path,type,callback){
	//TODO サイトIDどうするか
	//TODO コマンドテーブルチェック
	//静的ファイルチェック
	var filePath = staticDir + 'sites/' + user + path;
	fs.readFile(filePath, function (err, buf) {
		if (err) { //静的ユーザファイル無し
			filePath = staticDir + 'default' + path;
			fs.readFile(filePath, function (err, buf) {
				if (err) { //静的デフォルトファイル無し
					//データテーブルチェック
					db.serialize(function(){
						var sql = "SELECT * FROM basedata WHERE identifier = '"
							+ path.slice(1) +"' AND user = '"
							+ user +"' ORDER BY identifier DESC LIMIT 1";
						db.all(sql, function(err, rows){
							if (!err) {
								//TODO タイプで出し分け
								callback(null,JSON.stringify(rows[0],null,"\t"),null);
							} else {
								callback(err,null,null);
							}
						});
					});
				} else { //デフォルトファイルあり
					fileStat(null,buf,{filePath:filePath},callback);
				}
			});
		} else { //ユーザファイルあり
			fileStat(null,buf,{filePath:filePath},callback);
		}
	});
}

//投稿
function post(body,tags,files,user,callback){
	var date = new Date();
	var identifier = date2identifier(date) ;

	var tagstring = '';
	if(tags.length > 0 && tags[0] != ''){
		tagstring = ' #' + tags.join(" #")
	}

	db.serialize(function(){

		//画像投稿
		//TODO ローカル環境に画像を保存するようにして gyazoはmpで
		//TODO twitter_postedはmpで後で付与するように
		//PENDING mpへの指示はキューを通してやるようにする？
		var value = files['file'];
		if(value.size > 0 && value.name != ''){
			gyazo_client.upload(value.path)
			.then(function(gyazores){
				//DEBUG あとで消す
				console.log({
					gyazo_post:'*************************',
					files:files,
					res:gyazores
				});

				var date1 = new Date();
				var identifier1 = date2identifier(date1) ;

				db.run("INSERT INTO basedata (user,identifier,datetime,title,tags,body) VALUES (?,?,?,?,?,?)",
					[ user ,
					 identifier1 ,
					 formatDate(date1,'YYYY-MM-DD hh:mm:ss') ,
					 identifier1 ,
					 ' gyazo_posted ',
					 JSON.stringify(gyazores.data)
					] ,
					function(err) {
						if(err){	
							console.log(err);
						} else {
							var date2 = new Date();
							var identifier2 = date2identifier(date2);
							var tags2 = tagstring + ' twitter_posted with_image:' + identifier1 + ' ';

							db.run("INSERT INTO basedata (user,identifier,datetime,title,tags,body) VALUES (?,?,?,?,?,?)",
								[ user ,
								 identifier2 ,
								 formatDate(date2,'YYYY-MM-DD hh:mm:ss') ,
								 identifier2 ,
								 tags2,
								 body
								] ,
								function(err) {
									if(err){
										console.log(err);
									} else {
										callback(null);

										//マルチポスト
										mp.post(body,tags,files,gyazores,user,function(){});
									}
								}
							);
						}
					}
				);
			})
			.catch(function(err){
				//DEBUG あとで消す
				console.log({err_respons:'######gyazo errrrrrrrrrrrrr#######' ,err:err}); //err.stack
			});
		} else {
			//PENDING 直近の投稿と同じだったらどうするか ボタン誤連打は表示側で防ぐか？
			db.run("INSERT INTO basedata (user,identifier,datetime,title,tags,body) VALUES (?,?,?,?,?,?)",
				[ user ,
				 identifier ,
				 formatDate(date,'YYYY-MM-DD hh:mm:ss') ,
				 identifier ,
				 tagstring + ' twitter_posted ',
				 body
				] ,
				function(err) {
					console.log('画像なしDB投稿');
					if(err){
						callback(err);
					} else {
						callback(null);

						//マルチポスト
						mp.post(body,tags,files,null,user,function(){});
					}
				}
			);
		}
	});

}



/**
 * エクスポート
 */
module.exports = {
	timeline : timeline ,
	content  : content ,
	post : post ,
}
