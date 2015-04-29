/* global module */

'use strict';

//PENDING ユーティリティだけはブラウザから使うことを想定すべきか

/**
 * 日付をフォーマットする
 * @param  {Date}   date     日付
 * @param  {String} [format] フォーマット
 * @return {String}          フォーマット済み日付
 *
 */
function formatDate(date, format) {
	var i, length, milliSeconds;
	var dayOfWeek       = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	var localeDayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

	if (!format) {
		format = 'YYYY-MM-DD hh:mm:ss.SSS wd';
	}
	format = format.replace(/YYYY/g, date.getFullYear());
	format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
	format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
	format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
	format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
	format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
	if (format.match(/S/g)) {
		milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
		length = format.match(/S/g).length;
		for (i = 0; i < length; i++) {
			format = format.replace(/S/, milliSeconds.substring(i, i + 1));
		}
	}
	format = format.replace(/wd/g, dayOfWeek[date.getDay()]);
	format = format.replace(/WD/g, localeDayOfWeek[date.getDay()]);

	return format;
}

//テンプレート置換
function templateReplace(tpl, replace, replaceStrDelete) {
	var fill, found, key, target;
	var ret = tpl;

	if (replaceStrDelete) {
		//文字列から__[半角英数字(_含む)列]__探して重複取って控える
		found = tpl.match(/__\w+__/g).filter(function (x, i, self) {
			return self.indexOf(x) === i;
		});

		fill = function (filterArray, filterTarget) {
			return filterArray.filter(function (value) {
				return value !== filterTarget;
			});
		};
	}

	//replaceに入ってるもので置換
	for (key in replace) {
		if (replace.hasOwnProperty(key) && key.search(/^\w+$/) === 0) {
			ret = ret.split('__' + key + '__').join(replace[key]);
			if (replaceStrDelete) {
				//置換した __*＿ を控えから削除
				target = '__' + key + '__';
				found = fill(found, target);
			}
		}
	}

	//replaceにないの消す
	for (key in found) {
		//PENDING 消すんじゃなくてHTMLコメントにしようか？
		ret = ret.split(found[key]).join('');
	}

	return ret;
}


//階層構造あるObjectぐるぐるして 1次元のObjectに積む
function tree2flat(target, addObj, prefix, joinstr) {
	var key, vkey;
	if (!joinstr) {
		joinstr = '-';
	}

	for (key in addObj) {
		if (addObj.hasOwnProperty(key)) {
			vkey = key;
			if (prefix) {
				vkey = prefix + joinstr + key;
			}

			if (Object.prototype.toString.call(addObj[key]) === '[object Object]') {
				tree2flat(target, addObj[key], vkey, joinstr);
			} else if (Object.prototype.toString.call(addObj[key]) === '[object Date]') {
				//dateインスタンス PENDING 日付フォーマットせずにオブジェクト突っ込んでいいか？日付フォーマット引数受け取る？
				//target[vkey] = addObj[key];
				target[vkey] = formatDate(addObj[key]);
			} else if (Object.prototype.toString.call(addObj[key]) === '[object Function]') {
				//関数は無視
			} else {
				target[vkey] = addObj[key];
			}

		}
	}
	return target;
}


/*
 * エクスポート
 */
module.exports = {
	formatDate     : formatDate,
	tree2flat      : tree2flat,
	templateReplace: templateReplace
};
