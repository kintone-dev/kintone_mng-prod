(function() {
  'use strict';
  kintone.events.on(['app.record.create.submit.success','app.record.edit.submit.success'],async function(event) {
    console.log(event.record);
    if(event.record.working_status.value!='出荷完了'){
      console.log('作業ステータスが出荷完了以外です。');
      return event;
    }
    if(event.record.syncStatus_batch.value=='error'){
      console.log('デバイス登録確認がエラーです。');
      return event;
    }
    // シリアル連携
    if(event.record.syncStatus_serial.value!='success'){
      if(event.record.slip_number.value==''||event.record.shipping_datetime.value==''){
        console.log('伝票番号か出荷日時が空欄です。');
        return event;
      }
      let sninfo = renew_sNumsInfo_alship_forDelivery(event.record, 'deviceList');
      console.log(sninfo);
      if(sninfo.shipInfo.deviceInfo.length > 0){
        let result_snCTL = await ctl_sNum('all', sninfo);
        if(!result_snCTL.result){
          console.log(result_snCTL.error.code);
          return event;
        }
      }

    }

    return event;
  });

})();
