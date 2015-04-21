'use strict';
console.log('test');

//一時的なテストコード
var aaa = function () {
	var date = new Date();
	console.log(Object.prototype.toString.call(date));
	console.log(Object.prototype.toString.call(date));
	console.log(date);
};
//aaa();


//PENDING 設定ファイルを再起動せずに再読み込みできるようにするか



//階層構造あるObjectぐるぐるして 1次元のObjectに積む
function test_tree2flat() {
	console.info('test_tree2flat');
	var tree2flat = require('../lib/utility').tree2flat;
	var formatDate = require('../lib/utility').formatDate;

	var target = {};
	var addObj = {};

	addObj = {str: 'str'};
	tree2flat(target, addObj);
	console.assert(target.str === 'str', '文字列追加');

	addObj = {num: 0};
	tree2flat(target, addObj);
	console.assert(target.num === 0, '数値追加');

	addObj = {tree: {str: 'str2', num: 1}};
	tree2flat(target, addObj);
	console.assert(target['tree-str'] === 'str2', '階層構造オブジェクト追加');
	console.assert(target['tree-num'] === 1, '階層構造オブジェクト追加');

	addObj = {f: function () {
		}};
	tree2flat(target, addObj);
	console.assert(!target['f'], '関数は追加しない');

	var date = new Date();
	addObj = {date: date};
	tree2flat(target, addObj);
	console.assert(target['date'] === formatDate(date), {'日時': target['date']});
	
	//TOOD プレフィックステスト
	//TODO 区切り文字テスト
	//TODO 2階層以上テスト
	//TODO 配列テスト

	console.log(target);

//	target = {debug: 332232};
//	addObj = {aaa: {bb1: 1, bb2: 2}, ccc: [1, 2, {hoge: 'piyo'}], f: function () {}};

}

test_tree2flat();
