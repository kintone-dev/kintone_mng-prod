(function() {
  'use strict';
  kintone.events.on('app.record.edit.submit',async function(event) {
    startLoad();

    // 状態確認
    let checkStatResult = checkStat(
      event.record.churn_status.value,
      event.record.rDate.value
    );
    if(!checkStatResult.result){
      console.log(checkStatResult);
      if(checkStatResult.code=='checkStat_emptyRdate'){
        event.record.churn_status.value = 'デバイス返品受付';
      }
      endLoad();
      return event;
    }

    // 返却待ちのものをチェック
    let returnResult = await returnCheck(event)
    if(!returnResult.result){
      console.log(returnResult);
      endLoad();
      return event;
    } else {
      if(returnResult.resp.length!=0){
        event.record.device_info.value = returnResult.resp;
      }
    }

    // シリアル連携
    let sNumLinkCheck
    if(event.record.syncStatus_sNum.value!='success'){
      let sNumLinkResult = await sNumLink(event)
      if(!sNumLinkResult.result){
        console.log(sNumLinkResult);
        event.record.syncStatus_sNum.value = 'error';
        endLoad();
        return event;
      } else {
        sNumLinkCheck=true
        event.record.syncStatus_sNum.value = 'success';
      }
    }

    if(sNumLinkCheck){
      event.record.churn_status.value = '検品終了';
    } else {
      endLoad();
      return event
    }
    alert('登録成功しました。\n次の作業に進めてください')
    endLoad();
    return event;
  });

  kintone.events.on('app.record.create.submit',async function(event) {
    startLoad();

    // 状態確認
    let checkStatResult = checkStat(
      event.record.churn_status.value,
      event.record.rDate.value
    );
    if(!checkStatResult.result){
      console.log(checkStatResult);
      if(checkStatResult.code=='checkStat_emptyRdate'){
        event.record.churn_status.value = 'デバイス返送受付';
      }
      endLoad();
      return event;
    }

    // 返却待ちのものをチェック
    let returnResult = await returnCheck(event)
    if(!returnResult.result){
      console.log(returnResult);
      endLoad();
      return event;
    } else {
      if(returnResult.resp.length!=0){
        event.record.device_info.value = returnResult.resp;
      }
    }

    // シリアル連携
    let sNumLinkCheck
    if(event.record.syncStatus_sNum.value!='success'){
      let sNumLinkResult = await sNumLink(event)
      if(!sNumLinkResult.result){
        console.log(sNumLinkResult);
        event.record.syncStatus_sNum.value = 'error';
        endLoad();
        return event;
      } else {
        sNumLinkCheck=true
        event.record.syncStatus_sNum.value = 'success';
      }
    }

    if(sNumLinkCheck){
      event.record.churn_status.value = '検品終了';
    } else {
      endLoad();
      return event
    }
    alert('登録成功しました。\n次の作業に進めてください')
    endLoad();
    return event;
  });

  kintone.events.on('app.record.create.submit.success',async function(event) {
    let updateJson = {
      app: kintone.app.getId(),
      id: event.record.recordNum.value,
      record:{
        firstRecordNum:{
          value: event.record.recordNum.value
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
      alert('初回受付IDの登録に失敗しました')
      return event;
    }
    return event;
  });

})();

function checkStat(status, rdate){
  // 作業ステータスチェック
  if(status!='検品終了'){
    console.log('作業ステータスが検品終了以外です');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_wrongStat'}};
  }
  // 検品日チェック
  if(rdate==''){
    alert('検品日が空欄です');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_emptyRdate'}};
  }
  return {result: true, error: {target: 'checkStat', code: 'checkStat_success'}};
}

async function returnCheck(event){
  // 返却待ち確認
  let returnArray = [];
  let notReturnArray = [];
  for(const deviceList of event.record.device_info.value){
    if(deviceList.value.sState.value=='返却待ち'){
      returnArray.push(deviceList)
    } else {
      notReturnArray.push(deviceList)
    }
  }
  let returnCheck;
  if(returnArray.length!=0&&notReturnArray.length<=0){
    alert('返却待ちの品目しか登録されていません');
    return {result: false, error: {target: 'returnCheck', code: 'returnCheck_notReturn'}};
  } else if(returnArray.length!=0&&notReturnArray.length>0){
    returnCheck = confirm('返却待ちの品目が'+returnArray.length+'個あります')
  } else {
    return {result: true, resp: notReturnArray, error: {target: 'returnCheck', code: 'returnCheck_notReturn'}};
  }
  if(!returnCheck){
    alert('処理を中止します');
    return {result: false, error: {target: 'returnCheck', code: 'returnCheck_stop'}};
  }
  // レコード分割処理
  let postBody_returnData = {
    'app': kintone.app.getId(),
    'record': {
      churn_status: { value: '申込' },
      churn_datetime: { value: event.record.churn_datetime.value },
      churn_type: { value: event.record.churn_type.value },
      firstRecordNum: { value: event.record.recordNum.value },
      member_id: { value: event.record.member_id.value },
      device_info: { value: returnArray },
    }
  };
  let returnPost = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', postBody_returnData)
    .then(function (resp) {
      return {
        result: true,
        message: resp
      };
    }).catch(function (error) {
      console.log(error);
      return {
        result: false,
        message: error
      };
    });
  if(!returnPost.result){
    console.log('返却待ち品目のPOSTに失敗しました');
    return {result: false, error: {target: 'returnCheck', code: 'returnCheck_postError'}};
  }

  return {result: true, resp: notReturnArray, error: {target: 'returnCheck', code: 'returnCheck_success'}};
}

async function sNumLink(event){
  /* ＞＞＞ 更新用json作成 ＜＜＜ */
  let updateBody={app:sysid.DEV.app_id.sNum, records:[]}
  for(const device of event.record.device_info.value){
    // 既存のデータを取得
    let snRecords = (await getRecords({app: sysid.DEV.app_id.sNum, filterCond: 'sNum = "' + device.value.device_serial_number.value + '"'})).records;
    if(snRecords.length<1){
      alert(device.value.device_serial_number.value+'は登録されていないシリアル番号です。')
      return {result: false, error: {target: 'sNumLink', code: 'sNumLink_getError'}};
    }
    if(sStateMatchTable[device.value.sState.value]){
      let set_updateRecord={
        id: device.value.sys_sn_recordId.value,
        record: {
          sState: { value: sStateMatchTable[device.value.sState.value] },
          returnDate: { value: event.record.rDate.value },
          returnCheacker: { value: kintone.getLoginUser().name },
          storageLocation: { value: 'For Needs' },
          sys_history: { value: snRecords[0].sys_history.value }
        }
      };
      set_updateRecord.record.sys_history.value.push({
        value:{
          sys_infoFrom: {
            value: kintone.app.getId()+'-'+event.record.$id.value
          },
          sys_history_obj: {
            value: JSON.stringify({fromAppId: kintone.app.getId(), lastState: snRecords[0].sState.value})
          }
        }
      });
      updateBody.records.push(set_updateRecord);
    }
  }

  /* ＞＞＞ シリアル管理連携 ＜＜＜ */
  let response_PUT;
  if(updateBody.records.length>0){
    console.log('シリアル番号更新データ：');
    console.log(updateBody);
    // 更新API実行後、レスポンス内容をjsonにし変数に格納
    response_PUT = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody)
      .then(function (resp) {
        return { stat: 'success', message: resp };
      }).catch(function (error) {
        console.log(error);
        return { stat: 'error', message: error };
      });
    if(response_PUT.stat=='error'){
      alert('シリアル連携のAPIに失敗しました\n'+response_PUT.message.message);
      return {result: false, error: {target: 'sNumLink', code: 'sNumLink_updateError'}};
    }
  } else {
    // 更新内容がない場合、アラートを表示しreturn
    alert('更新データがありません。')
    return {result: false, error: {target: 'sNumLink', code: 'sNumLink_notUpdateData'}};
  }
  console.log('シリアル連携に成功しました');
  return {result: true, stat: response_PUT.stat, resp: response_PUT.message, error: {target: 'sNumLink', code: 'sNumLink_success'}};
}