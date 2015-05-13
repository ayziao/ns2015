/* global require, module */
'use strict';

/**
 * @fileoverview マルチポストモジュール
 *
 * 外部サービスへ投稿する
 */

//nodeコアモジュール
var fs = require('fs');

//Node Package Manager
var Twitter = require('twitter');
//var Gyazo  = require('gyazo-api');


/*
 * 設定
 */
var config = require('../config/config.json').twitter; //FIXME DBに
//var gyazokey = require('../config/config.json').gyazo; //FIXME DBに


/*
 * 初期化
 */
//var gyazo_client = new Gyazo(gyazokey);


/*
 * モジュールローカル関数
 */

/**
 * Twitter更新
 * @param {Twitter} twitterObj Twitterインスタンス
 * @param {String} body 本文
 * @param {array} tags タグ配列
 * @param {String} mediaIds 画像投稿していた場合メディアID
 * @param {type} user ユーザ名 FIXME サイト名にする
 * @param {type} callback 終了後処理
 * @returns {undefined} 返り値なし
 */
function _twitterStatusesUpdate(twitterObj, body, tags, mediaIds, user, callback) {

	var params, twitterApiRt;

	var tagstring = '';
	if (tags.length > 0) {
		tagstring = ' #' + tags.join(' #');
	}

	params = {
		status: body + tagstring,
		include_entities: 1
	};

	if (mediaIds) {
		params.media_ids = mediaIds;
	}

	twitterObj.post('/statuses/update.json', params, function (err, res) {
		if (err) {
			//DEBUG あとで消す
			console.log({tweetRespons: '**********errrrrrrrrrr***************',
				err: err,
				res: res
			});
			//PENDING 重複投稿をどうにか
			if (err.code === 187) {
				params.status += ' .';
				twitterObj.post('/statuses/update.json', params, function (terr, tres) {
					if (terr) {
						callback(terr, tres);
					}
					console.log({tweetRespons: '*************************',
						res: tres
					});
					callback(null, tres);
				});
			} else {
				callback(err, res);
			}
		} else {
			//DEBUG あとで消す
			console.log("*************************\n" + 'tweet_respons :', res);
			callback(null, res);
			if (mediaIds && typeof config[user].rt !== 'undefined' && res.text.match(/#猫写真/)) {
				//FIXME 雑コーディング
				twitterApiRt = new Twitter(config[user].rt.oathKeys);
				twitterApiRt.post('/favorites/create.json', {id: res.id_str}, function (fverr, favres) {
					if (fverr) {
						//DEBUG あとで消す
						console.log({favRespons: '**********errrrrrrrrrr***************',
							err: fverr
						});
					}
					console.log({favRespons: '*************************',
						res: favres
					});
				});
				twitterApiRt.post('/statuses/retweet/' + res.id_str + '.json', {id: res.id_str}, function (terr, rtres) {
					if (terr) {
						//DEBUG あとで消す
						console.log({rtRespons: '**********errrrrrrrrrr***************',
							err: terr
						});
					}
					console.log({rtRespons: '*************************',
						res: rtres
					});
				});
			}
		}
	});
}


/*
 * モジュール公開関数
 */

/**
 * 投稿
 * @param {string} body 本文
 * @param {array} tags タグ配列
 * @param {object} files 画像ファイル
 * @param {object} gyazores gyazo
 * @param {string} user ユーザ名 FIXME サイトにする
 * @returns {null} 戻り値なし
 */
function post(body, tags, files, gyazores, user) {

	var callback, twitterApiSub, value;
	//TODO サービスごとにどうにか

	//Twitter
	var twitterApi = new Twitter(config[user].main.oathKeys);

	//FIXME 雑コーディング
	callback = function (err, res) {
		if (err) {
			// FIXME
			console.log(err);
			return;
		}
		return;
	};
	if (typeof config[user].sub !== 'undefined') {
		twitterApiSub = new Twitter(config[user].sub.oathKeys);
		if (gyazores) {
			callback = function (err, res) {
				if (err) {
					// FIXME
					console.log(err);
					return;
				} else {
					_twitterStatusesUpdate(twitterApiSub, res.text + ' ' + gyazores.data.permalink_url, [], null, user, function (terr, bbb) {
						return;
					});
				}
			};
		} else {
			callback = function (err, res) {
				if (err) {
					// FIXME
					console.log(err);
					return;
				} else {
					_twitterStatusesUpdate(twitterApiSub, res.text + config[user].sub.suffix, [], null, user, function (terr, bbb) {
						return;
					});
				}
			};
		}
	}

	//PENDING 複数ファイル対応するか
	value = files.file;
	if (value.size > 0 && value.name !== '') {
		fs.readFile(value.path, function (err, buf) {
			if (err){
				console.log(err);
				return;
			}
			twitterApi.post('/media/upload.json', {media: buf}, function (terr, res) {
				if (terr){
					console.log(terr);
					return;
				}
				console.log(res);
				_twitterStatusesUpdate(twitterApi, body, tags, res.media_id_string, user, callback);
			});
		});
	} else {
		_twitterStatusesUpdate(twitterApi, body, tags, null, user, callback);
	}
}


/**
 * エクスポート
 */
module.exports = {
	post: post
};
