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
    // ステータス更新内容
    var putBody_workStat = {
      'id': event.record.$id.value,
      'record': {
        syncStatus_serial: {},
        syncStatus_stock: {},
        syncStatus_report: {},
      }
    };
    // シリアル連携
    let result_snCTL
    if(event.record.syncStatus_serial.value!='success'){
      if(event.record.slip_number.value==''||event.record.shipping_datetime.value==''){
        console.log('伝票番号か出荷日時が空欄です。');
        return event;
      }
      let sninfo = renew_sNumsInfo_alship_forDelivery(event.record, 'deviceList');
      if(sninfo.shipInfo.deviceInfo.length > 0){
        result_snCTL = await ctl_sNum('internal', sninfo);
        if(!result_snCTL.result){
          console.log(result_snCTL.error.code);
          return event;
        }
        putBody_workStat.record.syncStatus_serial={
          value:'success'
        }
      }
    }

    // 在庫連携
    if(event.record.syncStatus_stock.value!='success'){
      // 入荷用json作成（distribute-ASS）
      let arrivalJson = {
        app: sysid.INV.app_id.unit,
        id: '4',
        sbTableCode: 'mStockList',
        listCode: 'mCode',
        listValue:{}
      }
      for(const deviceList of event.record.deviceList.value){
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
        }
      }
      console.log(arrivalJson);
      let arrivalResult = await update_sbTable(arrivalJson)

      // 出荷用json作成（forneeds）
      let shippingJson = {
        app: sysid.INV.app_id.unit,
        id: '16',
        sbTableCode: 'mStockList',
        listCode: 'mCode',
        listValue:{}
      }
      for(const deviceList of event.record.deviceList.value){
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
        }
      }
      let shippingResult = await update_sbTable(shippingJson)

      if(arrivalResult.result && shippingResult.result){
        putBody_workStat.record.syncStatus_stock={
          value:'success'
        }
      }
    }


    // レポート連携
    if(event.record.syncStatus_report.value!='success'){
      // レポート在庫連携用json作成
      let reportStockJson = {
        app: sysid.INV.app_id.report,
        id: '',
        sbTableCode: 'inventoryList',
        listCode: 'mCode',
        listValue:{}
      }
      // レポート在庫連携用json作成
      let reportAssJson = {
        app: sysid.INV.app_id.report,
        id: '',
        sbTableCode: 'AssShippingList',
        listCode: 'ASS_mCode',
        listValue:{}
      }
      let reportDate = new Date(event.record.shipping_datetime.value);
      let year = reportDate.getFullYear()
      let month = ("0" + (reportDate.getMonth()+1)).slice(-2)
      // レポート月のASS情報取得
      let getAssShipBody = {
        'app': sysid.INV.app_id.report,
        // 'query': 'sys_invoiceDate = "'+year+''+month+'"'
        'query': 'sys_invoiceDate = "205203"'
      };
      let reportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getAssShipBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
        console.log(reportData);
        if(reportData.records.length!=1){
          return event;
        }
        reportStockJson.id=reportData.records[0].$id.value;
        for(const deviceList of event.record.deviceList.value){
          if(deviceList.value.qualityClass.value=='新品'){
            reportStockJson.listValue[deviceList.value.mCode.value]={
              updateKey_listCode: deviceList.value.mCode.value,
              updateKey_listValue:{
                'shipNum':{
                  updateKey_cell: 'shipNum',
                  operator: '+',
                  value: deviceList.value.shipNum.value
                },
              }
            }
            reportAssJson.listValue[deviceList.value.mCode.value]={
              updateKey_listCode: deviceList.value.mCode.value,
              updateKey_listValue:{
                'shipNum':{
                  updateKey_cell: 'shipNum',
                  operator: '+',
                  value: deviceList.value.shipNum.value
                },
              }
            }
          }
        }

        console.log(reportStockJson);
        console.log(reportAssJson);

      }


    return event;
  });

})();
