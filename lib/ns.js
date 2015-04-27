/* global require, process, module */
'use strict';

/*
 * @fileoverview ニアスケイプモジュール
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
var dbf        = require('../config/config.json').ns.db || 'db.sqlite3';
var staticDir  = require('../config/config.json').ns.staticDir || './static/';
var gyazokey   = require('../config/config.json').gyazo; //FIXME DBに TODO mpへ
var userinsert = require('../config/config.json').userinsert; //FIXME DBに

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
db.on('trace', function (sql) {
	console.log(sql);
});


/*
 * モジュールローカル関数
 */


//タイムライン組み立て
function timelinekumitate(rows) {
	var timelineHtml = '\n\t\t<div>\n\t\t\t<div>';
	var day = '';
	var daylink = '';

	//PENDING 名前どうにか
	//PENDING SQLの戻り行達から直で組み立てるのではなく日付とかでツリー構造のオブジェクトにする？
	//PENDING テンプレート化

	rows.forEach(function (row) {
		if (day !== formatDate(new Date(row.datetime), 'YYYY-MM-DD')) {
			day = formatDate(new Date(row.datetime), 'YYYY-MM-DD');
			daylink = formatDate(new Date(row.datetime), 'YYYYMMDD');
			timelineHtml += '\t\t\t</div>\n\t\t\t<h5><a href="' + './' + daylink + '">'
					+ day + '</a></h5>\n\t\t\t<div class="lines">\n';
		}

		//PENDING 改行した時時刻がアレ
		timelineHtml += "\t\t\t\t" + '<div class="line">'
				+ '<span class="time">' + '<a href="' + './' + row.identifier + '">'
				+ formatDate(new Date(row.datetime), 'hh:mm:ss')
				+ '</a></span>&thinsp;'
				+ row.body.replace(/\n/g, '<br>').replace(/__/g, '&#x5f;_')
				+ row.tags.replace(' twitter_posted', '') //TODO システムタグは全部消す ユーザタグの#消してタグ検索へリンク
				+ "</div>\n";
	});
	return timelineHtml + "\t\t\t</div>\n\t\t</div>\n";
}

function date2identifier(date) {
	var tmpdate = date || new Date();
	var time = process.hrtime();
	var microtime = ('00000000' + time[1]).slice(-9, -3);
	return formatDate(tmpdate, 'YYYYMMDDhhmmss' + microtime);
}

function fileStat(contentData, contentStatus, callback) {
	fs.stat(contentStatus.filePath, function (error, stats) {
		if (!error) {
			contentStatus.fileStat = stats;
			callback(null, contentData, contentStatus);
		} else {
			console.log({fileStat: '**************errrrrrrrr***********',
				stats: stats,
				err: error
			});
			contentStatus.err = 'fs.stat err';
			callback(error, contentData, contentStatus);
		}
	});
}

/*
 * モジュール公開関数
 */

/**
 * タイムライン
 *
 * @param {strings} user ユーザ名//TODO サイト名にする
 * @param {strings} str なんか絞る用//PENDING 何をどう絞るか
 * @param {strings} type コンテンツタイプ(拡張子)
 * @param {type} callback コールバック//FIXME コメントちゃんと書く
 * @returns {undefined} 返り値無し
 */
function timeline(user, str, type, callback) {
	var replaceList, rtnhtml, sql, timelineHtml, tophtmlPath;
	db.serialize(function () {
		sql = "SELECT * FROM basedata WHERE user = '" + user + "'"
				+ " AND tags NOT LIKE '% gyazo_posted %'"
				+ " ORDER BY identifier DESC LIMIT 100";
		db.all(sql, function (dbError, rows) {
			if (dbError) {
				callback(dbError, null);
				return;
			}

			if (type === 'html') {
				timelineHtml = timelinekumitate(rows);
				tophtmlPath = staticDir + 'default/top.html'; //XXX 動的にする
				fs.readFile(tophtmlPath, 'utf8', function (fsError, tophtml) {
					if (fsError) {
						callback(fsError, null);
					} else {
						replaceList = {user: user, title: 'タイムライン', contents: timelineHtml};
						//FIXME ユーザ指定文字列埋め込み
						if (userinsert[user]) {
							replaceList.userinsert = userinsert[user];
						} else {
							replaceList.userinsert = '<!-- userinsert -->';
						}
						rtnhtml = templateReplace(tophtml, replaceList);
						callback(null, rtnhtml);
					}
				});
			} else {
				callback(null, JSON.stringify(rows, null, "\t"));
			}
		});
	});
}


/**
 * 日別
 *
 * @param {type} user ユーザ名 //TODO サイトにする
 * @param {type} str 日文字列(YYYYMMDD)
 * @param {type} type コンテンツタイプ
 * @param {type} callback コールバック//FIXME コメントちゃんと書く
 * @returns {undefined} 返り値なし
 */
function daysummary(user, str, type, callback) {
	var replaceList, rtnhtml, timelineHtml, tophtmlPath;
	db.serialize(function () {
		var sql = "SELECT * FROM basedata WHERE user = '" + user
				+ "' AND tags NOT LIKE '% gyazo_posted %' "
				+ " AND title LIKE '" + str + "%' ORDER BY identifier ASC LIMIT 1000";
		db.all(sql, function (error, rows) {
			if (!error) {
				if (type === 'html') {
					timelineHtml = timelinekumitate(rows);
					tophtmlPath = staticDir + 'default/top.html'; //XXX 動的にする
					fs.readFile(tophtmlPath, 'utf8', function (fsError, tophtml) {
						if (fsError) {
							callback(fsError, null);
						} else {
							replaceList = {user: user, title: str, contents: timelineHtml};
							//FIXME ユーザ指定文字列埋め込み
							if (userinsert[user]) {
								replaceList.userinsert = userinsert[user];
							} else {
								replaceList.userinsert = '<!-- userinsert -->';
							}
							rtnhtml = templateReplace(tophtml, replaceList);
							callback(null, rtnhtml);
						}
					});
				} else {
					callback(null, JSON.stringify(rows, null, "\t"));
				}
			} else {
				callback(error, null);
			}
		});
	});
}


/**
 * コンテント取得
 *
 * @param {type} user ユーザ//TODO サイトにする
 * @param {type} path コンテントパス
 * @param {type} type コンテンツタイプ
 * @param {type} callback コールバック//FIXME コメントちゃんと書く
 * @returns {undefined} 返り値なし
 */
function content(user, path, type, callback) {
	var replaceList, rtnhtml, text, timelineHtml, tophtmlPath;
	var contentStatus = {type: type};

	//PENDING サイトIDどうするか
	//TODO コマンドテーブルチェック

	//静的ファイルチェック
	var filePath = staticDir + 'sites/' + user + path;

	fs.readFile(filePath, function (error, buf) {
		if (!error) { //静的ユーザファイルあり
			contentStatus.filePath = filePath;
			fileStat(buf, contentStatus, callback);
			return;
		}

		//静的ユーザファイル無しの場合デフォルトファイルを探す
		filePath = staticDir + 'default' + path;
		fs.readFile(filePath, function (fsError, defaultFileBuf) {
			if (!fsError) { //静的デフォルトファイルあり
				contentStatus.filePath = filePath;
				fileStat(defaultFileBuf, contentStatus, callback);
				return;
			}
			//PENDING ファイルなしerror以外の時は？

			//静的ファイルがない場合データテーブルチェック
			db.serialize(function () {
				var sql = "SELECT * FROM basedata WHERE identifier = '"
						+ path.slice(1).split('.' + type)[0] + "' AND user = '"
						+ user + "' ORDER BY identifier DESC LIMIT 1";
				db.all(sql, function (dbError, rows) {
					if (dbError) {
						contentStatus.err = 'db err';
						callback(dbError, null, contentStatus);
						return;
					}

					if (rows.length === 0) {
						contentStatus.err = 'no data';
						callback(null, null, contentStatus);
						return;
					}

					//TODO etag
					if (type === 'html') {
						//テンプレート取得して埋め込み
						timelineHtml = timelinekumitate(rows);
						tophtmlPath = staticDir + 'default/top.html'; //XXX 動的にする
						fs.readFile(tophtmlPath, 'utf8', function (fileErr, tophtml) {
							if (fileErr) {
								callback(fileErr, null);
							} else {
								replaceList = {user: user, title: path.slice(1), contents: timelineHtml};
								//FIXME ユーザ指定文字列埋め込み
								if (userinsert[user]) {
									replaceList.userinsert = userinsert[user];
								} else {
									replaceList.userinsert = '<!-- userinsert -->';
								}
								rtnhtml = templateReplace(tophtml, replaceList);
								callback(null, rtnhtml, contentStatus);
							}
						});
					} else if (type === 'txt') {
						//TODO テンプレート化
						text = '■' + formatDate(new Date(rows[0].datetime), 'YYYY-MM-DD')
								+ "\n●" + formatDate(new Date(rows[0].datetime), 'hh:mm:ss.')
								+ rows[0].identifier.slice(-6)
								+ ' ' + rows[0].title + "\t" + rows[0].tags.trim()
								+ "\n" + rows[0].body;

						callback(null, text, contentStatus);
					} else if (type === 'json') {
						callback(null, JSON.stringify(rows[0], null, "\t"), contentStatus);
					} else {
						contentStatus.err = 'type err';
						callback(null, null, contentStatus);
						return;
					}

				});
			});

		});
	});

}

//投稿
function post(body, tags, files, user, callback) {
	var basedataInsertSql, imageFile;
	var date1, identifier1;
	var date2, identifier2, tags2;
	var date = new Date();
	var identifier = date2identifier(date);
	//gyazo	FIXME mpへ移動する
	var gyazoClient;

	var tagstring = '';
	if (tags.length > 0 && tags[0] !== '') {
		tagstring = ' #' + tags.join(' #');
	}

	db.serialize(function () {

		//TOOD basedataモデル作る
		basedataInsertSql = "INSERT INTO basedata"
				+ " (user,identifier,datetime,title,tags,body)"
				+ " VALUES (?,?,?,?,?,?)";

		//画像投稿
		//TODO ローカル環境に画像を保存するようにして gyazoはmpで
		//TODO twitter_postedはmpで後で付与するように
		//PENDING mpへの指示はキューを通してやるようにする？
		imageFile = files.file;
		if (imageFile.size > 0 && imageFile.name !== '') {
			//gyazo	FIXME mpへ移動する
			gyazoClient = new Gyazo(gyazokey);
			gyazoClient.upload(imageFile.path)
					.then(function (gyazores) {
						//DEBUG あとで消す
						console.log({
							gyazoPost: '*************************',
							files: files,
							res: gyazores
						});

						date1 = new Date();
						identifier1 = date2identifier(date1);

						db.run(basedataInsertSql,
								[user,
									identifier1,
									formatDate(date1, 'YYYY-MM-DD hh:mm:ss'),
									identifier1,
									' gyazo_posted ',
									JSON.stringify(gyazores.data)
								],
								function (error) {
									if (error) {
										console.log(error);
									} else {
										date2 = new Date();
										identifier2 = date2identifier(date2);
										tags2 = tagstring + ' twitter_posted with_image:' + identifier1 + ' ';

										db.run(basedataInsertSql,
												[user,
													identifier2,
													formatDate(date2, 'YYYY-MM-DD hh:mm:ss'),
													identifier2,
													tags2,
													body
												],
												function (dberror) {
													if (dberror) {
														console.log(dberror);
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
					.catch(function (error) {
						//DEBUG あとで消す
						console.log({errRespons: '######gyazo errrrrrrrrrrrrr#######', error: error}); //error.stack
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
					function (error) {
						console.log('画像なしDB投稿');
						if (error) {
							callback(error);
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
