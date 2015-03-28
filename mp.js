/**
 * マルチポストモジュール
 *
 * 外部サービスへ投稿する
 */

/**
 * 設定
 */
var config = require('./config.json').twitter;


/**
 * モジュール
 */
//nodeコアモジュール
var fs = require('fs');

//npm : Node Package Manager
var twitter = require('twitter');


/**
 * 関数定義
 */

//投稿
function post(body,tags,files,user,callback){

	//TODO サービスごとにどうにか
	//Twitter
	var twitest = new twitter(config[user]);

	//PENDING 複数ファイル対応するか
	for (var key in files) {
		var value = files[key];
		if(value.size > 0 && value.name != ''){
			fs.readFile(value.path, function (err, buf) {
				twitest.post('/media/upload.json', {media:buf}, function (err,res) {
					console.log(res);
					twitterStatusesUpdate(twitest,body,tags,res.media_id_string);
				});
			});
		} else {
			twitterStatusesUpdate(twitest,body,tags);
		}
	};
}

function twitterStatusesUpdate(twitterObj,body,tags,media_ids){
	
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
			//PENDING 重複投稿をどうにか	
			if (err.code = 187){
				params.status += '.'
				twitterObj.post('/statuses/update.json', params, function (err,res) {
					console.log({tweet_respons:'*************************',
						res:res,
					});
				});
			} else {
				//DEBUG あとで消す
				console.log({tweet_respons:'**********errrrrrrrrrr***************',
					err:err,
					res:res,
				});
			}
		} else {
			//DEBUG あとで消す
			console.log({tweet_respons:'*************************',
				res:res,
			});
		}
	});
}


/**
 * エクスポート
 */
module.exports = {
	post : post 
}
