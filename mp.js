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
var Gyazo  = require('gyazo-api');


/**
 * 初期化
 */
var gyazo_client = new Gyazo(gyazokey);


/**
 * 関数定義
 */

//投稿
function post(body,tags,files,user,callback){

	//TODO サービスごとにどうにか

	//Twitter
	var twitest = new twitter(config[user]['main']);
	//FIXME 雑コーディング
	var aaa = function(){};
	if (typeof config[user]['sub'] != "undefined") {
		var twitestsub = new twitter(config[user]['sub']);
		aaa = function(res){
			gyazo_client.upload(files.file.path)
			.then(function(gyazores){
				console.error(gyazores)
				twitterStatusesUpdate(twitestsub, res.text + ' ' + gyazores.data.permalink_url, [], null, function(){});
			})
			.catch(function(err){
				console.error(err); //err.stack
				twitterStatusesUpdate(twitestsub, res.text + ' .', [], null, function(){});
			});
		};
	}

	//PENDING 複数ファイル対応するか
	var value = files['file'];
	if(value.size > 0 && value.name != ''){
		fs.readFile(value.path, function (err, buf) {
			twitest.post('/media/upload.json', {media:buf}, function (err,res) {
				console.log(res);
				twitterStatusesUpdate(twitest,body,tags,res.media_id_string,aaa);
			});
		});
	} else {
		twitterStatusesUpdate(twitest,body,tags,null,aaa);
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
			//PENDING 重複投稿をどうにか	
			if (err.code = 187){
				params.status += ' .'
				twitterObj.post('/statuses/update.json', params, function (err,res) {
					console.log({tweet_respons:'*************************',
						res:res,
					});
					callback(res);
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
			callback(res);
		}
	});
}


/**
 * エクスポート
 */
module.exports = {
	post : post 
}
