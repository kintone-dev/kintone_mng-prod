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
    if(cStatus === "出荷準備中" && nStatus === "集荷待ち"){
      if(event.record.recordSplitType.value=='分岐'){
        console.log('分岐されたレコードです');
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
      if(sninfo.result) event.error = sninfo.code;
      // 要検証
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
        // for temp
        if(!result_snCTL.result){
          console.log(result_snCTL.error.code);
          event.error = result_snCTL.error.target + ': ' + errorCode[result_snCTL.error.code];
          endLoad();
          return event;
        }

        console.log(result_snCTL);
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
        // await setlog_single({
        //   value: {
        //     sys_log_acction: {value: 'linkage success'},
        //     sys_log_value: {value:JSON.stringify(result_snCTL)+'\n'+JSON.stringify(result_reportCTL)+'\n'+JSON.stringify(result_stockCTL)}
        //   }
        // },null);
      }
      // ＞＞＞ 各種処理 end ＜＜＜
    }
    // 出荷完了
    else if(cStatus === "集荷待ち" && nStatus === "出荷完了"){
      if(event.record.recordSplitType.value=='分岐'){
        /* デバイスリストをメインに更新 */
        let result_updateMain = await updateMain(24, event.record.deviceList.value)
        if(!result_updateMain.result){
          console.log(result_updateMain.error);
          event.error = 'メインの更新中にエラーが発生しました'
          endLoad();
          return event;
        }

      } else {
        // 導入案件管理に更新
        // if(event.record.prjId.value) {
        //   console.log('update to Project');
        //   console.log(event.record.prjId.value);
        //   let setShipInfo = await set_shipInfo(event);
        // }
      }
    }
    endLoad();
    return event;
  });

  /** 実行関数 */
})();

async function set_shipInfo(event){
  let newShinInfo = '\n' + event.record.deliveryCorp.value + ': ' + event.record.trckNum.value + '、発送日: ' +  event.record.sendDate.value +  '、納品予定日: ' +  event.record.expArrivalDate.value;
  console.log(newShinInfo);
  let get_projectShinInfo = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
    app: sysid.PM.app_id.project,
    id: event.record.prjId.value
  });
  console.log(get_projectShinInfo);
  let shipInfo = get_projectShinInfo.record.shipInfo.value;
  shipInfo += newShinInfo;
  console.log(shipInfo);
  let put_projectShinInfo = {
    app: sysid.PM.app_id.project,
    id: event.record.prjId.value,
    record:{
      shipInfo: {value: shipInfo}
    }
  };
  console.log(put_projectShinInfo);
  await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', put_projectShinInfo);
}

async function updateMain(mainId, subDeviceList){
  let mainRecord = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
    app: kintone.app.getId(),
    id: mainId
  });
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
    mainDevice.push({value:subDevice[i].value})
  }
  let updateJson = {
    app: kintone.app.getId(),
    id: '',
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