(function () {
  'use strict';

  kintone.events.on('app.record.create.show', function (event) {
    // event.record.prjNum.disabled = true;
    //コピー元の「prjNum」の値をsessionStorageの値を代入
    // event.record.prjNum.value = sessionStorage.getItem('prjNum');
    // event.record.shipType.value = sessionStorage.getItem('shipType');
    // event.record.tarDate.value = sessionStorage.getItem('tarDate');
    // event.record.instName.value = sessionStorage.getItem('instName');
    // event.record.instName.lookup = true;
    console.log(sessionStorage.getItem('is_copy_shipdata'));
    // データ複製ボタン受取
    if(sessionStorage.getItem('is_copy_shipdata')){
      event.record=JSON.parse(sessionStorage.getItem('copy_shipdata'));
      console.log(event);
      sessionStorage.setItem('copy_shipdata',false);
      // sessionStorage.removeItem('is_copy_shipdata');
    }

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
    sessionStorage.removeItem('copy_shipdata');
    return event;
  });
  kintone.events.on('app.record.create.submit.success', function(event){
    sessionStorage.removeItem('is_copy_shipdata');
    return event;
  })
})();