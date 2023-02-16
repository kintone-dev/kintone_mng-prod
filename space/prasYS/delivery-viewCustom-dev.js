(function () {
  'use strict';
  // 入力確認
  kintone.events.on(['app.record.edit.show','app.record.edit.submit'], async function(event){
    const memberId = event.record.member_id.value;
    const tar_applicationType = '新規申込';
    const applicationType = event.record.application_type.value;
    /**
     * 新規申込の契約ID重複
     * 追加申込の契約ID該当なし
     */
    const get_appCampaign = (await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: sysid.prasYSDev.app_id.shipment,
      query: 'member_id = "' + memberId + '" and application_type in ("' + tar_applicationType + '") and $id != "' + kintone.app.record.getId() + '"',
      fields: ['member_id']
    })).records;
    if(get_appCampaign == undefined){
      event.record.member_id.error = '不明なエラー';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else if(applicationType == tar_applicationType && get_appCampaign.length > 0){
      event.record.member_id.error = '契約ID: ' + get_appCampaign[0].member_id.value + '\n同じ契約IDで、申し込み種別が新規申込になっているデータが既に存在します。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else if(applicationType !== tar_applicationType && get_appCampaign.length < 1){
      event.record.member_id.error = '契約ID: ' + memberId + '\n存在しない契約IDです。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }
    return event;
  });



  var events_aType_show = [
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show'
  ];
  kintone.events.on(events_aType_show, function (event) {
    var aType = event.record.application_type.value;
    if (aType.match(/故障交換/)) {
      // setFieldShown('deviceList', false);
      setFieldShown('failure_sNum', true);
      setFieldShown('replacement_sNum', true);
      setFieldShown('failure_sNum_info', true);
    } else {
      // setFieldShown('deviceList', true);
      setFieldShown('failure_sNum', false);
      setFieldShown('replacement_sNum', false);
      setFieldShown('failure_sNum_info', false);
    }
    return event;
  });
  kintone.events.on('app.record.create.change.application_type', function (event) {
    var aType = event.record.application_type.value;
    if (aType.match(/故障交換/)) {
      // setFieldShown('deviceList', false);
      setFieldShown('failure_sNum', true);
      setFieldShown('replacement_sNum', true);
      setFieldShown('failure_sNum_info', true);
    } else {
      // setFieldShown('deviceList', true);
      setFieldShown('failure_sNum', false);
      setFieldShown('replacement_sNum', false);
      setFieldShown('failure_sNum_info', false);
    }
    return event;
  });
  kintone.events.on(['app.record.create.submit','app.record.edit.submit'], function(event){
    let ship_deviceList=event.record.deviceList.value;
    for(let i in ship_deviceList){
      if(ship_deviceList[i].value.mCode.value=='TC-UB12F-M'){
        // let SNsQuery=sNumRecords(ship_deviceList[i].value.sNum.value, 'text').SNs.join('","');
        let SNsQuery=ship_deviceList[i].value.sNum.value;
        let get_Mac={
          'app': sysid.DEV.app_id.sNum,
          'query':'sNum in ("'+SNsQuery+'")'
        }
        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', get_Mac).then(function(resp){
          console.log(resp);
          for(let y in resp.records){
            let remarks=ship_deviceList[i].value.shipRemarks.value;
            if(y==0){
              if(remarks==undefined) ship_deviceList[i].value.shipRemarks.value='\n＝＝＝MAC address＝＝＝\n'+resp.records[y].macaddress.value;
              else ship_deviceList[i].value.shipRemarks.value+='\n＝＝＝MAC address＝＝＝\n'+resp.records[y].macaddress.value;
            }else ship_deviceList[i].value.shipRemarks.value+='\n'+resp.records[y].macaddress.value;
          }
          console.log(event.record.deviceList.value);
          return event;
        }).catch(function(error){
          console.log(error);
        });
      }
    }
    return event;
  });
  kintone.events.on('app.record.edit.submit', function(event){
    const workingstatus = event.record.working_status.value;
    if(workingstatus == '出荷完了'){
      const syncstatusbatch = event.record.syncStatus_batch.value;
      const shipnumber = event.record.ship_number.value;
      const shippingdatetime = event.record.shipping_datetime.value;
      console.log(syncstatusbatch);
      console.log(shipnumber);
      console.log(shippingdatetime);
      if(syncstatusbatch == 'error' || syncstatusbatch == '' || !syncstatusbatch){
        event.error = 'デバイス登録処理に問題があります。\nレコードを保存できませんでした。エラー内容をご確認ください。';
      }
      if(!shipnumber){
        event.record.ship_number.error = '伝票番号が空欄です。';
        event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
      }
      if(!shippingdatetime){
        event.record.shipping_datetime.error = '出荷日時が空欄です。';
        event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
      }
    }
    return event;
  });
})();