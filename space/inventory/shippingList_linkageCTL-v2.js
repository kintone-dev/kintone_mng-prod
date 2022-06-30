(function(){
  'use strict';
  /** データ連携 */
  // プロセス実行
  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    startLoad();
    //レポート締め切りチェック
    if(event.record.sendDate.value != null){
      var sendDate = event.record.sendDate.value;
      sendDate = sendDate.replace(/-/g, '');
      sendDate = sendDate.slice(0, -2);
      var reportData = await checkEoMReport(sendDate, kintone.getLoginUser());
      if(Array.isArray(reportData)){
        if (reportData[0] == 'false') {
          event.error = '対応した日付のレポートは' + reportData[1] + '済みです。';
          endLoad();
          return event;
        } else if(reportData[0] == 'true'){
          if(!confirm('対応した日付のレポートは' + reportData[1] + '済みです。\n作業を続けますか？')){
            event.error = '対応した日付のレポートは' + reportData[1] + '済みです。';
            endLoad();
            return event;
          }
        }
      }
    }
    var nStatus = event.nextStatus.value;
    var cStatus = event.record.ステータス.value;
    // if(cStatus === "出荷準備中" && nStatus === "集荷待ち"){
    if(cStatus === "集荷待ち" && nStatus === "出荷完了"){
      // 分岐データ用処理
      if(event.record.recordSplitType.value=='分岐'){
        /* デバイスリストをメインに更新 */
        let result_updateMain = await updateMain(event.record.sys_recordSplitCode.value, event.record.deviceList.value)
        if(!result_updateMain.result){
          event.error = result_updateMain.error.target + ': ' + errorCode[result_updateMain.error.code];
          endLoad();
          return event;
        }
        endLoad();
        return event;
      }
      // ＞＞＞ エラー処理 start ＜＜＜
      // 送付日未記入の場合エラー
      if(event.record.sendDate.value == null) {
        event.error = '送付日を記入して下さい。'
        endLoad();
        return event;
      }
      // 拠点間移動の場合、入荷拠点入力必須
      if(event.record.shipType.value.match(/^(移動-拠点間)$/) && event.record.sys_arrivalCode.value==''){
        event.error = '入荷拠点を「施工業者/拠点」から選択してください。'
        endLoad();
        return event;
      }
      // 依頼数と出荷シリアル数チェック
      let deviceListValue = event.record.deviceList.value;
      let sNums = sNumRecords(deviceListValue, 'table');
      for (let i in deviceListValue) {
        let deviceListValue_mCode = deviceListValue[i].value.mCode.value;
        let deviceListValue_mType = deviceListValue[i].value.mType.value;
        let deviceListValue_shipNum = deviceListValue[i].value.shipNum.value;
        if(!(deviceListValue_mCode.match(ship_uncheckList.mcode) || deviceListValue_mType.match(ship_uncheckList.mtype))){
          // 依頼数と出荷シリアル数が一致しない場合エラー
          if (deviceListValue_shipNum != sNums[deviceListValue_mCode].length) {
            event.error = `製品名「${deviceListValue[i].value.mNickname.value}」の依頼数と出荷数が一致しません。`;
            endLoad();
            return event;
          }
        }
      }
      // ＞＞＞ エラー処理 end ＜＜＜
      // ＞＞＞ 各種処理開始 start ＜＜＜
      // シリアルチェック＆書き込み
      let sninfo = renew_sNumsInfo_alship_forShippingv2(event.record, 'deviceList');
      if(sninfo.shipInfo.deviceInfo.length > 0){
        let result_snCTL
        if(event.record.shipType.value.match(/サブスク|販売/)){
          result_snCTL = await ctl_sNumv2('newship', sninfo);
        } else if(event.record.shipType.value.match(/社内利用/)){
          result_snCTL = await ctl_sNumv2('internal', sninfo);
        } else if(event.record.shipType.value.match(/PoC|修理・交換/)){
          result_snCTL = await ctl_sNumv2('auto', sninfo);
        } else if(event.record.shipType.value.match(/拠点間移動|修理・交換/)){
          result_snCTL = await ctl_sNumv2('all', sninfo);
        } else {
          console.log('出荷区分に問題があります');
          endLoad();
          return event;
        }
        if(!result_snCTL.result){
          console.log(result_snCTL.error.code);
          event.error = result_snCTL.error.target + ': ' + errorCode[result_snCTL.error.code];
          endLoad();
          return event;
        }
        // 在庫処理書き込み
        let result_stockCTL
        if(event.record.shipType.value.match(/修理・交換/)){
          result_stockCTL = await ctl_stock_v2(event.record, result_snCTL.shipData, null, event.record.sys_shipmentId.value);
        }else {
          result_stockCTL = await ctl_stock_v2(event.record, result_snCTL.shipData, event.record.sys_destinationId.value, event.record.sys_shipmentId.value);
        }
        if(!result_stockCTL.result){
          console.log(result_stockCTL.error.code);
          event.error = result_stockCTL.error.target + ': ' + errorCode[result_snCTL.error.code];
          endLoad();
          return event;
        }
        // レポート処理書込み
        let result_reportCTL
        if(event.record.shipType.value.match(/修理・交換/)){
          result_reportCTL = await ctl_report_v2(event.record, result_snCTL.shipData, null, event.record.sys_shipmentCode.value);
        } else {
          result_reportCTL = await ctl_report_v2(event.record, result_snCTL.shipData, event.record.sys_destinationCode.value, event.record.sys_shipmentCode.value);
        }
        if(!result_reportCTL.result){
          console.log(result_reportCTL.error.code);
          event.error = result_reportCTL.error.target + ': ' + errorCode[result_reportCTL.error.code];
          endLoad();
          return event;
        }
      }

      // 導入案件管理に更新
      if(event.record.prjId.value!=''){
        let result_updateProject = await updateProject(event.record.prjId.value, event.record.deviceList.value);
        if(!result_updateProject.result){
          event.error = result_updateProject.error.target + ': ' + errorCode[result_updateProject.error.code];
          endLoad();
          return event;
        }
      }
    }
    endLoad();
    return event;
  });
})();

async function updateProject(prjId, deviceList){
  // 分岐データが全て出荷完了か確認
  let getSubStatQuery = {
    'app': kintone.app.getId(),
    'query': 'ステータス not in ("出荷完了") and sys_recordSplitCode = "'+ kintone.app.record.getId() +'"'
  };
  let subDataStat = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getSubStatQuery)
    .then(function (resp) {
      return resp;
    });
  if(subDataStat.records.length>1){
    return {result: false, error: {target: 'updateProject', code: 'updateProject_wrongSubDataStat'}};
  }
  let prjData = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
    app: sysid.PM.app_id.project,
    id: prjId
  });
  let prjDevice = prjData.record.deviceList.value;
  let shipDevice = deviceList.concat();
  // sys_listIdで比較
  for(const i in prjDevice){
    for(const j in shipDevice){
      if(prjDevice[i].id==shipDevice[j].value.sys_listId.value){
        prjDevice[i].value.mNickname.value = shipDevice[j].value.mNickname.value
        prjDevice[i].value.shipNum.value = shipDevice[j].value.shipNum.value
        prjDevice[i].value.subBtn.value = shipDevice[j].value.subBtn.value
        prjDevice[i].value.shipRemarks.value = shipDevice[j].value.shipRemarks.value
        shipDevice.splice(j,1)
      }
    }
  }
  // sys_listIDが無い新規のデバイスを追加
  for(const i in shipDevice){
    if(shipDevice[i].value.sys_listId.value!=''){
      return {result: false, error: {target: 'updateProject', code: 'updateProject_notData'}};
    }
    prjDevice.push({value: shipDevice[i].value})
  }

  let updateJson = {
    app: sysid.PM.app_id.project,
    id: prjId,
    record:{
      deviceList: {
        value: prjDevice
      }
    }
  };

  console.log(updateJson);
  try{
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateJson);
  } catch(e){
    return {result: false, error: {target: 'updateProject', code: 'updateProject_apiError'}};
  }
  return {result: true, error: {target: 'updateProject', code: 'updateProject_success'}};
}

async function updateMain(mainId, subDeviceList){
  let mainRecord = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
    app: kintone.app.getId(),
    id: mainId
  });
  if(mainRecord.record['ステータス'].value=='出荷完了'){
    return {result: false, error: {target: 'updateMain', code: 'updateMain_alreadyShipComp'}};
  }
  let mainDevice = mainRecord.record.deviceList.value;
  let subDevice = subDeviceList.concat();
  // sys_listIdで比較
  for(const i in mainDevice){
    for(const j in subDevice){
      if(mainDevice[i].id==subDevice[j].value.sys_listId.value){
        mainDevice[i].value.sys_recordSplitStatus.value = subDevice[j].value.sys_recordSplitStatus.value
        mainDevice[i].value.recordSplit.value = subDevice[j].value.recordSplit.value
        mainDevice[i].value.mNickname.value = subDevice[j].value.mNickname.value
        mainDevice[i].value.shipNum.value = subDevice[j].value.shipNum.value
        mainDevice[i].value.subBtn.value = subDevice[j].value.subBtn.value
        mainDevice[i].value.cmsID.value = subDevice[j].value.cmsID.value
        mainDevice[i].value.sNum.value = subDevice[j].value.sNum.value
        mainDevice[i].value.shipRemarks.value = subDevice[j].value.shipRemarks.value
        subDevice.splice(j,1)
      }
    }
  }
  // sys_listIDが無い新規のデバイスを追加
  for(const i in subDevice){
    if(subDevice[i].value.sys_listId.value!=''){
      return {result: false, error: {target: 'updateMain', code: 'updateMain_notMainData'}};
    }
    mainDevice.push({value:subDevice[i].value})
  }
  let updateJson = {
    app: kintone.app.getId(),
    id: mainId,
    record: {
      deviceList: {
        value: mainDevice
      }
    }
  }
  console.log(updateJson);
  try{
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateJson);
  } catch(e){
    console.log(e);
    return {result: false, error: {target: 'updateMain', code: 'updateMain_apiError'}};
  }
  return {result: true, error: {target: 'updateMain', code: 'updateMain_success'}};
}