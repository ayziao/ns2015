/* global module */
'use strict';

//テンプレート置換
function test_templateReplace() {
	console.info('test_templateReplace');

	var templateReplace = require('../lib/utility').templateReplace;

	var tpl = ' __othe__ テンプレート __aa_bb__  __cc-dd__ __日本語__ __body__ ほげほげ __footer__ __othe__ __othe__ __OTHER__ __other1__ __other2__';
	var re = {body: '本文', footer: 'フッタ', '日本語': 'Japanese', aa_bb: 'aabb', 'cc-dd': 'ccdd'};
	var mean = tpl.split("__body__").join('本文')
			.split("__footer__").join('フッタ')
			.split("__aa_bb__").join('aabb')
			.split("__othe__").join('')
			.split("__other1__").join('')
			.split("__other2__").join('')
			.split("__OTHER__").join('');

	var out = templateReplace(tpl, re, true);
	console.assert(out === mean, {test_templateReplace: 'テンプレート置換 変数消す', out: out, mean: mean});

	var mean2 = tpl.split("__body__").join('本文')
			.split("__footer__").join('フッタ')
			.split("__aa_bb__").join('aabb');

	var out2 = templateReplace(tpl, re);
	console.assert(out2 === mean2, {test_templateReplace: 'テンプレート置換 変数残す', out: out2, mean: mean2});

//	console.log(out);
//	console.log(out2);
}


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

	//console.log(target);

//	target = {debug: 332232};
//	addObj = {aaa: {bb1: 1, bb2: 2}, ccc: [1, 2, {hoge: 'piyo'}], f: function () {}};

}


module.exports = {
	test_templateReplace: test_templateReplace,
	test_tree2flat      : test_tree2flat
};
