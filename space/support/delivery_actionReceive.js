(function() {
  'use strict';
  kintone.events.on('app.record.create.show', function(event) {
    event.record.sup_aNum.disabled=true;
    //コピー元の「prj_aNum」の値をsessionStorageの値を代入
    event.record.sup_aNum.value = sessionStorage.getItem('supNum');
    event.record.bName.value = sessionStorage.getItem('bName');
    event.record.bName.lookup=true;
    //キャンセルした時の処理
    var cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
    cancel_btn[0].addEventListener('click', function() {
        window.close();
    }, false);
    //反映したあとはsessionStorageの中身を削除
    //sessionStorage.clear();
    sessionStorage.removeItem('supNum');
    sessionStorage.removeItem('bName');
    return event;
  });
})();