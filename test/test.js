/* global require */
'use strict';

console.log('test');


//一時的な確認用コード なんか確認したらgistに書いておく
var __一時的な確認用コード = function () {
	console.log('date型');
	var date = new Date();
	console.log(date);
	console.log(Object.prototype.toString.call(date));
	console.log('###########################');
};
//__一時的な確認用コード();


var _グローバル調べ = function () {
	var i = '';
	for (i in global) {
		console.log(i);
	}

	console.log(module);

	console.log('###########################');
}
//_グローバル調べ();


function testRunner(module) {
	for (var key in module) {
		console.log(key);
		module[key]();
	}
}

testRunner(require('./utility'));
