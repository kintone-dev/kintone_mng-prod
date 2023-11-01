(function () {
  'use strict';

  /*
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
  */

  kintone.events.on(['app.record.create.change.cName', 'app.record.edit.change.cName'], function (event) {
    event.record.BMC.value = event.record.cName.value;
    event.record.RRMC.value = event.record.cName.value;
    return event;
  });
  /**
   * Adminパスワード自動生成機能
   */
  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function (event){
    // パスワード自動生成ボタン
    let createAdminPassword = setBtn('btn_createAdminPassword', 'パスワード生成');
    $('#' + createAdminPassword.id).on('click', function () {
      let eRecord = kintone.app.record.get();
      eRecord.record.adminPassword.value = pw_generator(12);
      kintone.app.record.set(eRecord);
    });
    // 組織コード自動生成ボタン
    let createOrgCode = setBtn('btn_createOrgCode', '組織コード生成');
    $('#' + createOrgCode.id).on('click', function () {
      let eRecord = kintone.app.record.get();
      eRecord.record.orgCode.value = string_generator(8);
      kintone.app.record.set(eRecord);
    });
  });
  kintone.events.on('app.record.detail.show', function (event){
    let createPW_header = setBtn_header('btn_createPW_header', 'パスワード生成ツール');
    $('#' + createPW_header.id).on('click', function () {
      let mw_password = mWindow();
      mw_password.contents.innerHTML = '<p>生成したパスワード：</p>' + 
      `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>` + 
      `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>` + 
      `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>`;
      $('#mwFrame').fadeIn();
    });
  });
})();