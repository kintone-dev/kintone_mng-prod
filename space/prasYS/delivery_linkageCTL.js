(function() {
  'use strict';

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
  if(status=='準備中'||status=='TOASTCAM登録待ち'||status=='必要情報入力済み'){
    console.log('デバイス登録success');
  } else {
    if(batch=='error'||batch==''){
      alert('デバイス登録確認がエラーか空欄です。');
      return {result: false, error: {target: 'checkStat', code: 'checkStat_error-syncStatus_batch'}};
    }
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
          alert(event.error = result_snCTL.error.target + ': ' + errorCode[result_snCTL.error.code]);
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