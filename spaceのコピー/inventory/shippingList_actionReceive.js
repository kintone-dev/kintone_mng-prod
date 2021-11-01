(function () {
  'use strict';

  kintone.events.on('app.record.create.show', function (event) {
    event.record.prjNum.disabled = true;
    //コピー元の「prjNum」の値をsessionStorageの値を代入
    event.record.prjNum.value = sessionStorage.getItem('prjNum');
    event.record.shipType.value = sessionStorage.getItem('shipType');
    event.record.tarDate.value = sessionStorage.getItem('tarDate');
    event.record.instName.value = sessionStorage.getItem('instName');
    event.record.instName.lookup = true;
    //キャンセルした時の処理
    var cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
    cancel_btn[0].addEventListener('click', function () {
      window.close();
    }, false);
    //反映したあとはsessionStorageの中身を削除
    sessionStorage.removeItem('prjNum');
    sessionStorage.removeItem('shipType');
    sessionStorage.removeItem('tarDate');
    sessionStorage.removeItem('instName');
    return event;
  });

})();