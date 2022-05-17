(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    var linkageBtn = setBtn('btn_linkage_sNum', 'シリアル管理連携');
    $('#' + linkageBtn.id).on('click', async function () {
      startLoad();
      // エラー処理

      // 更新用json作成
      let updateSnums = {};

      console.log(event.record);

      // シリアル管理連携


      // ログ作成

      endLoad();
    });

    return event;
  });

})();
