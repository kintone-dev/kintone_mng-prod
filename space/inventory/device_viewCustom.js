(function () {
  'use strict';

  var events_ced = [
    'mobile.app.record.create.show',
    'mobile.app.record.edit.show',
    'mobile.app.record.detail.show',
    'app.record.create.show',
    'app.record.detail.show',
    'app.record.edit.show'
  ];
  kintone.events.on(events_ced, function (event) {
    //サプテーブル編集不可＆行の「追加、削除」ボタン非表示
    for(let i in event.record.uStockList.value) {
      event.record.uStockList.value[i].value.uCode.disabled = true;
      event.record.uStockList.value[i].value.uName.disabled = true;
      event.record.uStockList.value[i].value.uStock.disabled = true;
    }
    //[].forEach.call(document.getElementsByClassName("subtable-operation-gaia"), function(button){ button.style.display = 'none'; });
    $('.subtable-5524711').find('.subtable-operation-gaia').css('display','none');
    function subtableControl(params) {
      for(let i in event.record.uStockList.value) {
        event.record.uStockList.value[i].value.uCode.disabled = true;
        event.record.uStockList.value[i].value.uName.disabled = true;
        event.record.uStockList.value[i].value.uStock.disabled = true;
      }
      [].forEach.call(document.getElementsByClassName("subtable-operation-gaia"), function(button){ button.style.display = 'none'; });
    }
    //tabメニューの選択肢による表示設定
    function tabSwitch(onSelect) {
      switch (onSelect) {
        case '#品目情報':
          setFieldShown('mName', true);
          setFieldShown('mCode', true);
          setFieldShown('mNickname', true);
          setFieldShown('mType', true);
          setFieldShown('mVendor', true);
          setFieldShown('mClassification', true);
          setFieldShown('warranty', true);
          setFieldShown('mMemo', true);
          setFieldShown('mCostUpdate', false);
          setFieldShown('deviceCost', false);
          setFieldShown('deviceCost_foreign', false);
          setFieldShown('importExpenses', false);
          setFieldShown('developCost', false);
          setFieldShown('totalStock', false);
          setFieldShown('uStockList', false);
          setFieldShown('packageComp', false);
          break;
        case '#在庫情報':
          setFieldShown('mName', false);
          setFieldShown('mCode', false);
          setFieldShown('mNickname', false);
          setFieldShown('mType', false);
          setFieldShown('mVendor', false);
          setFieldShown('mClassification', false);
          setFieldShown('warranty', false);
          setFieldShown('mMemo', false);
          setFieldShown('mCost', false);
          setFieldShown('mCostUpdate', false);
          setFieldShown('deviceCost', false);
          setFieldShown('deviceCost_foreign', false);
          setFieldShown('importExpenses', false);
          setFieldShown('developCost', false);
          setFieldShown('totalStock', true);
          setFieldShown('uStockList', true);
          setFieldShown('packageComp', false);
          break;
        case '#原価情報':
          setFieldShown('mName', false);
          setFieldShown('mCode', false);
          setFieldShown('mNickname', false);
          setFieldShown('mType', false);
          setFieldShown('mVendor', false);
          setFieldShown('mClassification', false);
          setFieldShown('warranty', false);
          setFieldShown('mMemo', false);
          setFieldShown('mCost', true);
          setFieldShown('mCostUpdate', true);
          setFieldShown('deviceCost', true);
          setFieldShown('deviceCost_foreign', true);
          setFieldShown('importExpenses', true);
          setFieldShown('developCost', true);
          setFieldShown('totalStock', false);
          setFieldShown('uStockList', false);
          setFieldShown('packageComp', false);
          break;
        case '#パッケージ構成':
          setFieldShown('mName', false);
          setFieldShown('mCode', false);
          setFieldShown('mNickname', false);
          setFieldShown('mType', false);
          setFieldShown('mVendor', false);
          setFieldShown('mClassification', false);
          setFieldShown('warranty', false);
          setFieldShown('mMemo', false);
          setFieldShown('mCost', false);
          setFieldShown('mCostUpdate', false);
          setFieldShown('deviceCost', false);
          setFieldShown('deviceCost_foreign', false);
          setFieldShown('importExpenses', false);
          setFieldShown('developCost', false);
          setFieldShown('totalStock', false);
          setFieldShown('uStockList', false);
          setFieldShown('packageComp', true);
          break;
      }
    }
    //タブメニュー作成
    tabMenu('tab_inv', ['品目情報', '在庫情報', '原価情報', 'パッケージ構成']);
    //tab初期表示設定
    if (sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'));
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
    } else {
      tabSwitch('#品目情報');
    }
    //タブ切り替え表示設定
    $('.tab_inv a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false; //aタグを無効にする
    });
    event.record.totalStock.disabled = true;
    event.record.mCost.disabled = true;
    event.record.mCostUpdate.disabled = true;
    event.record.deviceCost.disabled = true;
    event.record.importExpenses.disabled = true;
    event.record.developCost.disabled = true;
    return event;
  });

  kintone.events.on('app.record.edit.show', function (event) {
    // 編集画面は、全フィールド編集不可で表示する
    event.record.mName.disabled = true;
    event.record.mImg.disabled = true;
    event.record.mCode.disabled = true;
    event.record.mType.disabled = true;
    event.record.mVendor.disabled = true;
    event.record.mNickname.disabled = true;
    event.record.warranty.disabled = true;
    event.record.mClassification.disabled = true;
    for(let i in event.record.packageComp.value) {
      event.record.packageComp.value[i].value.pc_mVendor.disabled = true;
      event.record.packageComp.value[i].value.pc_mType.disabled = true;
      event.record.packageComp.value[i].value.pc_mName.disabled = true;
      event.record.packageComp.value[i].value.pc_Num.disabled = true;
      event.record.packageComp.value[i].value.pc_mNickname.disabled = true;
      event.record.packageComp.value[i].value.pc_mCode.disabled = true;
    }
    return event;
  });

  kintone.events.on('app.record.edit.change.editinfo', function (event) {
    // 情報編集チェックボックスが on でなければ、編集させない
    if (event.record.editinfo.value[0] === '情報編集') {
      // チェックボックスがチェックされている
      event.record.mName.disabled = false;
      event.record.mImg.disabled = false;
      event.record.mType.disabled = false;
      event.record.mVendor.disabled = false;
      event.record.mNickname.disabled = false;
      event.record.warranty.disabled = false;
      event.record.mClassification.disabled = false;
      for(let i in event.record.packageComp.value) {
        event.record.packageComp.value[i].value.pc_Num.disabled = false;
        event.record.packageComp.value[i].value.pc_mCode.disabled = false;
      }
    } else {
      // チェックボックスがチェックされていない
      event.record.mName.disabled = true;
      event.record.mImg.disabled = true;
      event.record.mCode.disabled = true;
      event.record.mType.disabled = true;
      event.record.mVendor.disabled = true;
      event.record.mNickname.disabled = true;
      event.record.warranty.disabled = true;
      event.record.mClassification.disabled = true;
      for (let i in event.record.packageComp.value) {
        event.record.packageComp.value[i].value.pc_mVendor.disabled = true;
        event.record.packageComp.value[i].value.pc_mType.disabled = true;
        event.record.packageComp.value[i].value.pc_mCode.disabled = true;
        event.record.packageComp.value[i].value.pc_mName.disabled = true;
        event.record.packageComp.value[i].value.pc_mNickname.disabled = true;
        event.record.packageComp.value[i].value.pc_Num.disabled = true;
      }
    }
    return event;
  });

  kintone.events.on('app.record.edit.submit', function (event) {
    // 保存ボタンが押されたら、情報編集チェックボックスをクリア
    event.record.editinfo.value = [];
    if (event.record.mType.value == 'パッケージ品') {
      if (event.record.mClassification.value != '非在庫') {
        event.record.mClassification.error = '品目区分がパッケージ品の場合、取扱区分を非在庫にしてください。';
      }
    }
    return event;
  });

  var events_cd = ['app.record.create.show', 'app.record.detail.show'];
  kintone.events.on(events_cd, function (event) {
    // レコード追加＆詳細閲覧時は「情報編集」フィールドは非表示
    setFieldShown('editinfo', false);
    return event;
  });

  // 品目区分における品目コード制御
  kintone.events.on(['app.record.create.change.mType'], function(event){
    var mcode=event.record.mCode;
    var mtype=event.record.mType;
    if(mtype.value=='パッケージ品'){
      if(mcode.value==undefined){
        mcode.value='pkg_';
      }
      else if(!mcode.value.match('pkg_') && !mcode.value.match('ns_')){
        mcode.value='pkg_'+mcode.value;
      }
      else if(!mcode.value.match('pkg_') && mcode.value.match('ns_')){
        mcode.value='ns_pkg_'+mcode.value.substr(3, mcode.value.length);
      }
    }else{
      if(mcode.value!=undefined){
        if(mcode.value.match('pkg_')){
          mcode.value=mcode.value.replace('pkg_','');
        }
      }
    }
    return event;
  });

  // 取扱区分における品目コード制御
  kintone.events.on(['app.record.create.change.mClassification'], function(event){
    var mcode=event.record.mCode;
    var mclassification=event.record.mClassification;
    if(mclassification.value=='非在庫'){
      if(mcode.value==undefined){
        mcode.value='ns_';
      }
      else if(!mcode.value.match('ns_')){
        mcode.value='ns_'+mcode.value;
      }
    }else{
      if(mcode.value!=undefined){
        if(mcode.value.match('ns_')){
          mcode.value=mcode.value.replace('ns_','');
        }
      }
    }
    return event;
  });

  // 拠点管理から在庫情報取得
  kintone.events.on('app.record.index.show', function(event){
    var sync_kintone = setBtn_index('btn_sync_kintone', '在庫管理連携');

    $('#' + sync_kintone.id).on('click', async function () {
      startLoad();
      let deviceRecords
      let unitRecords
      try{
        // 商品全取得
        deviceRecords = (await getRecords({app: sysid.INV.app_id.device})).records;
        // 拠点全取得
        unitRecords = (await getRecords({app: sysid.INV.app_id.unit})).records;
      } catch(e){
        console.log(e);
        console.log('データ取得でエラーが起こりました');
        return event
      }

      let updateJson = {
        app: sysid.INV.app_id.device,
        records:[]
      }
      // 商品に拠点と在庫を挿入し更新
      for(const devices of deviceRecords){
        let updateJson_child = {
          id: devices.$id.value,
          record:{
            uStockList:{
              value: []
            }
          }
        }
        for(const units of unitRecords){
          for(const unitsStocks of units.mStockList.value){
            if(devices.mCode.value == unitsStocks.value.mCode.value){
              let unitJson = {
                value:{
                  uCode:{
                    type: "SINGLE_LINE_TEXT",
                    value: units.uCode.value
                  },
                  uName:{
                    type: "SINGLE_LINE_TEXT",
                    value: units.uName.value
                  },
                  uStock:{
                    type: "NUMBER",
                    value: unitsStocks.value.mStock.value
                  }
                }
              }
              updateJson_child.record.uStockList.value.push(unitJson)
            }
          }
        }
        updateJson.records.push(updateJson_child);
      }

      let updateStatus = await kintone.api(kintone.api.url('/k/v1/records.json', true), "PUT", updateJson)
        .then(function (resp) {
          return {result: true, resp:resp, error: {target: kintone.app.getId(), code: 'device_updateSuccess'}};
        }).catch(function (error) {
          console.log(error);
          return {result: false, error: {target: kintone.app.getId(), code: 'device_updateError'}};
        });
      if(!updateStatus.result){
        console.log(updateStatus);
        console.log('在庫更新API失敗');
        return event;
      }

      endLoad();
    });
    return event;
  });

})();