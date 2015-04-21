/* global require, process, module */
'use strict';

/*
 * ニアスケイプモジュール
 *
 * データ取出 文字列と表示形式を受け取ってコールバックに渡す
 * データ書込 ID振って書き込み マルチポストへぶん投げ
 * データ修正 基本的に新しいIDを振るって古いのは修正されましたよタグ タグは修正しまくり可能
 * データ削除 PENDING ブロックチェインとして実装したら削除はできなくなるのでは
 * 
 * PENDING Pythonで書く？
 */

//PENDING 権限チェックをどうするか どこでやるか
//PENDING 初期化処理 設定ファイル無いとき作る？
//PENDING 初期化処理 DB無いとき作る？
//TODO 画像ローカル保存 外部サービス利用はmpでオプショナルにやる


/*
 * 設定
 */
var config    = require('../config/config.json').ns;
var dbf       = config.db || 'db.sqlite3';
var staticDir = config.staticDir || './static/';
var gyazokey  = require('../config/config.json').gyazo; //FIXME DBに TODO mpへ

/*
 * モジュール
 */
//nodeコアモジュール
var fs = require('fs');

//Node Package Manager
var sqlite3 = require('sqlite3').verbose();
var Gyazo   = require('gyazo-api'); //TODO mpへ

//自作モジュール
var mp = require('../lib/mp');
var formatDate = require('../lib/utility').formatDate;
var templateReplace = require('../lib/utility').templateReplace;


/*
 * 初期化
 */
//DB
//PENDING 必要なときに接続すべきか ファイルを分けた場合の対応は？
var db = new sqlite3.Database(dbf);
db.on("trace", function (sql) {
	console.log(sql);
});

//gyazo	FIXME mpへ移動する
var gyazo_client = new Gyazo(gyazokey);

/*
 * モジュールローカル関数
 */


//タイムライン組み立て
function timelinekumitate(rows) {
	//PENDING 名前どうにか	
	//PENDING SQLの戻り行達から直で組み立てるのではなく日付とかでツリー構造のオブジェクトにする？
	var timeline = '\n\t\t<div>\n\t\t\t<div>';
	var day = '';
	var daylink = '';

	rows.forEach(function (row) {
		if (day !== formatDate(new Date(row.datetime), 'YYYY-MM-DD')) {
			day = formatDate(new Date(row.datetime), 'YYYY-MM-DD');
			daylink = formatDate(new Date(row.datetime), 'YYYYMMDD');
			timeline = timeline + '\t\t\t</div>\n\t\t\t<h5><a href="' + './' + daylink + '">' 
					+ day + '</a></h5>\n\t\t\t<div class="lines">\n';
		}

		//PENDING 改行した時時刻がアレ	
		timeline += '\t\t\t\t<div class="line">'
				+ '<span class="time">' + '<a href="' + './' + row.identifier + '">'
				+ formatDate(new Date(row.datetime), 'hh:mm:ss')
				+ '</a></span>&thinsp;'
				+ row.body.replace(/\n/g, "<br/>") + row.tags.replace(" twitter_posted", "")
				+ "</div>\n";
	});
	return timeline + '\t\t\t</div>\n\t\t</div>\n';
}

function date2identifier(date) {
	var tmpdate = date === undefined ? new Date() : date;
	var time = process.hrtime();
	var microtime = ("00000000" + time[1]).slice(-9, -3);
	return formatDate(tmpdate, 'YYYYMMDDhhmmss' + microtime);
}

function fileStat(content, contentStatus, callback) {
	fs.stat(contentStatus.filePath, function (err, stats) {
		if (!err) {
			contentStatus['fileStat'] = stats;
			callback(null, content, contentStatus);
		} else {
			console.log({fileStat: '**************errrrrrrrr***********',
				stats: stats,
				err: err
			});
			callback(err, content, contentStatus);
		}
	});
}

/*
 * モジュール公開関数
 */

/**
 * タイムライン
 * 
 * @param {type} user
 * @param {type} str
 * @param {type} type
 * @param {type} callback
 * @returns {undefined}
 */
function timeline(user, str, type, callback) {
	db.serialize(function () {
		var sql = "SELECT * FROM basedata WHERE user = '" + user + "'"
				+ " AND tags NOT LIKE '% gyazo_posted %'"
				+ " ORDER BY identifier DESC LIMIT 100";
		db.all(sql, function (err, rows) {
			if (!err) {
				if (type === 'html') {
					var timeline = timelinekumitate(rows);
					var tophtmlPath = staticDir + 'default/top.html'; //XXX 動的にする
					fs.readFile(tophtmlPath, 'utf8', function (err, tophtml) {
						if (err) {
							callback(err, null);
						} else {
							var replace = {user: user, title: 'タイムライン' ,contents:timeline};
							var rtnhtml = templateReplace(tophtml, replace);
							callback(null, rtnhtml);
						}
					});
				} else {
					callback(null, JSON.stringify(rows, null, "\t"));
				}
			} else {
				callback(err, null);
			}
		});
	});
}


/**
 * 日別
 * 
 * @param {type} user
 * @param {type} str
 * @param {type} type
 * @param {type} callback
 * @returns {undefined}
 */
function daysummary(user, str, type, callback) {
	db.serialize(function () {
		var sql = "SELECT * FROM basedata WHERE user = '" + user
				+ "' AND tags NOT LIKE '% gyazo_posted %' "
				+ " AND title LIKE '" + str + "%' ORDER BY identifier ASC LIMIT 1000";
		db.all(sql, function (err, rows) {
			if (!err) {
				if (type === 'html') {
					var timeline = timelinekumitate(rows);
					var tophtmlPath = staticDir + 'default/top.html'; //XXX 動的にする
					fs.readFile(tophtmlPath, 'utf8', function (err, tophtml) {
						if (err) {
							callback(err, null);
						} else {
							var replace = {user: user, title: str ,contents:timeline};
							var rtnhtml = templateReplace(tophtml, replace);
							callback(null, rtnhtml);
						}
					});
				} else {
					callback(null, JSON.stringify(rows, null, "\t"));
				}
			} else {
				callback(err, null);
			}
		});
	});
}


/** 
 * コンテント取得
 * 
 * @param {type} user
 * @param {type} path
 * @param {type} type
 * @param {type} callback
 * @returns {undefined}
 */
function content(user, path, type, callback) {
	//PENDING サイトIDどうするか
	//TODO コマンドテーブルチェック

	//静的ファイルチェック
	var filePath = staticDir + 'sites/' + user + path;

	var contentStatus = {type: type, filePath: filePath};

	fs.readFile(filePath, function (err, buf) {
		if (!err) { //静的ユーザファイルあり
			fileStat(buf, contentStatus, callback);
			return;
		}

		//静的ユーザファイル無しの場合デフォルトファイルを探す
		filePath = staticDir + 'default' + path;
		contentStatus.filePath = filePath;
		fs.readFile(filePath, function (err, buf) {
			if (!err) { //静的デフォルトファイルあり
				fileStat(buf, contentStatus, callback);
				return;
			}

			//静的ファイルがない場合データテーブルチェック
			db.serialize(function () {
				var sql = "SELECT * FROM basedata WHERE identifier = '"
						+ path.slice(1).split('.'+type)[0] + "' AND user = '"
						+ user + "' ORDER BY identifier DESC LIMIT 1";
				db.all(sql, function (err, rows) {
					if (!err) {
						//TODO etag
						if(type == 'html'){
							var timeline = timelinekumitate(rows);
							var tophtmlPath = staticDir + 'default/top.html'; //XXX 動的にする
							fs.readFile(tophtmlPath, 'utf8', function (err, tophtml) {
								if (err) {
									callback(err, null);
								} else {
									var rtnhtml = tophtml.split("__user__").join(user)
											.split("__title__").join(path)
											.split("__contents__").join(timeline);
									callback(null, rtnhtml,contentStatus);
								}
							});
						} else if (type == 'txt') {
							var text = '■' + formatDate(new Date(rows[0].datetime), 'YYYY-MM-DD')
								+ "\n●" + formatDate(new Date(rows[0].datetime), 'hh:mm:ss.') + rows[0].identifier.slice(-6)
								+ ' ' + rows[0].title + "\t" + rows[0].tags.trim() 
								+ "\n" + rows[0].body;
							
							callback(null, text, contentStatus);
						} else {
							callback(null, JSON.stringify(rows[0], null, "\t"), contentStatus);
						}
					} else {
						callback(err, null, null);
					}
				});
			});
		});
	});
}

//投稿
function post(body, tags, files, user, callback) {
	var date = new Date();
	var identifier = date2identifier(date);

	var tagstring = '';
	if (tags.length > 0 && tags[0] !== '') {
		tagstring = ' #' + tags.join(" #");
	}

	db.serialize(function () {

		//TOOD basedataモデル作る
		var basedataInsertSql = "INSERT INTO basedata"
				+ " (user,identifier,datetime,title,tags,body)"
				+ " VALUES (?,?,?,?,?,?)";

		//画像投稿
		//TODO ローカル環境に画像を保存するようにして gyazoはmpで
		//TODO twitter_postedはmpで後で付与するように
		//PENDING mpへの指示はキューを通してやるようにする？
		var value = files['file'];
		if (value.size > 0 && value.name !== '') {
			gyazo_client.upload(value.path)
					.then(function (gyazores) {
						//DEBUG あとで消す
						console.log({
							gyazo_post: '*************************',
							files: files,
							res: gyazores
						});

						var date1 = new Date();
						var identifier1 = date2identifier(date1);

						db.run(basedataInsertSql,
								[user,
									identifier1,
									formatDate(date1, 'YYYY-MM-DD hh:mm:ss'),
									identifier1,
									' gyazo_posted ',
									JSON.stringify(gyazores.data)
								],
								function (err) {
									if (err) {
										console.log(err);
									} else {
										var date2 = new Date();
										var identifier2 = date2identifier(date2);
										var tags2 = tagstring + ' twitter_posted with_image:' + identifier1 + ' ';

										db.run(basedataInsertSql,
												[user,
													identifier2,
													formatDate(date2, 'YYYY-MM-DD hh:mm:ss'),
													identifier2,
													tags2,
													body
												],
												function (err) {
													if (err) {
														console.log(err);
													} else {
														callback(null);

														//マルチポスト
														mp.post(body, tags, files, gyazores, user, function () {});
													}
												}
										);
									}
								}
						);
					})
					.catch(function (err) {
						//DEBUG あとで消す
						console.log({err_respons: '######gyazo errrrrrrrrrrrrr#######', err: err}); //err.stack
					});
		} else {
			//PENDING 直近の投稿と同じだったらどうするか ボタン誤連打は表示側で防ぐか？
			db.run(basedataInsertSql,
					[user,
						identifier,
						formatDate(date, 'YYYY-MM-DD hh:mm:ss'),
						identifier,
						tagstring + ' twitter_posted ',
						body
					],
					function (err) {
						console.log('画像なしDB投稿');
						if (err) {
							callback(err);
						} else {
							callback(null);
							//マルチポスト
							mp.post(body, tags, files, null, user, function () {});
						}
					}
			);
		}
	});
}

/*
 * エクスポート
 */
module.exports = {
	timeline  : timeline,
	daysummary:daysummary,
	content   : content,
	post      : post
};
