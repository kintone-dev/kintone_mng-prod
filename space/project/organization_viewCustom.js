(function () {
  'use strict';

  kintone.events.on(['app.record.create.change.cName', 'app.record.edit.change.cName'], function (event) {
    event.record.BMC.value = event.record.cName.value;
    event.record.RRMC.value = event.record.cName.value;
    return event;
  });
  /**
   * Adminパスワード自動生成機能
   */
  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function (event){
    // adminアカウントを常時変更可能にする
    event.record.adminName.disabled = false;
    event.record.adminAccount.disabled = false;
    event.record.instName.disabled = false;
    event.record.instAccount.disabled = false;

    // 組織コード生成ボタン
    // let createOrgCode = setBtn('btn_createOrgCode', '組織コード生成/更新');
    // $('#' + createOrgCode.id).on('click', function () {
    //   let eRecord = kintone.app.record.get();
    //   eRecord.record.orgCode.value = string_generator(8);
    //   kintone.app.record.set(eRecord);
    // });

    // パスワード生成ボタン
    let createAdminPassword = setBtn('btn_createAdminPassword', 'パスワード生成/更新');
    $('#' + createAdminPassword.id).on('click', function () {
      let eRecord = kintone.app.record.get();
      eRecord.record.adminPassword.value = pw_generator(12);
      kintone.app.record.set(eRecord);
    });
    return event;
  });
  kintone.events.on('app.record.detail.show', function (event){
    // パスワード生成ツール(Adminパスワード横)
    let createPW_header = setBtn('btn_createAdminPassword', 'パスワード生成ツール');
    $('#' + createPW_header.id).on('click', function () {
      let mw_password = mWindow();
      mw_password.contents.innerHTML = '<p>生成したパスワード：</p>' + 
      `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>` + 
      `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>` + 
      `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>`;
      $('#mwFrame').fadeIn();
    });
    // パスワード生成ツール(header)
    // let createPW_header = setBtn_header('btn_createPW_header', 'パスワード生成ツール');
    // $('#' + createPW_header.id).on('click', function () {
    //   let mw_password = mWindow();
    //   mw_password.contents.innerHTML = '<p>生成したパスワード：</p>' + 
    //   `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>` + 
    //   `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>` + 
    //   `<p><input type="text" id="generatedPassword" value="${pw_generator(12)}" /></p>`;
    //   $('#mwFrame').fadeIn();
    // });
  });
})();