(function () {
  'use strict';
  kintone.events.on('app.record.create.show', function (event) {
    //キャンセルした時の処理
    var cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
    cancel_btn[0].addEventListener('click', function () {
      window.close();
    }, false);
    return event;
  });

  kintone.events.on('app.record.create.submit', function (event) {
    var save_btn = document.getElementsByClassName('gaia-ui-actionmenu-save');
    save_btn[0].addEventListener('click', function () {
      window.close();
    }, true);
  });
})();