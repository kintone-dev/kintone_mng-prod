(function() {
  'use strict';
  kintone.events.on('app.record.create.submit.success',async function(event) {
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
      return event;
    }

    // ステータス更新内容
    let putBody_workStat = {
      'app': kintone.app.getId(),
      'id': event.record.$id.value,
      'record': {
        syncStatus_serial: {},
        syncStatus_stock: {},
        syncStatus_report: {},
      }
    };

    // シリアル連携
    let sNumLinkResult = sNumLink(event)
    console.log(sNumLinkResult);
    if(!sNumLinkResult.result){
      return event;
    } else {
      putBody_workStat.record.syncStatus_stock={
        value:'success'
      }
    }

    // 在庫連携
    if(event.record.syncStatus_stock.value!='success'){
      let stockLinkResult = stockLink(event)
      if(!stockLinkResult.result){
        return event;
      } else {
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
    }

    // レポート連携
    if(event.record.syncStatus_report.value!='success'){
      let reportLinkResult = reportLink(event, 'execution')
      if(!reportLinkResult.result){
        return event;
      } else {
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
    }

    console.log(putBody_workStat);
    // ステータス更新
    let updateStatus = await kintone.api(kintone.api.url('/k/v1/record.json', true), "GET", putBody_workStat)
    .then(function (resp) {
      return resp;
    }).catch(function (error) {
      console.log(error);
      return {result: false, error: {target: kintone.app.getId(), code: 'delivery_errorUpdateStatus'}};
    });
    console.log(updateStatus);

    return event;
  });

  kintone.events.on('app.record.edit.submit.success',async function(event) {
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
      return event;
    }

    // ステータス更新内容
    let putBody_workStat = {
      'app': kintone.app.getId(),
      'id': event.record.$id.value,
      'record': {
        syncStatus_serial: {},
        syncStatus_stock: {},
        syncStatus_report: {},
      }
    };

    // シリアル連携
    let sNumLinkResult = await sNumLink(event)
    if(!sNumLinkResult.result){
      console.log('シリアル連携失敗');
      return event;
    } else {
      putBody_workStat.record.syncStatus_stock={
        value:'success'
      }
    }

    // 在庫連携
    if(event.record.syncStatus_stock.value!='success'){
      let stockLinkResult = await stockLink(event)
      if(!stockLinkResult.result){
        console.log('在庫連携失敗');
        return event;
      } else {
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
    }

    // レポート連携
    if(event.record.syncStatus_report.value!='success'){
      let reportLinkResult = await reportLink(event, 'execution')
      if(!reportLinkResult.result){
        console.log('レポート連携失敗');
        console.log(reportLinkResult);
        return event;
      } else {
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
    }

    console.log(putBody_workStat);
    // ステータス更新
    let updateStatus = await kintone.api(kintone.api.url('/k/v1/record.json', true), "GET", putBody_workStat)
    .then(function (resp) {
      return resp;
    }).catch(function (error) {
      console.log(error);
      return {result: false, error: {target: kintone.app.getId(), code: 'delivery_errorUpdateStatus'}};
    });
    console.log(updateStatus);

    return event;
  });
})();

function checkStat(status, batch){
  if(status!='出荷完了'){
    console.log('作業ステータスが出荷完了以外です。');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_notShipComp'}};
  }
  if(batch=='error'){
    console.log('デバイス登録確認がエラーです。');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_error-syncStatus_batch'}};
  }
  return {result: true, error: {target: 'checkStat', code: 'checkStat_success'}};
}

async function sNumLink(event){
  if(event.record.syncStatus_serial.value!='success'){
    if(event.record.slip_number.value=='') return {result: false, error:  {target: 'sNumLink', code: 'sNumLink_not-slip_number'}};
    if(event.record.shipping_datetime.value=='') return {result: false, error:  {target: 'sNumLink', code: 'sNumLink_not-shipping_datetime'}};
    let sninfo = renew_sNumsInfo_alship_forDelivery(event.record, 'deviceList');
    if(sninfo.shipInfo.deviceInfo.length > 0){
      let result_snCTL = await ctl_sNum('internal', sninfo);
      if(!result_snCTL.result){
        console.log(result_snCTL.error.code);
        return {result: false, error:  {target: 'sNumLink', code: 'ctl_sNumError'}};
      }
    } else {
      return {result: false, error:  {target: 'sNumLink', code: 'notSnum'}};
    }
  } else {
    return {result: false, error:  {target: 'sNumLink', code: 'sNumLink_Already-successful'}};
  }
  return {result: true, error: {target: 'sNumLink', code: 'sNumLink_success'}};
}

async function stockLink(event){
  // 入荷用json作成（distribute-ASS）
  let arrivalJson = {
    app: sysid.INV.app_id.unit,
    id: '25',
    sbTableCode: 'mStockList',
    listCode: 'mCode',
    listValue:{}
  }
  for(const deviceList of event.record.deviceList.value){
    if(deviceList.value.qualityClass.value=='新品'){
      arrivalJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value,
        updateKey_listValue:{
          'mStock':{
            updateKey_cell: 'mStock',
            operator: '+',
            value: deviceList.value.shipNum.value
          },
        }
      }
    }
  }
  let arrivalResult = await update_sbTable(arrivalJson)
  if(!arrivalResult.result){
    return {result: false, error:  {target: 'stockLink', code: 'stockLink_arrival-updateError'}};
  }

  // 出荷用json作成（forneeds）
  let shippingJson = {
    app: sysid.INV.app_id.unit,
    id: '31',
    sbTableCode: 'mStockList',
    listCode: 'mCode',
    listValue:{}
  }
  for(const deviceList of event.record.deviceList.value){
    if(deviceList.value.qualityClass.value=='新品'){
      shippingJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value,
        updateKey_listValue:{
          'mStock':{
            updateKey_cell: 'mStock',
            operator: '-',
            value: deviceList.value.shipNum.value
          },
        }
      }
    }
  }
  let shippingResult = await update_sbTable(shippingJson)
  if(!shippingResult.result){
    return {result: false, error:  {target: 'stockLink', code: 'stockLink_shipping-updateError'}};
  }
  return {result: true, error: {target: 'stockLink', code: 'stockLink_success'}};
}

async function reportLink(event, param){
  let operator;
  if(param=='execution'){
    operator='+'
  }else if(param=='cancel'){
    operator='-'
  } else {
    return {result: false, error:  {target: 'reportLink', code: 'notOperator'}};
  }
  // レポート在庫連携用json作成
  let reportStockJson = {
    app: sysid.INV.app_id.report,
    id: '',
    sbTableCode: 'inventoryList',
    listCode: 'sys_code',
    listValue:{}
  }
  // レポート在庫連携用json作成
  let reportAssJson = {
    app: sysid.INV.app_id.report,
    id: '',
    sbTableCode: 'AssShippingList',
    listCode: 'ASS_mCode',
    listValue:{}
  }
  let reportDate = new Date(event.record.shipping_datetime.value);
  let year = reportDate.getFullYear()
  let month = ("0" + (reportDate.getMonth()+1)).slice(-2)
  // レポート月のASS情報取得
  let getAssShipBody = {
    'app': sysid.INV.app_id.report,
    // 'query': 'sys_invoiceDate = "'+year+''+month+'"'
    'query': 'sys_invoiceDate = "205203"' //test用
  };
  let reportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getAssShipBody)
    .then(function (resp) {
      return {result: true, error:  {target: 'reportLink', code: 'reportLink_getSuccess'}};
    }).catch(function (error) {
      console.log(error);
      return {result: false, error:  {target: 'reportLink', code: 'reportLink_getError'}};
    });
  console.log(reportData);
  if(!reportData.result){
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_getError'}};
  }
  if(reportData.records.length!=1){
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_notData'}};
  }
  reportStockJson.id=reportData.records[0].$id.value;
  reportAssJson.id=reportData.records[0].$id.value;
  for(const deviceList of event.record.deviceList.value){
    if(deviceList.value.qualityClass.value=='新品'){
      reportStockJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value+'-distribute-ASS',
        updateKey_listValue:{
          'shipNum':{
            updateKey_cell: 'shipNum',
            operator: operator,
            value: deviceList.value.shipNum.value
          },
        }
      }
      reportAssJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value,
        updateKey_listValue:{
          'ASS_shipNum_new':{
            updateKey_cell: 'ASS_shipNum_new',
            operator: operator,
            value: deviceList.value.shipNum.value
          },
        }
      }
    }else if(deviceList.value.qualityClass.value.match(/再利用|社内用/)){
      reportAssJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value,
        updateKey_listValue:{
          'shipASS_shipNum_recycleNum':{
            updateKey_cell: 'ASS_shipNum_recycle',
            operator: operator,
            value: deviceList.value.shipNum.value
          },
        }
      }
    }
  }

  let reportResult_stock = await update_sbTable(reportStockJson)
  if(!reportResult_stock.result){
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_report-updateError'}};
  }
  let reportResult_ass = await update_sbTable(reportAssJson)
  if(!reportResult_ass.result){
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_reportass-updateError'}};
  }
  return {result: true, error:  {target: 'reportLink', code: 'reportLink_success'}};
}