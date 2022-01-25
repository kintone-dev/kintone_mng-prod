(function(){
  'use strict';
  /** データ連携 */
  // プロセス実行
  kintone.events.on('app.record.detail.process.proceed',　async function (event) {
    startLoad();
    // 
    endLoad();
    return event;
  });

  /** 実行関数 */
})();