(function(){
  'use strict';
  /** イベント　通常イベント発生時 */
  // 一覧表示
  kintone.events.on('app.record.index.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */
    endLoad();
    return event;
  });
  // 新規レコード作成
  kintone.events.on('app.record.create.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** アクション受領時 start */
    /** アクション受領時 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    endLoad();
    return event;
  });
  // レコード編集
  kintone.events.on('app.record.edit.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    endLoad();
    return event;
  });
  // レコード詳細閲覧
  kintone.events.on('app.record.detail.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    endLoad();
    return event;
  });

  /** イベント　プロセス進行 */
  kintone.events.on('app.record.detail.process.proceed', function (event) {
    startLoad();
    //
    endLoad();
    return event;
  });

  /** イベント 項目変更 */
  //
  kintone.events.on('app.record.create.change.', function(event){
    startLoad();
    //
    endLoad();
    return event;
  });

  /** 実行関数 */
})();