(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    //クリップボードに請求先をコピーする
    var copy_cName = document.createElement('button');
    copy_cName.id = 'btn_copy_cName';
    copy_cName.innerText = '請求先コピー';
    copy_cName.onclick = function () {
      var clientName = (event.record.cName.value);
      if (execCopy(clientName)) {
        console.log('顧客名をコピーしました。\n案件管理の「請求先検索」に貼り付けてください。');
      } else {
        console.log('このブラウザでは対応していません。\n手動で顧客名をコピーするか、案件管理で請求先をもう一度検索してください。');
      }
    };
    kintone.app.record.getSpaceElement('btn_copy_cName').appendChild(copy_cName);
    return event;
  });

  kintone.events.on(['app.record.create.change.cName', 'app.record.edit.change.cName'], function (event) {
    event.record.BMC.value = event.record.cName.value;
    event.record.RRMC.value = event.record.cName.value;
    return event;
  });
})();