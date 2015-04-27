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

var _this調べ = function () {
	var gdgdgd = function () {
		gkgkgkg();
		console.log(this);
	}

	var gkgkgkg = function () {
		console.log(this);
	}

	console.log(this);
	gdgdgd();

	function bbb() {
		var aaa = 1;

		return function () {
			var fff = 1;
			console.log(this);

		};
	}

	var cc = new bbb();
	cc();


//メソッド呼び出しパターン
	var myObject = {
		value: 10,
		show: function () {
			console.log(this);
			console.log(this.value);
		}
	};
	myObject.show(); // 10

	this.aaa = 'aaa';


	var gegege = "gegege";

	console.log(this);
};
//_this調べ();

var _雛型 = function () {
	
};
//_雛型();



function testRunner(module) {
	for (var key in module) {
		console.log(key);
		module[key]();
	}
}

testRunner(require('./utility'));
