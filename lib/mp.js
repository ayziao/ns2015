/* global require, module */

/**
 * マルチポストモジュール
 *
 * 外部サービスへ投稿する
 */

/**
 * 設定
 */
var config   = require('../config/config.json').twitter; //FIXME DBに
var gyazokey = require('../config/config.json').gyazo; //FIXME DBに


/**
 * モジュール
 */
//nodeコアモジュール
var fs = require('fs');

//Node Package Manager
var twitter = require('twitter');
//var Gyazo  = require('gyazo-api');


/**
 * 初期化
 */
//var gyazo_client = new Gyazo(gyazokey);


/**
 * 関数定義
 */


/** 
 * 投稿
 * 
 * @param {string} body
 * @param {array} tags
 * @param {object} files
 * @param {object} gyazores
 * @param {string} user
 * @param {function} callback
 * @returns {post}
 */
function post(body, tags, files, gyazores, user, callback) {

	//TODO サービスごとにどうにか

	//Twitter
	var twitter_api = new twitter(config[user]['main']['oathKeys']);

	//FIXME 雑コーディング
	var aaa = function (err, res) {};
	if (typeof config[user]['sub'] != "undefined") {
		var twitter_api_sub = new twitter(config[user]['sub']['oathKeys']);
		if (gyazores) {
			aaa = function (err, res) {
				if (err) {

				} else {
					twitterStatusesUpdate(twitter_api_sub, res.text + ' ' + gyazores.data.permalink_url, [], null, user, function (err, bbb) {
					});
				}
			}
		} else {
			aaa = function (err, res) {
				if (err) {

				} else {
					twitterStatusesUpdate(twitter_api_sub, res.text + config[user]['sub']['suffix'], [], null, user, function (err, bbb) {
					});
				}
			};
		}
	}

	//PENDING 複数ファイル対応するか
	var value = files['file'];
	if (value.size > 0 && value.name !== '') {
		fs.readFile(value.path, function (err, buf) {
			twitter_api.post('/media/upload.json', {media: buf}, function (err, res) {
				console.log(res);
				twitterStatusesUpdate(twitter_api, body, tags, res.media_id_string, user, aaa);
			});
		});
	} else {
		twitterStatusesUpdate(twitter_api, body, tags, null, user, aaa);
	}
}

function twitterStatusesUpdate(twitterObj, body, tags, media_ids, user, callback) {

	var tagstring = '';
	if (tags.length > 0) {
		tagstring = ' #' + tags.join(" #");
	}

	var params = {
		status: body + tagstring,
		include_entities: 1
	};

	if (media_ids) {
		params['media_ids'] = media_ids;
	}

	twitterObj.post('/statuses/update.json', params, function (err, res) {
		if (err) {
			//DEBUG あとで消す
			console.log({tweet_respons: '**********errrrrrrrrrr***************',
				err: err,
				res: res
			});
			//PENDING 重複投稿をどうにか	
			if (err.code === 187) {
				params.status += ' .';
				twitterObj.post('/statuses/update.json', params, function (err, res) {
					console.log({tweet_respons: '*************************',
						res: res
					});
					callback(null, res);
				});
			} else {
				callback(err, res);
			}
		} else {
			//DEBUG あとで消す
			console.log("*************************\n" + "tweet_respons :", res);
			callback(null, res);
			if (media_ids && typeof config[user]['rt'] !== "undefined" && res.text.match(/#猫写真/)) {
				//FIXME 雑コーディング
				var twitter_api_rt = new twitter(config[user]['rt']['oathKeys']);
				twitter_api_rt.post('/favorites/create.json', {id: res.id_str}, function (err, favres) {
					if (err) {
						//DEBUG あとで消す
						console.log({fav_respons: '**********errrrrrrrrrr***************',
							err: err
						});
					}
					console.log({favo_respons: '*************************',
						res: favres
					});
				});
				twitter_api_rt.post('/statuses/retweet/' + res.id_str + '.json', {id: res.id_str}, function (err, rtres) {
					if (err) {
						//DEBUG あとで消す
						console.log({rt_respons: '**********errrrrrrrrrr***************',
							err: err
						});
					}
					console.log({rt_respons: '*************************',
						res: rtres
					});
				});
			}
		}
	});
}


/**
 * エクスポート
 */
module.exports = {
	post: post
};
