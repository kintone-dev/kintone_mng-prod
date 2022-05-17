(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    setFieldShown('sys_sn_recordId', false);

    var linkageBtn = setBtn('btn_linkage_sNum', 'シリアル管理連携');
    $('#' + linkageBtn.id).on('click', async function () {
      startLoad();
      // エラー処理

      // 更新用json作成
      let updateSnums = {};

      // シリアル管理連携


      // ログ作成

      endLoad();
    });

    return event;
  });

  kintone.events.on(['app.record.create.show','app.record.edit.show'], function(event) {
    setSpaceShown('btn_linkage_sNum','individual','none');
  });
})();
