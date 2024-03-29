(function () {
  'use strict';

  kintone.events.on(['app.record.create.change.editMC', 'app.record.edit.change.editMC', 'app.record.create.show', 'app.record.edit.show'], function (event) {
    var editmc = event.record.editMC.value;

    //請求先はずっと編集不可
    event.record.cName.disabled = true;

    //チェックボックス条件
    if (editmc.includes('管理対象外')) {
      event.record.BMC.disabled = false;
      event.record.RRMC.disabled = false;
      event.record.BMC.value = "";
      event.record.RRMC.value = "";
    } else if (editmc[0] == "建物管理" && editmc[1] == "賃貸管理") {
      event.record.BMC.disabled = false;
      event.record.RRMC.disabled = false;
    } else if (editmc.includes('建物管理')) {
      event.record.BMC.disabled = false;
      event.record.RRMC.disabled = true;
    } else if (editmc.includes('賃貸管理')) {
      event.record.BMC.disabled = true;
      event.record.RRMC.disabled = false;
    } else {
      event.record.BMC.disabled = true;
      event.record.RRMC.disabled = true;
    }

    return event;
  });
  kintone.events.on('app.record.edit.show', function(event){
    event.record.bnName.disabled=true;
    return event;
  });
  kintone.events.on(['app.record.create.show', 'app.record.detail.show', 'app.record.edit.show'], function (event) {
    event.record.cSales.disabled = false;
    event.record.prjNum.disabled = true;
    setFieldShown('sys_address', false);
    function tabSwitch(onSelect) {
      switch (onSelect) {
        case '#設置先概要':
          setFieldShown('orgName', true);
          setFieldShown('bnName', true);
          setFieldShown('bName', true);
          setFieldShown('editMC', true);
          setFieldShown('cName', true);
          setFieldShown('BMC', true);
          setFieldShown('RRMC', true);
          setFieldShown('bMemo', true);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('kittingCorp', false);
          setFieldShown('instCorp', false);
          setFieldShown('instDate', false);
          setFieldShown('instDDday', false);
          setFieldShown('propertieNum', false);
          setFieldShown('instedNum', false);
          setFieldShown('sWarranty', false);
          setFieldShown('eWarranty', false);
          setFieldShown('warranty', false);
          break;
        case '#設置先住所':
          setFieldShown('orgName', false);
          setFieldShown('bnName', false);
          setFieldShown('bName', false);
          setFieldShown('editMC', false);
          setFieldShown('cName', false);
          setFieldShown('BMC', false);
          setFieldShown('RRMC', false);
          setFieldShown('bMemo', false);
          setFieldShown('receiver', true);
          setFieldShown('phoneNum', true);
          setFieldShown('zipcode', true);
          setFieldShown('prefectures', true);
          setFieldShown('city', true);
          setFieldShown('address', true);
          setFieldShown('kittingCorp', false);
          setFieldShown('instCorp', false);
          setFieldShown('instDate', false);
          setFieldShown('instDDday', false);
          setFieldShown('propertieNum', false);
          setFieldShown('instedNum', false);
          setFieldShown('sWarranty', false);
          setFieldShown('eWarranty', false);
          setFieldShown('warranty', false);
          break;
        case '#設置情報':
          setFieldShown('orgName', false);
          setFieldShown('bnName', false);
          setFieldShown('bName', false);
          setFieldShown('editMC', false);
          setFieldShown('cName', false);
          setFieldShown('BMC', false);
          setFieldShown('RRMC', false);
          setFieldShown('bMemo', false);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('kittingCorp', true);
          setFieldShown('instCorp', true);
          setFieldShown('instDate', true);
          setFieldShown('instDDday', true);
          setFieldShown('propertieNum', true);
          setFieldShown('instedNum', true);
          setFieldShown('sWarranty', true);
          setFieldShown('eWarranty', true);
          setFieldShown('warranty', true);
          break;
      }
    }
    tabMenu('tab_inst', ['設置先概要', '設置先住所', '設置情報']);
    //tab初期表示設定
    if (sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'));
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
    } else {
      tabSwitch('#設置先概要');
    }
    $('.tab_inst a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false;
    });
  });
  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function (event) {
    $('#' + newORG.id).on('click', function () {
      // createNewREC(, 'prjNum', prjNumValue); // 実行内容例
      window.open('https://accel-lab.cybozu.com/k/' + sysid.PM.app_id.organization + '/edit', Math.random() + '-newWindow', 'scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=1000,height=600,left=350,top=250');
    });
    return event;
  });
})();
