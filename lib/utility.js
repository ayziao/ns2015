'use strict';

/**
 * 日付をフォーマットする
 * @param  {Date}   date     日付
 * @param  {String} [format] フォーマット
 * @return {String}          フォーマット済み日付
 * 
 */
var formatDate = function (date, format) {
	if (!format) {
		format = 'YYYY-MM-DD hh:mm:ss.SSS';
	}
	format = format.replace(/YYYY/g, date.getFullYear());
	format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
	format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
	format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
	format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
	format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
	if (format.match(/S/g)) {
		var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
		var length = format.match(/S/g).length;
		for (var i = 0; i < length; i++)
			format = format.replace(/S/, milliSeconds.substring(i, i + 1));
	}
	return format;
};



//TODO 文字列から__*__探して控える Objectに入ってるもので置換 Objectにないの消す

//階層構造あるObjectぐるぐるして 1次元のObjectに積む
function tree2flat(target, addObj, prefix, joinstr) {

	if (!joinstr) {
		joinstr = '-';
	}
	for (var key in addObj) {
		if (addObj.hasOwnProperty(key)) {
			var vkey = key;
			if (prefix) {
				vkey = prefix + joinstr + key;
			}

			if (Object.prototype.toString.call(addObj[key]) === '[object Object]') {
				tree2flat(target, addObj[key], vkey, joinstr);
			} else if (Object.prototype.toString.call(addObj[key]) === '[object Date]') {
				target[vkey] = formatDate(addObj[key]);
			} else {
				target[vkey] = addObj[key];
			}

		}
	}

console.log(target);
	
	return target;
}


/*
 * エクスポート
 */
module.exports = {
	formatDate: formatDate,
	tree2flat : tree2flat
};
