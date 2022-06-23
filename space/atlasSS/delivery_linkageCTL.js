(function() {
  'use strict';

  kintone.events.on('app.record.create.submit', async function(event) {
    startLoad();
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
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

  kintone.events.on('app.record.edit.submit', async function(event) {
    startLoad();
    // 状態確認
    let checkStatResult = checkStat(
      event.record.working_status.value,
      event.record.syncStatus_batch.value
    );
    // 状態が例外だった場合処理を中止
    if(!checkStatResult.result){
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
      event.record.syncStatus_batch.value
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
    console.log(sNumLinkResult);

    // 在庫連携
    let result_stockCTL = await ctl_stock_v2(event.record, sNumLinkResult.resp.shipData, 25, 31);
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

    // try{
    //   if(event.record.syncStatus_stock.value!='success'){
    //     let stockLinkResult = await stockLink(event)
    //     if(!stockLinkResult.result){
    //       console.log(stockLinkResult);
    //       await returnWorkStat(event);
    //       putBody_workStat.record.syncStatus_stock={
    //         value:'error'
    //       }
    //       await changeStatus(putBody_workStat)
    //       endLoad();
    //       return event;
    //     } else {
    //       putBody_workStat.record.syncStatus_stock={
    //         value:'success'
    //       }
    //     }
    //     console.log('在庫連携に成功しました');
    //   }
    // } catch(e){
    //   alert('在庫連携で不明なエラーが発生しました');
    //   console.log(e);
    //   endLoad();
    //   return event;
    // }


    // レポート連携
    try{
      if(event.record.syncStatus_report.value!='success'){
        let reportLinkResult = await reportLink(event, 'execution')
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
    } catch(e){
      alert('レポート連携で不明なエラーが発生しました');
      console.log(e);
      endLoad();
      return event;
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
      event.record.syncStatus_batch.value
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
    console.log(sNumLinkResult);

    // 在庫連携
    let result_stockCTL = await ctl_stock_v2(event.record, sNumLinkResult.resp.shipData, 25, 31);
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

    // try{
    //   if(event.record.syncStatus_stock.value!='success'){
    //     let stockLinkResult = await stockLink(event)
    //     if(!stockLinkResult.result){
    //       console.log(stockLinkResult);
    //       await returnWorkStat(event);
    //       putBody_workStat.record.syncStatus_stock={
    //         value:'error'
    //       }
    //       await changeStatus(putBody_workStat)
    //       endLoad();
    //       return event;
    //     } else {
    //       putBody_workStat.record.syncStatus_stock={
    //         value:'success'
    //       }
    //     }
    //     console.log('在庫連携に成功しました');
    //   }
    // } catch(e){
    //   alert('在庫連携で不明なエラーが発生しました');
    //   console.log(e);
    //   endLoad();
    //   return event;
    // }


    // レポート連携
    try{
      if(event.record.syncStatus_report.value!='success'){
        let reportLinkResult = await reportLink(event, 'execution')
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
    } catch(e){
      alert('レポート連携で不明なエラーが発生しました');
      console.log(e);
      endLoad();
      return event;
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
        return {result: false, error: {target: 'updateQuality', code: 'updateQuality_notSnum'}};
        // list.value.qualityClass.value = '新品'
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

// 作業ステータスが出荷完了以外か、デバイス登録確認がエラーの場合処理を中止
function checkStat(status, batch){
  if(status!='出荷完了'){
    console.log('作業ステータスが出荷完了以外です。');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_notShipComp'}};
  }
  if(batch=='error'&&batch==''){
    alert('デバイス登録確認がエラーか空欄です。');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_error-syncStatus_batch'}};
  }
  return {result: true, error: {target: 'checkStat', code: 'checkStat_success'}};
}

async function sNumLink(event){
  try{
    let result_snCTL
    if(event.record.syncStatus_serial.value!='success'){
      if(event.record.ship_number.value=='') {
        alert('伝票番号が記入されていません。');
        return {result: false, error:  {target: 'sNumLink', code: 'sNumLink_not-ship_number'}};
      }
      if(event.record.shipping_datetime.value==''){
        alert('出荷日時が記入されていません。');
        return {result: false, error:  {target: 'sNumLink', code: 'sNumLink_not-shipping_datetime'}};
      }
      let sninfo = renew_sNumsInfo_alship_forDelivery(event.record, 'deviceList');
      if(sninfo.shipInfo.deviceInfo.length > 0){
        result_snCTL = await ctl_sNum('internal', sninfo);
        console.log(result_snCTL);
        if(!result_snCTL.result){
          console.log(result_snCTL.error.code);
          alert('シリアル連携のAPIに失敗しました');
          return {result: false, error: {target: 'sNumLink', code: 'ctl_sNumError'}};
        }
      } else {
        alert('連携するシリアル番号がありません');
        return {result: false, error: {target: 'sNumLink', code: 'notSnum'}};
      }
    } else {
      alert('シリアル連携は完了済みです');
      return {result: false, error: {target: 'sNumLink', code: 'sNumLink_Already-successful'}};
    }
    return {result: true, resp: result_snCTL, error: {target: 'sNumLink', code: 'sNumLink_success'}};
  } catch(e){
    alert('シリアル連携で不明なエラーが発生しました');
    return {result: false, message: e, error: {target: 'sNumLink', code: 'sNumLink_unknownError'}};
  }
}

async function stockLink(event){
  try{
    // 入荷用処理（distribute-ASSに在庫を増やす）
    for(const deviceList of event.record.deviceList.value){
      let arrivalJson = {
        app: sysid.INV.app_id.unit,
        id: '25',
        sbTableCode: 'mStockList',
        listCode: 'mCode',
        listValue:{}
      }
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
        let arrivalResult = await update_sbTable(arrivalJson)
        if(!arrivalResult.result){
          alert('入荷用在庫連携のAPIが失敗しました');
          return {result: false, error: {target: 'stockLink', code: 'stockLink_arrival-updateError'}};
        }
      }
    }

    // 出荷用処理（forneedsから在庫を減らす）
    for(const deviceList of event.record.deviceList.value){
      let shippingJson = {
        app: sysid.INV.app_id.unit,
        id: '31',
        sbTableCode: 'mStockList',
        listCode: 'mCode',
        listValue:{}
      }
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
        let shippingResult = await update_sbTable(shippingJson)
        if(!shippingResult.result){
          alert('出荷用在庫連携のAPIが失敗しました');
          return {result: false, error: {target: 'stockLink', code: 'stockLink_shipping-updateError'}};
        }
      }
    }
    return {result: true, error: {target: 'stockLink', code: 'stockLink_success'}};
  } catch(e){
    alert('在庫連携で不明なエラーが発生しました');
    return {result: false, message: e, error: {target: 'stockLink', code: 'stockLink_unknownError'}};
  }
}

async function reportLink(event, param){
  let operator;
  if(param=='execution'){
    operator='+'
  }else if(param=='cancel'){
    operator='-'
  } else {
    alert('引数が不足しています');
    return {result: false, error:  {target: 'reportLink', code: 'notOperator'}};
  }
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
      reportStockJson.listValue[deviceList.value.mCode.value+'-distribute-ASS']={
        updateKey_listCode: deviceList.value.mCode.value+'-distribute-ASS',
        updateKey_listValue:{
          'arrivalNum':{
            updateKey_cell: 'arrivalNum',
            operator: operator,
            value: parseInt(deviceList.value.shipNum.value)
          },
        }
      }
      reportStockJson.listValue[deviceList.value.mCode.value+'-forNeeds']={
        updateKey_listCode: deviceList.value.mCode.value+'-forNeeds',
        updateKey_listValue:{
          'shipNum':{
            updateKey_cell: 'shipNum',
            operator: operator,
            value: parseInt(deviceList.value.shipNum.value)
          },
        }
      }
      reportAssJson.listValue[deviceList.value.mCode.value]={
        updateKey_listCode: deviceList.value.mCode.value,
        updateKey_listValue:{
          'ASS_shipNum_new':{
            updateKey_cell: 'ASS_shipNum_new',
            operator: operator,
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
            operator: operator,
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