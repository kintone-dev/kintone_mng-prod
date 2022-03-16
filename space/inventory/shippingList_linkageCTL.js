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
            endLoad();
            event.error = '対応した日付のレポートは' + reportData[1] + '済みです。';
            return event;
          }
        }
      }
    }
    var nStatus = event.nextStatus.value;
    var cStatus = event.record.ステータス.value;
    if(cStatus === "出荷準備中" && nStatus === "集荷待ち"){
      // ＞＞＞ エラー処理 start ＜＜＜
      // 送付日未記入の場合エラー
      if(event.record.sendDate.value == null) {
        event.error = '送付日を記入して下さい。'
        endLoad();
        return event;
      }
      // 拠点間移動の場合、入荷拠点入力必須
      // if(event.record.shipType.value.match(/^(移動-拠点間|社内利用|貸与|修理・交換)$/) && event.record.sys_arrivalCode.value==''){
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
        // console.log(deviceListValue_mCode);
        // console.log(deviceListValue_mType);
        // console.log(deviceListValue_shipNum);
        // console.log(!deviceListValue_mCode.match(ship_uncheckList.mcode))
        // console.log(!deviceListValue_mType.match(ship_uncheckList.mtype))
        // 特定のものは除外
        // if(deviceListValue_mCode.match(ship_uncheckList.mcode) || deviceListValue_mType.match(ship_uncheckList.mtype)){
        // }else{
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
      let sninfo = renew_sNumsInfo_alship(event.record, 'deviceList');
      if(sninfo.result) event.error = sninfo.code;
      let shiptype = event.record.shipType.value;
      let result_snCTL = await ctl_sNum(setShiptype[shiptype], sninfo);
      // for temp
      if(!result_snCTL.result) return event.error = errorCode[result_snCTL.error.target] + errorCode[result_snCTL.error.code];
      console.log(result_snCTL);
      setlog_single({
        value: {
          sys_log_acction: {value: 'set sNums'},
          sys_log_value: {value: JSON.stringify(result_snCTL)}
        }
      },{
        fCode: 'sys_snResult',
        value: JSON.stringify(result_snCTL)
      });
      // 在庫処理書き込み
      let result_stockCTL = await ctl_stock(event.record, result_snCTL.shipData);
      // if(!result_stockCTL.result) return event.error = errorCode[result_stockCTL.error.target] + errorCode[result_stockCTL.error.code];
      setlog_single({
        value: {
          sys_log_acction: {value: 'set unit stock'},
          sys_log_value: {value: JSON.stringify(result_stockCTL)}
        }
      },null);
      // ＞＞＞ 各種処理開始 start ＜＜＜
    }
    // 
    endLoad();
    return event;
  });

  /** 実行関数 */
})();