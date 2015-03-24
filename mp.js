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
//npm : Node Package Manager
var twitter = require('twitter');


/**
 * 関数定義
 */

//投稿
function post(body,tags,user,callback){

	var tagstring = '';
	if(tags.length > 0){
		tagstring = ' #' + tags.join(" #")
	}

	var params = {
		status: body + tagstring,
		include_entities: 1
	};

	var twitest = new twitter(config[user]);
	twitest.post('/statuses/update.json', params, function (err,res) {
		if (err) {
			//PENDING 重複投稿をどうにか	
			if (err.code = 187){
				params.status += '.'
				twitest.post('/statuses/update.json', params, function (err,res) {
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
