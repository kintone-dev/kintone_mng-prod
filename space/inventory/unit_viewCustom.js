(function () {
  'use strict';

  var events_ced = [
    'mobile.app.record.create.show',
    'mobile.app.record.edit.show',
    'mobile.app.record.detail.show',
    'app.record.detail.show',
    'app.record.edit.show',
    'app.record.create.show'
  ];
  kintone.events.on(events_ced, function (event) {
    //サプテーブル編集不可＆行の「追加、削除」ボタン非表示
    for(let i in event.record.mStockList.value) {
      event.record.mStockList.value[i].value.mCode.disabled = true;
      event.record.mStockList.value[i].value.mName.disabled = true;
      event.record.mStockList.value[i].value.mStock.disabled = true;
    }
    //[].forEach.call(document.getElementsByClassName("subtable-operation-gaia"), function(button){ button.style.display='none'; });
    setFieldShown('sys_unitAddress', false)

    function tabSwitch(onSelect) {
      switch (onSelect) {
        case '#拠点概要':
          setFieldShown('uCode', true);
          setFieldShown('uType', true);
          setFieldShown('uName', true);
          setFieldShown('uCharge', true);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('hBuildingName', false);
          setFieldShown('corpName', false);
          setFieldShown('mStockList', false);
          break;
        case '#拠点住所':
          setFieldShown('uCode', false);
          setFieldShown('uType', false);
          setFieldShown('uName', false);
          setFieldShown('uCharge', false);
          setFieldShown('receiver', true);
          setFieldShown('phoneNum', true);
          setFieldShown('zipcode', true);
          setFieldShown('prefectures', true);
          setFieldShown('city', true);
          setFieldShown('address', true);
          setFieldShown('hBuildingName', true);
          setFieldShown('corpName', true);
          setFieldShown('mStockList', false);
          break;
        case '#品目在庫一覧':
          setFieldShown('uCode', false);
          setFieldShown('uType', false);
          setFieldShown('uName', false);
          setFieldShown('uCharge', false);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('hBuildingName', false);
          setFieldShown('corpName', false);
          setFieldShown('mStockList', true);
          break;
      }
    }
    //タブメニュー作成
    tabMenu('tab_unit', ['拠点概要', '拠点住所', '品目在庫一覧']);
    //tab初期表示設定
    if (sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'));
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
    } else {
      tabSwitch('#拠点概要');
    }
    //タブ切り替え表示設定
    $('.tab_unit a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false; //aタグを無効にする
    });
    return event;
  });

  kintone.events.on('app.record.edit.show', function (event) {
    // 編集画面は、全フィールド編集不可で表示する
    event.record.uCode.disabled = true;
    event.record.uType.disabled = true;
    event.record.uName.disabled = true;
    event.record.uCharge.disabled = true;
    event.record.receiver.disabled = true;
    event.record.phoneNum.disabled = true;
    event.record.zipcode.disabled = true;
    event.record.prefectures.disabled = true;
    event.record.city.disabled = true;
    event.record.address.disabled = true;
    event.record.hBuildingName.disabled = true;
    event.record.corpName.disabled = true;
    return event;
  });

  kintone.events.on('app.record.edit.change.editinfo', function (event) {

    // 情報編集チェックボックスが on でなければ、編集させない
    if (event.record.editinfo.value[0] === '情報編集') {
      // チェックボックスがチェックされている
      event.record.uType.disabled = false;
      event.record.uName.disabled = false;
      event.record.uCharge.disabled = false;
      event.record.receiver.disabled = false;
      event.record.phoneNum.disabled = false;
      event.record.zipcode.disabled = false;
      event.record.prefectures.disabled = false;
      event.record.city.disabled = false;
      event.record.address.disabled = false;
      event.record.hBuildingName.disabled = false;
      event.record.corpName.disabled = false;
    } else {
      // チェックボックスがチェックされていない
      event.record.uCode.disabled = true;
      event.record.uType.disabled = true;
      event.record.uName.disabled = true;
      event.record.uCharge.disabled = true;
      event.record.receiver.disabled = true;
      event.record.phoneNum.disabled = true;
      event.record.zipcode.disabled = true;
      event.record.prefectures.disabled = true;
      event.record.city.disabled = true;
      event.record.address.disabled = true;
      event.record.hBuildingName.disabled = true;
      event.record.corpName.disabled = true;
    }
    return event;
  });


  kintone.events.on('app.record.edit.submit', function (event) {
    // 保存ボタンが押されたら、情報編集チェックボックスをクリア
    event.record.editinfo.value = [];
    return event;
  });

  var events_cd = ['app.record.create.show', 'app.record.detail.show'];
  kintone.events.on(events_cd, function (event) {
    // レコード追加＆詳細閲覧時は「情報編集」フィールドは非表示
    kintone.app.record.setFieldShown('editinfo', false);
  });
})();