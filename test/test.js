/* global require */

'use strict';
console.log('test');

//一時的な確認用コード なんか確認したらgistに書いておく
var aaa = function () {
	console.log('date型');
	var date = new Date();
	console.log(date);
	console.log(Object.prototype.toString.call(date));
	console.log('###########################');
};
//aaa();


//TODO 画像静的ファイルディレクトリへ保存
//TODO readmeに↓から転記
//TODO 
//PENDING ドキュメントどうするか
//PENDING 

/*


■ニアスケイプ niascape
●ニアスケイプとは
個人向自己情報蓄機構

自分で作成したデータと自分が作成してないデータのお気に入りを蓄積して近いセンスの人とデータを交換してお気に入り度の高いものを拾ってくる機構
自分で作ったデータをセンスの近い人にレート設定してもらったものを一覧できるように

●タスクの進め方
休日にリファクタリングしてタスクを洗い出し小さいタスクをとっておいて平日ちまちま

●タスク
毎回	ソースコミット 作業メモコミット gist等へ部分登録

▼順次
個別ページ タグ追加機能
画像静的ファイルディレクトリへ保存
gyazo投稿をmpへ

個別ページよりタグ修正

開発タスク管理をどうするか考える ソースに書くか projectに書くか 
	ソースに書いてやる順番決めたもの上位はタスクにも書いておく

ユーティリティ単体テストファイル分ける
エクスポートぐるぐるする奴作る
モジュールぐるぐるしてfunction叩くの作る


リファクタリング
	コメント
		タスク
		説明文
		jsdoc
	ネスト取る
	FIXME

テーブル構造
	秘匿データと公開データ
	サービス設定は秘匿データ
	認証は秘匿データ
	siteは公開データ 公開鍵を含む

タイムラインはどのように表示するか
	最新をタイトルでリンク 古いのは日時ID

動的ページの場合は全文のハッシュをetagにする
サンプル書いてgistとかに投稿 「node.js twitter画像投稿」
https://www.value-domain.com/ バリュードメイン ニアスケイプのドメイン取る
トリムして最初の改行と最初の2連続改行が同じ位置であれば1行目はtitle
集計項目洗い出し ツイログのパクリとか
テーブル名に@使えるか @サイト名 使えないならsite_サイト名

▼調査が必要かどうか切り分ける
テンプレートちゃんとする
二重投稿防止
複数タグ対応 タグテーブル
リダイレクトにデバッグ振り分け入れる
タグを除外？？？
マルチポスト Twitter
画像投稿
マルチポスト gyazo
タグ修正
画像をDBにBLOBで突っ込んでみる 
画像表示について gyazoからダウンロードしてvar/tmp？
内部ディレクトリの振り分けをサブドメインからやるかディレクトリでやるかの設定 両方も可能にする？サブドメインのみの設定の時に@ユーザで来たら302？
テストプロジェクトの開発タスクをプロジェクト内のmemoに書いてあるのから拾う
twitterストリーム取り込み描いてみる
HTMLテンプレート
twitterstatusJSON保存 投稿で帰ってくるの
twitterstatusJSON保存 statusID指定1件読み込み
twitterstatusJSON保存 ユーザータイムライン読み込み
twitterstatusJSON保存 アーカイブ データ形式比較
twitterstatusJSON保存 他にAPIアクセス時に保存すべきなのあるか



●考
▼細かいの
	日時 タイトル 内容 検索用
	タイトルは最長256文字？(UTF16として1024バイト？)
	タグをどのように管理すべきか＞システムタグはなんもなし ユーザータグは#つける
	主たるデータはすべて日時でIDを持つ 内部IDをUUIDにすべきか


▼サイト全体
考
	進め方
		nodeでテストもなしにゴリゴリ実装しながら考える webサーバも全部書く
		設計固まったなと思ったらテスト書きながらPythonへ移植 主にモデル的な部分
	とりあえず欲しい機能
		1行目なんか書いてあって2行目空改行だったら1行目をタイトルとして扱う
		タグ考
			システムタグとユーザタグの扱いをどうするか テキストへのエクスポートをどうするか
			タグをtwitterのハッシュタグとして投稿
		Twitterに投稿したレスポンスの記録
		Twitterクライアントとしての機能について考える
	とりあえずなデータ構造
		サービスデータ
			サービス設定 サイトの構成がサブドメインかディレクトリ(@ユーザ)かとか
			デフォルトデータ
				テンプレート
		外部サービスデータ
			web全般 : url 内容 取得状況(投稿 ステータスID1件指定 ホームTL ユーザTL ふぁぼ RT)
			twitterユーザ : ユーザid 内容 プロテクトかどうか
			twitterユーザ遍歴 : ユーザid スクリーンネーム ディスプレイネーム アイコン bio プロテクトかどうか
			twitterステータス : ステータスID 内容
		ユーザデータ
			ユーザ : ユーザID ユーザ名 認証タイプ
			ユーザメール : ユーザID メールアドレス パスワード
			ユーザオーオース : ユーザID オーオースのなんか
			ユーザ2サイト ユーザID サイトID
			外部サービス連携 : サイトID 外部サイトID 外部サイト認証データ
			ユーザ設定 : キーバリュー
			外部ニアスケイプ連携
		サイトデータ
			サイト設定 : キーバリュー？ : サイトトップの設定,サイト所有ユーザ,
			プラグイン : ？ twitter mixi gyazo 
			ベースデータ : エントリID UTC日時 UTCマイクロ秒 タイトル タグ ユーザ？
			メディアデータ : エントリID BLOB 拡張子とかデータ形式を表すもの
			タイトル
			タグ
			検索
			統計
			コマンド : コマンド名 エントリid
			タイトルとして使っている数値 : 数値 コマンド登録やコマンド埋め込みがある場合はデータ登録しない
		サイトデータ外部連携データ
			Twitter
			gyazo？
	URL
		サイト.ドメイン/@サイト
		/id
		/タイトル
		コマンド データへコマンドを登録することで /search/検索語 みたいなの有効にする
			/?search=タイトルと本文に含まれる検索語 → /search/検索語
			/?search=タイトルに含まれる検索語&searchtype=title → /titlesearch/検索語
			/?search=タグ名?searchtype=tag → /tagssearch/検索語
			/?list=title → /titles
			/?list=tags → /tags
			/?plugin=twitter&timeline → /plugin/twitter/timeline → 
		数値だけの場合はコマンド登録なくてもリスト表示にする タイトルに使われている場合はメニュー等からのリンクはクエリ形式になる コマンド指定や埋め込みがあればクエリ形式にならない
			/2015 → /?list=2015
	考える事
		画像表示について
			gyazoからダウンロードしてvar/tmp？
		サムネイル画像とフルサイズ画像の取り扱いについて考える
			id.png?size=full id.jpg?size=200 id_200x200.gif tumb/id.jpg
	調査
		画像をDBにBLOBで突っ込んでみるか

投稿するやつ
	140文字超えたら
		テキストエリア赤くする
		送信できなくする
	投稿画面色つける

日付表示
	 197X
	 198X
	 199X
	 200X
	→201X
	  2010
	  2011
	  2012
	  2013
	  2014
	   →01 02 03 04 05 06 07 08 09 10 11 12
	    月のカレンダー
	    前月 次月 前年 10年前

▼タスクに切り出し前なやつ
権限チェックをどうするか どこでやるか
動的な設定変更を設定ファルでやるか？DBの設定テーブルでやるか？

サムネイル画像とフルサイズ画像の取り扱いについて考える id.png?size=full id.jpg?size=200 id_200x200.gif tumb/id.jpg

自動タグ
	システム
		マルチポスト サービス先
	ユーザ
		正規表現
		キーワード




テーブル作成	ユーザ 日時 タイトル タグ 内容
user
identifier
datetime
title
tags
body

テキストデータを記録する
テキストデータを分散コピーする
	twitter
テキストデータを共有保管する
バイナリデータを分散保管してパスを記録する
	gyazo
	flickr
	インスタグラム？
バイナリデータを保管する
バイナリデータを共有する
ユーザー振り分け
マルチポスト先管理

タグ
システムタグ #ユーザタグ

URL
ユーザ.ドメイン/ID?機能
ドメイン/@ユーザ/ID?機能
ドメイン/コンテンツ?機能
/



ニアスケイプデータ考
	ユーザデータ
		ベースデータ
			ID yyyymmddhhmmssuuunnn 20150130093151667123
			タイトル
			本文
			タグ
			ユーザタイムゾーン日時
			UTC日時？
		タイトル
		タグ
		全文検索
		投稿数
	システムデータ
		
	外部サイトデータ
		Twitter
			生データ
			統計用？
		gyazo


	テーブル考
		共通TwitterDB
			Row
				status_id user id val
				TLからかアーカイブからかのフラグを持つか？
			Tweet
				status_id
				date
				user id
				user_name
				screen_name
				text
				プロテクトか アーカイブからの場合Twiter認証本人じゃないとプロテクト
			NameLog
				名前やアイコンの遷移を追う 古いアイコンが消える場合の対処 S3取るかgyazoにぶっこむか gyazo怪しいファイルぶっこみアカウントを取るか
		Tweet2BaseData
			user
			data_id
			status_id
		ユーザDB
			BaseData
				identifier	投稿時のUTF時刻マイクロ秒から生成
				title	未入力の場合ロケール時刻より生成
				tags	タグ ユーザータグとシステムタグ？
				body	本文
				localeTimestamp	ユーザが設定しているロケール時刻での投稿日時




CREATE TABLE `test2` (
	`id`	NUMERIC,
	`val`	TEXT NOT NULL,
	PRIMARY KEY(id)
);



status_id
user_id
screen_name
text
created_at
YY
MM
DD
HH





 */


console.log('utility');

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
test_templateReplace();



//PENDING 設定ファイルを再起動せずに再読み込みできるようにするか
//PENDING テストランナーどうしよう


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
test_tree2flat();
