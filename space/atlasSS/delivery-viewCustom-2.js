(function () {
  'use strict';
  // kintone.events.on('app.record.create.submit.success', function (event) {

  //   var application_type = event.record.application_type.value;
  //   if (application_type == '新規申込') {
  //     var new_memID = {
  //       'app': sysid.ASS.app_id.member,
  //       'record': {
  //         'member_id': {
  //           'value': event.record.member_id.value
  //         },
  //         'member_type': {
  //           'value': event.record.member_type.value
  //         },
  //         'application_datetime': {
  //           'value': event.record.application_datetime.value
  //         },
  //         'toastcam_bizUserId': {
  //           'value': event.record.toastcam_bizUserId.value
  //         },
  //         'application_type': {
  //           'value': event.record.application_type.value
  //         }
  //       }
  //     };

  //     kintone.api(kintone.api.url('/k/v1/record', true), 'POST', new_memID).then(function (resp) {
  //       console.log(resp);
  //     }).catch(function (error) {
  //       console.log(error);
  //     });
  //   }
  //   return event;
  // });
  kintone.events.on('app.record.create.submit', async function(event){
    const memberId = event.record.member_id.value;
    const get_applicationType = '新規申込';
    const applicationType = event.record.application_type.value;
    const get_appCampaign = (await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: sysid.ASS2.app_id.shipment,
      query: 'member_id = "' + memberId + '" and application_type in ("' + get_applicationType + '")',
      fields: ['member_id']
    })).records;
    if(get_appCampaign == undefined){
      event.record.member_id.error = '不明なエラー';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else if(applicationType == get_applicationType && get_appCampaign.length > 0){
      event.record.member_id.error = '契約ID: ' + get_appCampaign[0].member_id.value + '\n同じ契約IDで、申し込み種別が新規申込になっているデータが既に存在します。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else if(applicationType !== get_applicationType && get_appCampaign.length < 1){
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
      setFieldShown('deviceList', false);
      setFieldShown('failure_sNum', true);
      setFieldShown('replacement_sNum', true);
      setFieldShown('failure_sNum_info', true);
    } else {
      setFieldShown('deviceList', true);
      setFieldShown('failure_sNum', false);
      setFieldShown('replacement_sNum', false);
      setFieldShown('failure_sNum_info', false);
    }
    return event;
  });
  kintone.events.on('app.record.create.change.application_type', function (event) {
    var aType = event.record.application_type.value;
    if (aType.match(/故障交換/)) {
      setFieldShown('deviceList', false);
      setFieldShown('failure_sNum', true);
      setFieldShown('replacement_sNum', true);
      setFieldShown('failure_sNum_info', true);
    } else {
      setFieldShown('deviceList', true);
      setFieldShown('failure_sNum', false);
      setFieldShown('replacement_sNum', false);
      setFieldShown('failure_sNum_info', false);
    }
    return event;
  });
  // kintone.events.on('app.record.detail.process.proceed', function (event) {
  //   var nStatus = event.nextStatus.value;
  //   if (nStatus === "送付済み？") {
  //     //パラメータsNumInfoにjsonデータ作成
  //     var sNumInfo = {
  //       'app': sysid.DIPM.app.sn,
  //       'records': []
  //     };
  //     var shipTable = event.record.deviceList.value;
  //     var shipIName = event.record.instName.value;
  //     var shipShipment = event.record.shipment.value;

  //     for(let i in shipTable) {
  //       var ship_member_id = shipTable[i].value.member_id.value;
  //       var ship_shipnum = shipTable[i].value.shipNum.value;
  //       var ship_sn = shipTable[i].value.sNum.value;
  //       //get serial numbers
  //       var get_sNums = ship_sn.split(/\r\n|\n/);
  //       //except Boolean
  //       var sNums = get_sNums.filter(Boolean);

  //       for(let y in sNums) {
  //         var snRecord = {
  //           'updateKey': {
  //             'field': 'sNum',
  //             'value': sNums[y]
  //           },
  //           'record': {
  //             'member_id': {
  //               'value': ship_member_id
  //             },
  //             'instName': {
  //               'value': shipInstName
  //             },
  //             'shipment': {
  //               'value': shipShipment
  //             }
  //           }
  //         };
  //         sNumInfo.records.push(snRecord);
  //       }
  //     }
  //     var setSNinfo = new kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', sNumInfo);
  //     return setSNinfo.then(function (resp) {
  //       console.log('update success');
  //     }).catch(function (error) {
  //       console.log('update error' + error.message);
  //       console.log(error);
  //     });
  //   }
  // });
  // kintone.events.on('app.record.edit.show', function(event){
  //   // let alResult=event.record.sys_alResult.value;
  //   let workingstatus=event.record.working_status.value;
  //   let applicationType=event.record.application_type.value;
  //   /**
  //    * 申込種別＝新規申込
  //    * 作業ステータス＝準備中
  //    * 会員情報連携実績なし(alResult not in meminfo)
  //    */
  //   if(applicationType=='新規申込' && workingstatus=='準備中' && !alResult.match(/meminfo/)){
  //     alert('会員情報が連携されていません。先に「KT-情報連携」ボタンをクリックして会員情報を連携してください。');
  //     window.history.back(-1);
  //     return false;
  //   }
  // })
  // kintone.events.on(['app.record.edit.submit'], function(event){
  //   // let alResult=event.record.sys_alResult.value;
  //   let workingstatus=event.record.working_status.value;
  //   let applicationType=event.record.application_type.value;

  //   // 保存不可条件
  //   /**
  //    * 申込種別＝新規申込
  //    * 作業ステータス！＝準備中
  //    * 会員情報連携実績なし(alResult not in meminfo)
  //    */
  //   // if(applicationType=='新規申込' && workingstatus!=='準備中' && !alResult.match(/meminfo/)){
  //   //   event.error='会員情報が連携されていません。先に会員情報を連携してください。';
  //   // }
  //   /**
  //    * 作業ステータス＝出荷完了
  //    * シリアル情報連携実績なし（alResult not in sNum）
  //    */
  //   if(workingstatus=='出荷完了' && !alResult.match(/sNum/)){
  //     event.error='作業ステータスを一旦「集荷待ち」にして「KT-情報連携」ボタンを押してから「出荷完了」に変更してください。';
  //   }
  //   /**
  //    * 作業ステータス＝/着荷完了|持ち戻り|再配達依頼|再配達中|配達中止/
  //    * 在庫処理未実行（alResult not in stock）
  //    */
  //   if(workingstatus==/着荷完了|持ち戻り|再配達依頼|再配達中|配達中止/ && !alResult.match(/stock/)){
  //     event.error='作業ステータスを一旦「出荷完了」にして「KT-情報連携」ボタンを押してから「'+workingstatus+'」に変更してください。';
  //   }
  //   return event;
  // });
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