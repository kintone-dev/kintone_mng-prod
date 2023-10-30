(function () {
  'use strict';

  kintone.events.on('app.record.create.show', function (event) {
    //コピー元の「prjNum」の値をsessionStorageの値から代入
    event.record.prjNum.value = sessionStorage.getItem('prjNum');
    event.record.bnName.value = sessionStorage.getItem('unknowINST');
    event.record.bName.value = sessionStorage.getItem('unknowINST');
    if(sessionStorage.getItem('setShown')=='disable'){
      event.record.bnName.disabled = true;
      event.record.bName.disabled = true;
    }
    //キャンセルした時の処理
    var cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
    cancel_btn[0].addEventListener('click', function () {
      window.close();
    }, false);

    //反映したあとはsessionStorageの中身を削除
    //sessionStorage.clear();
    sessionStorage.removeItem('prjNum');
    sessionStorage.removeItem('unknowINST');
    sessionStorage.removeItem('setShown');
    return event;
  });

  kintone.events.on('app.record.create.submit', function (event) {
    var save_btn = document.getElementsByClassName('gaia-ui-actionmenu-save');
    save_btn[0].addEventListener('click', function () {
      window.close();
    }, true);
  });
})();
