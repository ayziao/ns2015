/**
 * マルチポストモジュール
 *
 * 外部サービスへ投稿する
 */

/**
 * 設定
 */
var config = require('./config.json').twitter; //fixme DBに
var gyazokey = require('./config.json').gyazo; //fixme DBに


/**
 * モジュール
 */
//nodeコアモジュール
var fs = require('fs');

//npm : Node Package Manager
var twitter = require('twitter');
//var Gyazo  = require('gyazo-api');


/**
 * 初期化
 */
//var gyazo_client = new Gyazo(gyazokey);


/**
 * 関数定義
 */

//投稿
function post(body,tags,files,gyazores,user,callback){

	//TODO サービスごとにどうにか

	//Twitter
	var twitter_api = new twitter(config[user]['main']['oathKeys']);

	//FIXME 雑コーディング
	var aaa = function(err,res){};
	if (typeof config[user]['sub'] != "undefined") {
		var twitter_api_sub = new twitter(config[user]['sub']['oathKeys']);
		if(gyazores){
			aaa = function(err,res){
				if(err){

				} else {
					twitterStatusesUpdate(twitter_api_sub, res.text + ' ' + gyazores.data.permalink_url, [], null, function(err,bbb){});
				}
			}
		} else {
			aaa = function(err,res){
				if(err){

				} else {
					twitterStatusesUpdate(twitter_api_sub, res.text + config[user]['sub']['suffix'], [], null, function(err,bbb){});
				}
			};
		}
	}

	//PENDING 複数ファイル対応するか
	var value = files['file'];
	if(value.size > 0 && value.name != ''){
		fs.readFile(value.path, function (err, buf) {
			twitest.post('/media/upload.json', {media:buf}, function (err,res) {
				console.log(res);
				twitterStatusesUpdate(twitter_api,body,tags,res.media_id_string,aaa);
			});
		});
	} else {
		twitterStatusesUpdate(twitter_api,body,tags,null,aaa);
	}
}

function twitterStatusesUpdate(twitterObj,body,tags,media_ids,callback){
	
	var tagstring = '';
	if(tags.length > 0){
		tagstring = ' #' + tags.join(" #")
	}

	var params = {
		status: body + tagstring,
		include_entities: 1,
	};

	if (media_ids){
		params['media_ids'] = media_ids;
	}

	twitterObj.post('/statuses/update.json', params, function (err,res) {
		if (err) {
			//DEBUG あとで消す
			console.log({tweet_respons:'**********errrrrrrrrrr***************',
				err:err,
				res:res,
			});
			//PENDING 重複投稿をどうにか	
			if (err.code = 187){
				params.status += ' .'
				twitterObj.post('/statuses/update.json', params, function (err,res) {
					console.log({tweet_respons:'*************************',
						res:res,
					});
					callback(null,res);
				});
			} else {
				callback(err,res);
			}
		} else {
			//DEBUG あとで消す
			console.log({tweet_respons:'*************************',
				res:res,
			});
			callback(null,res);
		}
	});
}


/**
 * エクスポート
 */
module.exports = {
	post : post 
}
