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
      endLoad();
      return event;
    }

    // 返却待ちのものをチェック
    let returnResult = await returnCheck(event)
    if(!returnResult.result){
      endLoad();
      return event;
    } else {
      console.log(returnResult);
      if(returnResult.resp.length!=0){
        event.record.device_info.value = returnResult.resp;
      }
    }

    // シリアル連携
    let sNumLinkCheck
    if(event.record.syncStatus_sNum.value!='success'){
      let sNumLinkResult = await sNumLink(event)
      if(!sNumLinkResult.result){
        endLoad();
        return event;
      } else {
        sNumLinkCheck=true
        event.record.syncStatus_sNum.value = 'success';
      }
    }

    // レポート連携
    let reportLinkCheck
    if(event.record.syncStatus_report.value!='success'){
      let reportLinkResult = await reportLink(event)
      if(!reportLinkResult.result){
        endLoad();
        return event;
      } else {
        reportLinkCheck=true
        event.record.syncStatus_report.value = 'success';
      }
    }


    if(sNumLinkCheck&&reportLinkCheck){
      event.record.churn_status.value = '返品受領';
    } else {
      endLoad();
      return event
    }

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
      endLoad();
      return event;
    }

    // 返却待ちのものをチェック
    let returnResult = await returnCheck(event)
    if(!returnResult.result){
      endLoad();
      return event;
    } else {
      console.log(returnResult);
      if(returnResult.resp.length!=0){
        event.record.device_info.value = returnResult.resp;
      }
    }

    // シリアル連携
    let sNumLinkCheck
    if(event.record.syncStatus_sNum.value!='success'){
      let sNumLinkResult = await sNumLink(event)
      if(!sNumLinkResult.result){
        endLoad();
        event.record.syncStatus_sNum.value = 'error';
        return event;
      } else {
        sNumLinkCheck=true
        event.record.syncStatus_sNum.value = 'success';
      }
    }

    // レポート連携
    let reportLinkCheck
    if(event.record.syncStatus_report.value!='success'){
      let reportLinkResult = await reportLink(event)
      if(!reportLinkResult.result){
        endLoad();
        event.record.syncStatus_report.value = 'error';
        return event;
      } else {
        reportLinkCheck=true
        event.record.syncStatus_report.value = 'success';
      }
    }


    if(sNumLinkCheck&&reportLinkCheck){
      event.record.churn_status.value = '返品受領';
    } else {
      endLoad();
      return event
    }

    endLoad();
    return event;
  });

})();

function checkStat(status, rdate){
  // 作業ステータスチェック
  if(status!='デバイス返送受付'){
    console.log('作業ステータスがデバイス返送受付以外です');
    return {result: false, error: {target: 'checkStat', code: 'checkStat_wrongStat'}};
  }
  // 返品受領日チェック
  if(rdate==''){
    console.log('返品受領日が空欄です');
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
      数値: { value: event.record.数値.value },
      member_id: { value: event.record.member_id.value + 'returnItem' },
      device_info: {
        value: returnArray
      },
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
    if(sStateMatchTable[device.value.sState.value]){
      let set_updateRecord={
        id: device.value.sys_sn_recordId.value,
        record: { sState: {value: sStateMatchTable[device.value.sState.value]} }
      };
      updateBody.records.push(set_updateRecord);
    }
  }

  /* ＞＞＞ シリアル管理連携 ＜＜＜ */
  let response_PUT;
  if(updateBody.records.length>0){
    // 更新API実行後、レスポンス内容をjsonにし変数に格納
    response_PUT = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody)
      .then(function (resp) {
        return {
          stat: 'success',
          message: resp
        };
      }).catch(function (error) {
        console.log(error);
        return {
          stat: 'error',
          message: error
        };
      });
    if(response_PUT.stat=='error'){
      alert('シリアル連携のAPIに失敗しました');
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

async function reportLink(event){
  let reportDate = new Date(event.record.rDate.value);
  let year = reportDate.getFullYear()
  let month = ("0" + (reportDate.getMonth()+1)).slice(-2)
  // レポート月のASS情報取得
  let getAssShipBody = {
    'app': sysid.INV.app_id.report,
    'query': 'sys_invoiceDate = "'+year+''+month+'"'
  };
  console.log(getAssShipBody);
  let reportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getAssShipBody)
    .then(function (resp) {
      return {result: true, resp: resp, message:  {target: 'reportLink', code: 'reportLink_getSuccess'}};
    }).catch(function (error) {
      console.log(error);
      return {result: false, error:  {target: 'reportLink', code: 'reportLink_getError'}};
    });
  if(!reportData.result){
    console.log('レポートの取得に失敗しました');
    return reportData;
  }
  if(reportData.resp.length==0){
    console.log('該当するレポートがありません');
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_noData'}};
  }
  console.log(reportData);
  // レポート在庫連携用json作成
  let reportStockJson = {
    app: sysid.INV.app_id.report,
    id: '',
    sbTableCode: 'AssShippingList',
    listCode: 'ASS_mCode',
    listValue:{}
  }
  reportStockJson.id=reportData.resp.records[0].$id.value;
  for(const deviceList of event.record.device_info.value){
    if(deviceList.value.sState.value=='未開封'){
      reportStockJson.listValue[deviceList.value.device_item_code.value]={
        updateKey_listCode: deviceList.value.device_item_code.value,
        updateKey_listValue:{
          'ASS_returnNum_unopened':{
            updateKey_cell: 'ASS_returnNum_unopened',
            operator: '+',
            value: 1
          },
        }
      }
    } else if(deviceList.value.sState.value=='開封_補修不要'){
      reportStockJson.listValue[deviceList.value.device_item_code.value]={
        updateKey_listCode: deviceList.value.device_item_code.value,
        updateKey_listValue:{
          'ASS_returnNum_opened':{
            updateKey_cell: 'ASS_returnNum_opened',
            operator: '+',
            value: 1
          },
        }
      }
    } else if(deviceList.value.sState.value=='開封_補修済'){
      reportStockJson.listValue[deviceList.value.device_item_code.value]={
        updateKey_listCode: deviceList.value.device_item_code.value,
        updateKey_listValue:{
          'ASS_returnNum_opened_repaired':{
            updateKey_cell: 'ASS_returnNum_opened_repaired',
            operator: '+',
            value: 1
          },
        }
      }
    } else if(deviceList.value.sState.value=='再生不可'){
      reportStockJson.listValue[deviceList.value.device_item_code.value]={
        updateKey_listCode: deviceList.value.device_item_code.value,
        updateKey_listValue:{
          'ASS_returnNum_notreusable':{
            updateKey_cell: 'ASS_returnNum_notreusable',
            operator: '+',
            value: 1
          },
        }
      }
    } else if(deviceList.value.sState.value=='故障'){
      reportStockJson.listValue[deviceList.value.device_item_code.value]={
        updateKey_listCode: deviceList.value.device_item_code.value,
        updateKey_listValue:{
          'ASS_returnNum_broken':{
            updateKey_cell: 'ASS_returnNum_broken',
            operator: '+',
            value: 1
          },
        }
      }
    }
  }
  console.log(reportStockJson);
  let reportResult_stock = await update_sbTable(reportStockJson)
  if(!reportResult_stock.result){
    return {result: false, error:  {target: 'reportLink', code: 'reportLink_updateError'}};
  }

  return {result: true, error: {target: 'reportLink', code: 'reportLink_success'}};
}