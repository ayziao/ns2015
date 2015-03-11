//ニアスケイプモジュール

//文字列と表示形式を受け取ってコールバックに渡す

//コンテント取得
function getContent(str,type,callback){
	callback(null,'ハロー');
}

//投稿
module.exports = {
	getContent : getContent
}
