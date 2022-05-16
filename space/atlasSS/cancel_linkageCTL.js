(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    // ボタン作成
    var linkageBtn = setBtn('btn_linkage_sNum', 'シリアル管理連携');
    $('#' + linkageBtn.id).on('click', async function () {
      console.log(1);
    });

    return event;
  });
})();
