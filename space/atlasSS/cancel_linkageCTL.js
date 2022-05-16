(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    // ボタン作成
    setSpaceShown('btn_linkage_sNum','individual','none');

    return event;
  });
})();
