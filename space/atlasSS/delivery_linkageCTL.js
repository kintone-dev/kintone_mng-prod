(function() {
  'use strict';

  kintone.events.on('app.record.create.submit', async function(event) {
    // startLoad();
    // // シリアル番号の品質区分を入れる
    // let newDeviceList = await updateQuality(event.record.deviceList.value)
    // if(!newDeviceList.result){
    //   event.error = 'シリアル番号が入力されていません';
    //   console.log(newDeviceList);
    //   endLoad();
    //   return event;
    // }
    // event.record.deviceList.value = newDeviceList.resp;
    // endLoad();
    return event;
  });

  kintone.events.on('app.record.edit.submit', async function(event) {
    startLoad();
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value,
      event.record.application_type.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
      console.log(checkStatResult.error.code);
      endLoad();
      return event;
    }
    console.log(checkStatResult.error.code);
    if(checkStatResult.error.code=='checkStat_returnComp' && !event.record.warrantyStatus.value){
      event.error='故障品状態が空欄です'
      event.record.warrantyStatus.error = '空欄です';
      endLoad();
      return event;
    }

    // シリアル番号の品質区分を入れる
    let newDeviceList = await updateQuality(event.record.deviceList.value)
    if(!newDeviceList.result){
      event.error = 'シリアル番号が入力されていません';
      console.log(newDeviceList);
      endLoad();
      return event;
    }
    event.record.deviceList.value = newDeviceList.resp;
    endLoad();
    return event;
  });

  kintone.events.on('app.record.create.submit.success',async function(event) {
    startLoad();
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value,
      event.record.application_type.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
      endLoad();
      return event;
    }

    // ステータス更新内容
    let putBody_workStat = {
      'app': kintone.app.getId(),
      'id': event.record.$id.value,
      'record': {}
    };

    // シリアル連携
    let sNumLinkResult
    try{
      sNumLinkResult = await sNumLink(event)
      if(!sNumLinkResult.result){
        console.log(sNumLinkResult);
        await returnWorkStat(event);
        putBody_workStat.record.syncStatus_serial={
          value:'error'
        }
        await changeStatus(putBody_workStat)
        endLoad();
        return event;
      } else {
        putBody_workStat.record.syncStatus_serial={
          value:'success'
        }
      }
      console.log('シリアル連携に成功しました');
    } catch(e){
      alert('シリアル連携で不明なエラーが発生しました');
      console.log(e);
      endLoad();
      return event;
    }

    // 在庫連携
    if(event.record.syncStatus_stock.value!='success' && sNumLinkResult.resp){
      let result_stockCTL
      if(checkStatResult.error.code=='checkStat_returnComp'){
        result_stockCTL = await ctl_stock_v2(event.record, sNumLinkResult.resp.shipData, null, 31);
      } else if(checkStatResult.error.code=='checkStat_shippingComp') {
        result_stockCTL = await ctl_stock_v2(event.record, sNumLinkResult.resp.shipData, 25, 31);
      }
      if(!result_stockCTL.result){
        console.log(result_stockCTL.error);
        await returnWorkStat(event);
        putBody_workStat.record.syncStatus_stock={
          value:'error'
        }
        await changeStatus(putBody_workStat)
        endLoad();
        return event;
      } else {
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
      console.log('在庫連携に成功しました');
    }

    // レポート連携
    if(event.record.syncStatus_report.value!='success'){
      let reportLinkResult = await reportLink(event, checkStatResult.error.code)
      if(!reportLinkResult.result){
        console.log(reportLinkResult);
        await returnWorkStat(event);
        endLoad();
        putBody_workStat.record.syncStatus_report={
          value:'error'
        }
        await changeStatus(putBody_workStat)
        return event;
      } else {
        putBody_workStat.record.syncStatus_report={
          value:'success'
        }
      }
      console.log('レポート連携に成功しました');
    }

    // ステータス更新
    let updateStatus = await changeStatus(putBody_workStat)
    if(!updateStatus.result){
      console.log(updateStatus);
      endLoad();
      return event;
    }
    alert('登録成功しました。\n次の作業に進めてください')
    endLoad();
    return event;
  });

  kintone.events.on('app.record.edit.submit.success',async function(event) {
    startLoad();
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value,
      event.record.application_type.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
      endLoad();
      return event;
    }

    // ステータス更新内容
    let putBody_workStat = {
      'app': kintone.app.getId(),
      'id': event.record.$id.value,
      'record': {}
    };

    // シリアル連携
    let sNumLinkResult
    try{
      sNumLinkResult = await sNumLink(event)
      if(!sNumLinkResult.result){
        console.log(sNumLinkResult);
        await returnWorkStat(event);
        putBody_workStat.record.syncStatus_serial={
          value:'error'
        }
        await changeStatus(putBody_workStat)
        event.error = sNumLinkResult.error.target + ': ' + errorCode[sNumLinkResult.error.code];
        endLoad();
        return event;
      } else {
        putBody_workStat.record.syncStatus_serial={
          value:'success'
        }
        console.log('シリアル連携に成功しました');
      }
    } catch(e){
      alert('シリアル連携で不明なエラーが発生しました');
      console.log(e);
      endLoad();
      return event;
    }
    console.log(sNumLinkResult);

    // 在庫連携
    if(event.record.syncStatus_stock.value!='success' && sNumLinkResult.resp){
      let result_stockCTL
      if(checkStatResult.error.code=='checkStat_returnComp'){
        result_stockCTL = await ctl_stock_v2(event.record, sNumLinkResult.resp.shipData, null, 31);
      } else if(checkStatResult.error.code=='checkStat_shippingComp') {
        result_stockCTL = await ctl_stock_v2(event.record, sNumLinkResult.resp.shipData, 25, 31);
      }
      if(!result_stockCTL.result){
        console.log(result_stockCTL.error);
        await returnWorkStat(event);
        putBody_workStat.record.syncStatus_stock={
          value:'error'
        }
        await changeStatus(putBody_workStat)
        endLoad();
        return event;
      } else {
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
      console.log('在庫連携に成功しました');
    }

    // レポート連携
    if(event.record.syncStatus_report.value!='success'){
      let reportLinkResult = await reportLink(event, checkStatResult.error.code)
      if(!reportLinkResult.result){
        console.log(reportLinkResult);
        await returnWorkStat(event);
        endLoad();
        putBody_workStat.record.syncStatus_report={
          value:'error'
        }
        await changeStatus(putBody_workStat)
        return event;
      } else {
        putBody_workStat.record.syncStatus_report={
          value:'success'
        }
      }
      console.log('レポート連携に成功しました');
    }

    // ステータス更新
    let updateStatus = await changeStatus(putBody_workStat)
    if(!updateStatus.result){
      console.log(updateStatus);
      endLoad();
      return event;
    }
    alert('登録成功しました。\n次の作業に進めてください')
    endLoad();
    return event;
  });
})();

// シリアル番号の情報を取得し、品質区分をreturn
async function updateQuality(deviceList){
  try{
    for(const list of deviceList){
      let snumRecord = (await getRecords({app: sysid.DEV.app_id.sNum,filterCond: 'sNum like "' + list.value.sNum.value + '"'})).records;
      if(snumRecord.length==0){
        // return {result: false, error: {target: 'updateQuality', code: 'updateQuality_notSnum'}};
        list.value.qualityClass.value = '新品'
      } else {
        list.value.qualityClass.value = snumRecord[0].sState.value
      }
    }
  } catch(e){
    console.log(e);
    alert('シリアル番号の品質取得の際にエラーが発生しました。');
    return {result: false, error: {target: 'updateQuality', code: 'updateQuality_error'}};
  }
  return {result: true, resp: deviceList, error: {target: 'updateQuality', code: 'updateQuality_success'}};
}

function checkStat(status, batch, applicationType){
  // エラー処理
  if(batch=='error'||batch==''){
    alert('デバイス登録確認がエラーか空欄です。');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_error-syncStatus_batch'}};
  }
  // if(applicationType.match(/故障交換/) && status.match(/出荷完了|着荷完了/)){
  //   return {result: false, error: {target: 'checkStat', code: 'checkStat_error-brokenExchange-badStatus'}};
  // }
  // ステータス確認
  if(status=='故障品返却完了' && applicationType.match(/故障交換/)){
    return {result: true, error: {target: 'checkStat', code: 'checkStat_returnComp'}};
  }else if(status=='出荷完了'){
    return {result: true, error: {target: 'checkStat', code: 'checkStat_shippingComp'}};
  }
  return {result: false, error: {target: 'checkStat', code: 'checkStat_unknown'}};
}

async function sNumLink(event){
  try{
    let result_snCTL
    if(event.record.syncStatus_serial.value=='success'){
      alert('シリアル連携は完了済みです');
    } else{
      if(event.record.ship_number.value=='') {
        alert('伝票番号が記入されていません。');
        return {result: false, error:  {target: '伝票番号', code: 'notRequireData'}};
      }
      if(event.record.shipping_datetime.value==''){
        alert('出荷日時が記入されていません。');
        return {result: false, error:  {target: '出荷日時', code: 'notRequireData'}};
      }
      let sninfo = renew_sNumsInfo_alship_forDelivery(event.record, 'deviceList');
      if(sninfo.shipInfo.deviceInfo.length > 0){
        result_snCTL = await ctl_sNumv2('internal', sninfo);
        console.log(result_snCTL);
        if(!result_snCTL.result){
          console.log(result_snCTL.error.code);
          alert('シリアル連携のAPIに失敗しました');
          return result_snCTL;
        }
      } else {
        alert('連携するシリアル番号がありません');
        return {result: false, error: {target: 'sNumLink', code: 'sn_nosnum'}};
      }
    }
    return {result: true, resp: result_snCTL, error: {target: 'sNumLink', code: 'sNumLink_success'}};
  } catch(e){
    alert('シリアル連携で不明なエラーが発生しました');
    return {result: false, message: e, error: {target: 'シリアル連携', code: 'unknownError'}};
  }
}

async function reportLink(event, param){
  let reportDate = new Date(event.record.shipping_datetime.value);
  let year = reportDate.getFullYear()
  let month = ("0" + (reportDate.getMonth()+1)).slice(-2)
  // レポート月のASS情報取得
  let getAssShipBody = {
    'app': sysid.INV.app_id.report,
    'query': 'sys_invoiceDate = "'+year+''+month+'"'
  };
  let reportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getAssShipBody)
    .then(function (resp) {
      return {result: true, resp: resp, message:  {target: 'reportLink', code: 'reportLink_getSuccess'}};
    }).catch(function (error) {
      console.log(error);
      return {result: false, error:  {target: 'reportLink', code: 'reportLink_getError'}};
    });
  if(!reportData.result){
    alert('レポートの取得に失敗しました');
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_getError'}};
  }
  if(reportData.resp.records.length!=1){
    alert('該当するレポートが存在しません');
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_notData'}};
  }
  for(const deviceList of event.record.deviceList.value){
    // レポート在庫連携用json作成
    let reportStockJson = {
      app: sysid.INV.app_id.report,
      id: reportData.resp.records[0].$id.value,
      sbTableCode: 'inventoryList',
      listCode: 'sys_code',
      listValue:{}
    }
    // レポート在庫連携用json作成
    let reportAssJson = {
      app: sysid.INV.app_id.report,
      id: reportData.resp.records[0].$id.value,
      sbTableCode: 'AssShippingList',
      listCode: 'ASS_mCode',
      listValue:{}
    }
    if(deviceList.value.qualityClass.value=='新品'){
      if(param=='checkStat_shippingComp'){
        reportStockJson.listValue[deviceList.value.mCode.value+'-distribute-ASS']={
          updateKey_listCode: deviceList.value.mCode.value+'-distribute-ASS',
          updateKey_listValue:{
            'arrivalNum':{
              updateKey_cell: 'arrivalNum',
              operator: '+',
              value: parseInt(deviceList.value.shipNum.value)
            },
          }
        }
        reportAssJson.listValue[deviceList.value.mCode.value]={
          updateKey_listCode: deviceList.value.mCode.value,
          updateKey_listValue:{
            'ASS_shipNum_new':{
              updateKey_cell: 'ASS_shipNum_new',
              operator: '+',
              value: parseInt(deviceList.value.shipNum.value)
            },
          }
        }
      } else if(param=='checkStat_returnComp'){
        if(event.record.warrantyStatus.value.match(/保証適応外/)){
          reportAssJson.listValue[deviceList.value.mCode.value]={
            updateKey_listCode: deviceList.value.mCode.value,
            updateKey_listValue:{
              'ASS_repierNum':{
                updateKey_cell: 'ASS_repierNum',
                operator: '+',
                value: parseInt(deviceList.value.shipNum.value)
              },
              'ASS_outWarranty':{
                updateKey_cell: 'ASS_outWarranty',
                operator: '+',
                value: parseInt(deviceList.value.shipNum.value)
              },
            }
          }
        } else if(event.record.warrantyStatus.value.match(/保証範囲内/)){
          reportAssJson.listValue[deviceList.value.mCode.value]={
            updateKey_listCode: deviceList.value.mCode.value,
            updateKey_listValue:{
              'ASS_repierNum':{
                updateKey_cell: 'ASS_repierNum',
                operator: '+',
                value: parseInt(deviceList.value.shipNum.value)
              },
              'ASS_inWarranty':{
                updateKey_cell: 'ASS_inWarranty',
                operator: '+',
                value: parseInt(deviceList.value.shipNum.value)
              },
            }
          }
        }
      }
      reportStockJson.listValue[deviceList.value.mCode.value+'-forNeeds']={
        updateKey_listCode: deviceList.value.mCode.value+'-forNeeds',
        updateKey_listValue:{
          'shipNum':{
            updateKey_cell: 'shipNum',
            operator: '+',
            value: parseInt(deviceList.value.shipNum.value)
          },
        }
      }
      let reportResult_stock = await update_sbTable(reportStockJson)
      if(!reportResult_stock.result){
        alert('レポートの更新に失敗しました');
        return {result: false, error:  {target: 'reportLink', code: 'reportLink_report-updateError'}};
      }
      let reportResult_ass = await update_sbTable(reportAssJson)
      if(!reportResult_ass.result){
        alert('レポートの更新に失敗しました');
        return {result: false, error:  {target: 'reportLink', code: 'reportLink_reportass-updateError'}};
      }
    }else if(deviceList.value.qualityClass.value.match(/再生品|社内用/)){
      reportAssJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value,
        updateKey_listValue:{
          'shipASS_shipNum_recycleNum':{
            updateKey_cell: 'ASS_shipNum_recycle',
            operator: '+',
            value: parseInt(deviceList.value.shipNum.value)
          },
        }
      }
      let reportResult_ass = await update_sbTable(reportAssJson)
      if(!reportResult_ass.result){
        alert('レポートの更新に失敗しました');
        return {result: false, error:  {target: 'reportLink', code: 'reportLink_reportass-updateError'}};
      }
    }
  }
  return {result: true, error:  {target: 'reportLink', code: 'reportLink_success'}};
}

// 処理が中止した場合作業ステータスを集荷待ちに変更
async function returnWorkStat(event){
  let updateJson = {
    app: kintone.app.getId(),
    id: event.record.$id.value,
    record:{
      working_status:{
        value: '集荷待ち'
      }
    }
  }
  let putResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateJson)
    .then(function (resp) {
      return {
        result: true,
        message: resp
      };
    }).catch(function (error) {
      return {
        result: false,
        message: error
      };
    });
  if(!putResult.result){
    alert('作業ステータスの差し戻しに失敗しました');
    return {result: false, error: {target: 'returnWorkStat', code: 'returnWorkStat_updateError'}};
  }

  return {result: true, error: {target: 'returnWorkStat', code: 'returnWorkStat_success'}};
}

// 処理が終了した場合各種ステータスを変更
async function changeStatus(updateBody){
  let updateStatus = await kintone.api(kintone.api.url('/k/v1/record.json', true), "PUT", updateBody)
  .then(function (resp) {
    return {result: true, resp:resp, error: {target: 'changeStatus', code: 'changeStatus_errorUpdateStatus'}};
  }).catch(function (error) {
    console.log(error);
    alert('ステータス更新に失敗しました');
    return {result: false, error: {target: 'changeStatus', code: 'changeStatus_errorUpdateStatus'}};
  });
  return updateStatus
}