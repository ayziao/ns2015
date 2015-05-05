/* global require, module, global */
/*eslint camelcase:0, vars-on-top:0 */
'use strict';

console.log('test');

var ___雛型 = function () {
	console.log(this);
};
//_雛型();


//一時的な確認用コード なんか確認したらgistに書いておく
var __一時的な確認用コード = function () {
	
	var aaa = {};
	
	aaa.bbb = 1;
	
	console.log(aaa);
	console.log(typeof ccc);
	console.log(typeof ccc == typeof ddd);
	

	
	console.log('###########################');
	
};
__一時的な確認用コード();



var _型チェック = function () {
	console.log('Date型');
	var date = new Date();
	console.log(date);
	console.log(Object.prototype.toString.call(date));
	console.log(date instanceof Date);
	
	console.log(Date.prototype);
	
	console.log('Hoge型');
	var Hoge = function Hoge () {
		var obj;
		obj = {};
		obj.piyo = 'piyo';
//		return obj;
		this.obj = obj;
//		this.toString = function(){
//			return '[object Hoge]';
//		}
	};
	
	Hoge.prototype.toString = function(){
			return '[object Hoge]';
		};
	
	var hoge = new Hoge ();
	
	console.log(Object.prototype.toString.call(hoge));
	console.log(hoge.toString());
	console.log(hoge);
	
	console.log(hoge instanceof Hoge);
	console.log(hoge instanceof Object);

};
//_型チェック();



var _グローバル調べ = function () {
	var i = '';
	for (i in global) {
		console.log(i);
	}

	console.log(module);

	console.log('###########################');
};
//_グローバル調べ();


var _this調べ = function () {
	
	console.log('_this調べ');
	
	var gdgdgd = function () {
		gkgkgkg();
		console.log(this);
	};

	var gkgkgkg = function () {
		console.log(this);
	};

	console.log(this);
	gdgdgd();

	function Bbb() {
		var aaa = 1;
		this.aaa = aaa;
		
		this.ccc = function () {
			var fff = 1;
			console.log('Bbb');
			console.log(this);
			return fff + aaa;
		};
	}

	var cc = new Bbb();
	cc.ccc();


//メソッド呼び出しパターン
	var myObject = {
		value: 10,
		show: function () {
			console.log(this);
			console.log(this.value);
		}
	};
	myObject.show(); // 10

	//this.aaa = 'aaa';


	//var gegege = 'gegege';

	console.log(this);
};
//_this調べ();


var _インスタンス生成調べ = function () {

	function Piyo() {
		this.obj = 'piyo';
		//return this;
	}

	function Dog(name, cry) {
		this.name = name;
		this.bark = function () {
			console.log(cry);
		};
	}
	var poti = new Dog('inu','wan');

	console.log(Object.prototype.toString.call(poti));
	console.log(typeof (poti));

	var piyopiyo = new Piyo();
	console.log(Object.prototype.toString.call(piyopiyo));


	console.log(this);
};
//_インスタンス生成調べ();


var _module調べ = function () {
	console.log(module);
};
//_module調べ();



function testRunner(modulePath) {
	//TODO ディレクトリぐるぐるして全部実行
	var module = require(modulePath);
	console.log(modulePath);
//	console.log(module);
	for (var key in module) {
		console.log(key);
		module[key]();
	}
}
testRunner('./utility');
