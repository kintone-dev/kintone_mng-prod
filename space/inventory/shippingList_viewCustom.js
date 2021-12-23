(function () {
  'use strict';
  kintone.events.on(['app.record.create.change.shipType', 'app.record.edit.change.shipType'], function (event) {
    let shiptypeValue=event.record.shipType.value;
    if(shiptypeValue==null||shiptypeValue==undefined){
      ctl_dstselection(event, 'none', false);
    }else if(shiptypeValue.match(/返品|移動-ベンダー/)){
      ctl_dstselection(event, '施工業者/拠点へ納品', true);
      ctl_contractor(event, 'ベンダー');
    }else if(shiptypeValue.match(/移動-拠点間/)){
      ctl_dstselection(event, '施工業者/拠点へ納品', true);
      ctl_contractor(event, null);
    }else{
      ctl_dstselection(event, 'none', false);
      ctl_contractor(event, null);
    }
    return event;
  });
  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection', 'app.record.create.change.sys_instAddress', 'app.record.edit.change.sys_instAddress', 'app.record.create.change.sys_unitAddress', 'app.record.edit.change.sys_unitAddress'], function (event) {
    ctl_selectionShown(event, event.record.dstSelection.value);
    return event;
  });

  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection'], function (event) {
    if(event.record.dstSelection.value == '担当手渡し') {
      setFieldShown('zipcode', false);
      setFieldShown('prefectures', false);
      setFieldShown('city', false);
      setFieldShown('address', false);
      setFieldShown('buildingName', false);
      setFieldShown('corpName', false);
    }else{
      setFieldShown('zipcode', true);
      setFieldShown('prefectures', true);
      setFieldShown('city', true);
      setFieldShown('address', true);
      setFieldShown('buildingName', true);
      setFieldShown('corpName', true);
    }
    return event;
  });

  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show'], function (event) {
    console.log(event.record.shipType)
    var shiptypeValue=event.record.shipType.value;
    /*
    if(shiptypeValue==null||shiptypeValue==undefined||shiptypeValue==''){
      ctl_dstselection(event, 'none', false);
    }else if(shiptypeValue.match(/返品|移動-ベンダー/)){
      ctl_dstselection(event, '施工業者/拠点へ納品', true);
      ctl_contractor(event, 'ベンダー');
    }else if(shiptypeValue.match(/移動-拠点間/)){
      ctl_dstselection(event, '施工業者/拠点へ納品', true);
      ctl_contractor(event, null);
    }else{
      ctl_dstselection(event, 'none', false);
      ctl_contractor(event, null);
    }
    */
    ctl_selectionShown(event, event.record.dstSelection.value);
    //システム情報編集不可
    event.record.prjNum.disabled = true;
    event.record.prjId.disabled = true;
    event.record.instID.disabled = true;

    //タブメニュー作成
    tabMenu('tab_ship', ['出荷情報', '宛先情報', '品目情報', '輸送情報']);
    //タブ切り替え表示設定
    $('.tabMenu a').on('click', function () {
      var eRecord = kintone.app.record.get();
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName, eRecord); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false; //aタグを無効にする
    });

    //tab初期表示設定
    if(sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'), event);
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
      sessionStorage.removeItem('shipType');
    }else{
      tabSwitch('#出荷情報', event);
    }
    return event;
  });

  kintone.events.on('app.record.create.show', function (event) {
    //レコード作成時、発送関連情報を非表示
    setFieldShown('deliveryCorp', false);
    setFieldShown('trckNum', false);
    setFieldShown('sendDate', false);
    setFieldShown('expArrivalDate', false);
    setSpaceShown('setShipment', 'line', 'none');
    return event;
  });

  kintone.events.on('app.record.edit.show', function (event) {
    setSpaceShown('setShipment', 'line', 'none');
    return event;
  });

  // ドロップダウン作成
  kintone.events.on('app.record.detail.show', async function (event) {
    let prjid=event.record.prjId.value;
    if(prjid!=''){
      setBtn_header('newTab_prj', '案件管理を開く');
      $('#newTab_prj').on('click', function () {
        window.open('https://accel-lab.cybozu.com/k/' + sysid.INV.app_id.shipment + '/show#record=' + prjid, '_blank'); //該当アプリのレコード詳細画面を開く
      });
    }
    // let copy_shipdata=
    setBtn_header('copy_shipdata', 'データ複製');
    $('#copy_shipdata').on('click', function () {
      let newRecord=event.record;
      delete newRecord.$id;
      delete newRecord.$revision;
      delete newRecord.ステータス;
      delete newRecord.レコード番号;
      delete newRecord.作成日時;
      delete newRecord.作成者;
      delete newRecord.作業者;
      delete newRecord.更新日時;
      delete newRecord.更新者;
      delete newRecord.shipment;
      delete newRecord.deliveryCorp;
      delete newRecord.trckNum;
      delete newRecord.sendDate;
      delete newRecord.expArrivalDate;
      sessionStorage.setItem('copy_shipdata', newRecord);
      window.open('https://accel-lab.cybozu.com/k/' + kintone.app.getId() + '/edit'); //該当アプリのレコード詳細画面を開く
      // window.open('https://accel-lab.cybozu.com/k/' + tarAPP_id + '/edit', Math.random() + '-newWindow', 'scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=1000,height=600,left=300,top=200'); //該当アプリの新規レコード作成画面を開く
      console.log(newRecord);
    });
    var cStatus = event.record.ステータス.value;
    //プロセスエラー処理
    var processECheck = await processError(event);
    console.log(processECheck);
    if(processECheck[0] == 'error'){
      alert(processECheck[1]);
    }
    if(cStatus === "処理中") {
      setSpaceShown('setShipment', 'line', 'block');
      var createSelect = document.createElement('select');
      createSelect.id = 'setShipment';
      createSelect.name = 'setShipment';
      createSelect.classList.add('jsselect_header');
      var setSelectLabel = document.createElement('label');
      setSelectLabel.htmlFor = 'setShipment';
      setSelectLabel.style = 'display: block; margin-bottom:5px;';
      setSelectLabel.innerText = '出荷ロケーション';
      kintone.app.record.getSpaceElement('setShipment').appendChild(setSelectLabel);
      kintone.app.record.getSpaceElement('setShipment').appendChild(createSelect);

      (async function setOption() {
        var getUnitBody = {
          'app': sysid.INV.app_id.unit,
          'query': ''
        };
        var allUnit = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getUnitBody)
          .then(function (resp) {
            return resp;
          }).catch(function (error) {
            return error;
          });
        $('#setShipment').append('<option value="noSelect">選択して下さい</option>');
        for(let i in allUnit.records) {
          $('#setShipment').append('<option value="' + allUnit.records[i].uCode.value + '">' + allUnit.records[i].uName.value + '</option>');
        }
      }());
      setFieldShown('shipment', false);
    }else{
      setSpaceShown('setShipment', 'line', 'none');
    }
    return event;
  });

  // 輸送業者を「担当手渡し」にした場合、追跡番号を「none」にする
  kintone.events.on(['app.record.create.change.deliveryCorp', 'app.record.edit.change.deliveryCorp'], function (event) {
    if(event.record.deliveryCorp.value == '担当手渡し') {
      event.record.trckNum.value = 'none';
      event.record.trckNum.disabled = true;
    }else{
      event.record.trckNum.value = null;
      event.record.trckNum.disabled = false;
    }
    return event;
  });

  // カーテンレールが選択された場合、特記事項にデータを記入
  kintone.events.on(['app.record.edit.change.mCode', 'app.record.create.change.mCode'], function (event) {
    for(let i in event.record.deviceList.value) {
      if(!String(event.record.deviceList.value[i].value.shipRemarks.value).match(/PAC/)) {
        var mCodeValue = event.record.deviceList.value[i].value.mCode.value;
        if(mCodeValue === undefined) {
          event.record.deviceList.value[i].value.shipRemarks.value = '';
        }else if(mCodeValue == 'KRT-DY') {
          krtSetting();
          $('#krtSetBtn').on('click', function () {
            var eRecord = kintone.app.record.get();
            var krtLength = $('.length').val();
            var krtOpenType = $('input[name=openType]:checked').val();
            var krtMethodType = $('input[name=methodType]:checked').val();
            eRecord.record.deviceList.value[i].value.shipRemarks.value = `WFP\nカーテンレール全長(mm)：${krtLength}\n開き勝手：${krtOpenType}\n取り付け方法：${krtMethodType}`;
            kintone.app.record.set(eRecord);
            $('#mwFrame').fadeOut(1000, function () {
              $('#mwFrame').remove();
            });
          });
        }else if(mCodeValue.match(/pkg_/)) {
          event.record.deviceList.value[i].value.shipRemarks.value = 'WFP';
        }
      }
    }
    return event;
  });

  // 計算ボタン
  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    setBtn('calBtn', '計算');
    $('#calBtn').on('click', function () {
      calBtnFunc(kintone.app.record.get(), kintone.app.getId());
    });
    return event;
  });

  // toastcamがある場合、macアドレスをシリアル管理から取得＆格納
  kintone.events.on(['app.record.create.submit','app.record.edit.submit'], function(event){
    let ship_deviceList=event.record.deviceList.value;
    for(let i in ship_deviceList){
      if(ship_deviceList[i].value.mCode.value=='TC-UB12F-M' && ship_deviceList[i].value.sNum.value!=undefined){
        let SNsQuery=sNumRecords(ship_deviceList[i].value.sNum.value, 'text').SNs.join('","');
        let get_Mac={
          'app': sysid.DEV.app_id.sNum,
          'query':'sNum in ("'+SNsQuery+'")'
        }
        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', get_Mac).then(function(resp){
          console.log(resp);
          for(let y in resp.records){
            let remarks=ship_deviceList[i].value.shipRemarks.value;
            if(y==0){
              if(remarks==undefined) ship_deviceList[i].value.shipRemarks.value='\n＝＝＝MAC address＝＝＝\n'+resp.records[y].macaddress.value;
              else ship_deviceList[i].value.shipRemarks.value+='\n＝＝＝MAC address＝＝＝\n'+resp.records[y].macaddress.value;
            }else ship_deviceList[i].value.shipRemarks.value+='\n'+resp.records[y].macaddress.value;
          }
          console.log(event.record.deviceList.value);
          return event;
        }).catch(function(error){
          console.log(error);
        });
      }
    }
    return event;
  });

  // 受取ゾーン編集権限コントロール
  function ctl_ReceiverAct(event, dstselection, boolean){
    if(dstselection != 'none'){
      ctl_dstselection(event, dstselection, boolean);
    }

    event.record.receiver.disabled = boolean;
    event.record.phoneNum.disabled = boolean;
    event.record.zipcode.disabled = boolean;
    event.record.prefectures.disabled = boolean;
    event.record.city.disabled = boolean;
    event.record.address.disabled = boolean;
    event.record.buildingName.disabled = boolean;
    event.record.corpName.disabled = boolean;
  }

  // 納品先選択制御
  function ctl_dstselection(event, dstselection, boolean){
    if(dstselection!='none'){
      event.record.dstSelection.value = dstselection;
    }
    event.record.dstSelection.disabled = boolean;
  }

  // 施工拠点入力制御
  function ctl_contractor(event, contractor){
    if(contractor==null){
      event.record.Contractor.disabled = false;
      event.record.Contractor.value = '';
    }else{
      event.record.Contractor.disabled = true;
      event.record.Contractor.value = contractor;
      event.record.Contractor.lookup = true;
    }
  }

  // 納品先選択による受取情報自動入力
  function ctl_ReceiverInfo(event, dstselections){
    if(dstselections=='clear'){
      event.record.receiver.value = '';
      event.record.phoneNum.value = '';
      event.record.zipcode.value = '';
      event.record.prefectures.value = '';
      event.record.city.value = '';
      event.record.address.value = '';
      event.record.buildingName.value = '';
      event.record.corpName.value = '';
    }else if(dstselections !== undefined){
      let ReceiverInfo = dstselections.split(',');
      event.record.receiver.value = ReceiverInfo[0];
      event.record.phoneNum.value = ReceiverInfo[1];
      event.record.zipcode.value = ReceiverInfo[2];
      event.record.prefectures.value = ReceiverInfo[3];
      event.record.city.value = ReceiverInfo[4];
      event.record.address.value = ReceiverInfo[5];
      event.record.buildingName.value = ReceiverInfo[6];
      event.record.corpName.value = ReceiverInfo[7];
    }
  }

  // 「納品先選択」による表示項目＆編集権限入れ替え
  function ctl_selectionShown(event, selection) {
    switch(selection){
      case '施工業者/拠点へ納品':
        setFieldShown('Contractor', true);
        setFieldShown('instName', false);
        ctl_ReceiverAct(event, 'none', true);
        ctl_ReceiverInfo(event, event.record.sys_unitAddress.value);
        setFieldShown('zipcode', true);
        setFieldShown('prefectures', true);
        setFieldShown('city', true);
        setFieldShown('address', true);
        setFieldShown('buildingName', true);
        setFieldShown('corpName', true);
        break;
      case '設置先と同じ':
        setFieldShown('Contractor', false);
        setFieldShown('instName', true);
        ctl_ReceiverAct(event, 'none', true);
        ctl_ReceiverInfo(event, event.record.sys_instAddress.value);
        setFieldShown('zipcode', true);
        setFieldShown('prefectures', true);
        setFieldShown('city', true);
        setFieldShown('address', true);
        setFieldShown('buildingName', true);
        setFieldShown('corpName', true);
        break;
      case '手入力':
        setFieldShown('Contractor', false);
        setFieldShown('instName', false);
        ctl_ReceiverAct(event, 'none', false);
        ctl_ReceiverInfo(event, 'clear');
        setFieldShown('zipcode', true);
        setFieldShown('prefectures', true);
        setFieldShown('city', true);
        setFieldShown('address', true);
        setFieldShown('buildingName', true);
        setFieldShown('corpName', true);
        break;
      case '担当手渡し':
        setFieldShown('Contractor', false);
        setFieldShown('instName', false);
        event.record.receiver.disabled = false;
        event.record.phoneNum.disabled = false;
        ctl_ReceiverInfo(event, 'clear');
        setFieldShown('zipcode', false);
        setFieldShown('prefectures', false);
        setFieldShown('city', false);
        setFieldShown('address', false);
        setFieldShown('buildingName', false);
        setFieldShown('corpName', false);
        break;
      case undefined:
        setFieldShown('Contractor', false);
        setFieldShown('instName', false);
        event.record.receiver.disabled = false;
        event.record.phoneNum.disabled = false;
        ctl_ReceiverInfo(event, 'clear');
        setFieldShown('zipcode', false);
        setFieldShown('prefectures', false);
        setFieldShown('city', false);
        setFieldShown('address', false);
        setFieldShown('buildingName', false);
        setFieldShown('corpName', false);
        break;
    }
  }

  //tabメニューの選択肢による表示設定
  function tabSwitch(onSelect, event) {
    switch(onSelect) {
      case '#出荷情報':
        setFieldShown('dstSelection', false);
        setFieldShown('Contractor', false);
        setFieldShown('instName', false);
        setFieldShown('zipcode', false);
        setFieldShown('phoneNum', false);
        setFieldShown('address', false);
        setFieldShown('buildingName', false);
        setFieldShown('corpName', false);
        setFieldShown('receiver', false);
        setFieldShown('prefectures', false);
        setFieldShown('city', false);
        setFieldShown('deviceList', false);
        setFieldShown('deliveryCorp', false);
        setFieldShown('trckNum', false);
        setFieldShown('sendDate', false);
        setFieldShown('expArrivalDate', false);
        setFieldShown('shipment', true);
        setFieldShown('shipType', true);
        setFieldShown('tarDate', true);
        setFieldShown('instFile', true);
        setFieldShown('shipNote', true);
        setFieldShown('aboutDelivery', true);
        setSpaceShown('calBtn', 'line', 'none');
        break;
      case '#宛先情報':
        setFieldShown('dstSelection', true);
        setFieldShown('receiver', true);
        setFieldShown('phoneNum', true);
        setFieldShown('deviceList', false);
        setFieldShown('deliveryCorp', false);
        setFieldShown('trckNum', false);
        setFieldShown('sendDate', false);
        setFieldShown('expArrivalDate', false);
        setFieldShown('shipment', false);
        setFieldShown('shipType', false);
        setFieldShown('tarDate', false);
        setFieldShown('instFile', false);
        setFieldShown('shipNote', false);
        setFieldShown('aboutDelivery', false);
        setSpaceShown('calBtn', 'line', 'none');
        ctl_selectionShown(event, event.record.dstSelection.value);
        break;
      case '#品目情報':
        setFieldShown('dstSelection', false);
        setFieldShown('Contractor', false);
        setFieldShown('instName', false);
        setFieldShown('phoneNum', false);
        setFieldShown('address', false);
        setFieldShown('buildingName', false);
        setFieldShown('corpName', false);
        setFieldShown('receiver', false);
        setFieldShown('zipcode', false);
        setFieldShown('prefectures', false);
        setFieldShown('city', false);
        setFieldShown('deviceList', true);
        setFieldShown('deliveryCorp', false);
        setFieldShown('trckNum', false);
        setFieldShown('sendDate', false);
        setFieldShown('expArrivalDate', false);
        setFieldShown('shipment', false);
        setFieldShown('shipType', false);
        setFieldShown('tarDate', false);
        setFieldShown('instFile', false);
        setFieldShown('shipNote', false);
        setFieldShown('aboutDelivery', false);
        setSpaceShown('calBtn', 'line', 'block');
        break;
      case '#輸送情報':
        setFieldShown('dstSelection', false);
        setFieldShown('Contractor', false);
        setFieldShown('instName', false);
        setFieldShown('zipcode', false);
        setFieldShown('phoneNum', false);
        setFieldShown('address', false);
        setFieldShown('buildingName', false);
        setFieldShown('corpName', false);
        setFieldShown('receiver', false);
        setFieldShown('prefectures', false);
        setFieldShown('city', false);
        setFieldShown('deviceList', false);
        setFieldShown('deliveryCorp', true);
        setFieldShown('trckNum', true);
        setFieldShown('sendDate', true);
        setFieldShown('expArrivalDate', true);
        setFieldShown('shipment', false);
        setFieldShown('shipType', false);
        setFieldShown('tarDate', true);
        setFieldShown('instFile', false);
        setFieldShown('shipNote', false);
        setFieldShown('aboutDelivery', false);
        setSpaceShown('calBtn', 'line', 'none');
        break;
    }
  }
})();