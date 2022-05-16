(function(){
  'use strict';
  /** データ連携 */
  // 保存成功
  kintone.events.on('app.record.create.submit.success', async function (event) {
    startLoad();
    // ＞＞＞ 各種処理開始 start ＜＜＜
    // シリアルチェック＆書き込み
    let sninfo = renew_sNumsInfo_alship(event.record, 'deviceList');
    if(sninfo.result) event.error = sninfo.code;
    let shiptype = event.record.shipType.value;
    console.log(setShiptype[shiptype]);
    // let result_snCTL = await ctl_sNum(setShiptype[shiptype], sninfo);
    // let result_snCTL = await ctl_sNum('all', sninfo);
    // for temp
    // if(!result_snCTL.result){
    //   console.log(result_snCTL.error.code);
    //   event.error = result_snCTL.error.target + ': ' + errorCode[result_snCTL.error.code];
    //   console.log(event);
    //   return event;
    // }

    // console.log(result_snCTL);
    // setlog_single({
    //   value: {
    //     sys_log_acction: {value: 'set sNums'},
    //     sys_log_value: {value: JSON.stringify(result_snCTL)}
    //   }
    // },{
    //   fCode: 'sys_snResult',
    //   value: JSON.stringify(result_snCTL)
    // });
    // // 在庫処理書き込み
    // let result_stockCTL = await ctl_stock(event.record, result_snCTL.shipData);
    // // if(!result_stockCTL.result) return event.error = errorCode[result_stockCTL.error.target] + errorCode[result_stockCTL.error.code];
    // setlog_single({
    //   value: {
    //     sys_log_acction: {value: 'set unit stock'},
    //     sys_log_value: {value: JSON.stringify(result_stockCTL)}
    //   }
    // },null);
    // ＞＞＞ 各種処理開始 start ＜＜＜

    endLoad();
    return event;
  });
})();