(function(){
  'use strict';
  /** データ連携 */
  // プロセス実行
  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    startLoad();
    let nStatus = event.nextStatus.value;
    // 月末処理開始した対象月のレコードエラー処理
    // let result_reportDate=await check_reportDeadline('project', event.record.sys_invoiceDate.value);
    // if(result_reportDate.isRestrictedUserGroup){
    //   event.error = '作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みのため、作成できません。';
    //   endLoad();
    //   return event;
    // }else{
    //   if(!confirm('作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みです\nそれでも作業を続けますか？')){
    //     event.error = '作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みのため、作成できません。';
    //     endLoad();
    //     return event;
    //   }
    // }

    // ステータスが「入力内容確認中」になった時の動作
    if(nStatus == '入力内容確認中'){
      /** ステータス進行条件確認 */
      // 注文書なし承認条件？
      // let result_LoginUserGroup= await kintone.api(kintone.api.url('/v1/user/groups', true), 'GET', {code: kintone.getLoginUser().code});
      // // 注文書有無確認
      // if(event.record.purchaseOrder.value.length < 1){
      //   let inGroup = false;
      //   for(let i in result_LoginUserGroup.groups){
      //     if (result_LoginUserGroup.groups[i].name == '営業責任者' || result_LoginUserGroup.groups[i].name == 'sysAdmin') {
      //       inGroup = true;
      //       break;
      //     }
      //   }
      //   if(inGroup){
      //     if(!confirm('注文書なしで納品を先行してもよろしいですか?')) event.error = '注文書を添付するか営業責任者に承認を求めてください！';
      //   }else{
      //     event.error = '注文書を添付するか営業責任者に承認を求めてください！';
      //   }
      // }
      // プロセス実行確認（再確認）
      let confTxt = '';
      for(let i in confirmSetting){
        // 確認すべき内容作成
        confTxt = confTxt + confirmSetting[i].fName + ':' + event.record[confirmSetting[i].fCode].value + '\n';
      }
      // プロセス実行キャンセルした場合。
      if(!confirm(confTxt)){
        endLoad();
        return false;
      }

      /** データ連携 */
      // 入出荷管理と再生品管理にデータ連携できてない場合データ連携処理開始
      if(event.record.shipment_ID.value == ''){
        // ステータスを進めるための条件を満たしたが確認
        // [sResult]初期化
        let sResult = false;
        let deliveryArrangements = ['zipcode', 'prefectures', 'city', 'address', 'receiver', 'phoneNum', 'aboutDelivery', 'tarDate', 'deviceList'];
        for(let i in deliveryArrangements){
          // 「納品先選択」が担当手渡しの場合、確認不要項目をスキップ
          if(event.record.dstSelection.value == '担当手渡し') i = 4;
          if(event.record[deliveryArrangements[i]].value == ''){
            sResult = false;
            break;
          } else {
            sResult = true;
          }
        }
        if(event.record.aboutDelivery.value == '確認中'){
          sResult = false;
        }
        // ステータスを進めるための条件判定結果が[true]の場合処理開始
        if(sResult){
          // 導入形態が「POC（無償提供、貸与）」の場合、再生品管理にデータ連携(POST)
          // if(event.record.salesType.value == '無償提供' || event.record.salesType.value == '貸与')
          // var result_POST_rentData = POST_rentData(event);
          // 導入形態が「POC（無償提供、貸与）」以外の場合、入出荷管理にデータ連携(POST)
          // else
            var result_POST_shipData = await POST_shipData(event);
            if(!result_POST_shipData.result){
              event.error = result_POST_shipData.error.target + ': ' + errorCode[result_POST_shipData.error.code];
              endLoad();
              return event;
            }
            event.record.shipment_ID.value = result_POST_shipData.param;
        }else{
          event.error = 'ステータスを進めるに必要な項目が未入力です';
        }
      }
    }else if(nStatus == '納品準備中'){
      /** ステータス進行条件確認 */
      /** データ連携 */
      // 導入形態が「POC（無償提供、貸与）」以外の場合、入出荷管理にデータ連携(POT)
      let result_PUT_shipData = await PUT_shipData(event);
      if(!result_PUT_shipData.result){
        event.error = result_PUT_shipData.error.target + ': ' + errorCode[result_PUT_shipData.error.code];
        endLoad();
        return event;
      }
    }else if(nStatus == '完了'){
      /** ステータス進行条件確認 */

      /** データ連携 */
      // 導入形態が「POC（無償提供、貸与）」以外の場合、積送在庫から出荷処理
      if (event.record.salesType.value == '販売' || event.record.salesType.value == 'サブスク') {
        // 在庫処理
        await stockCtrl(event, kintone.app.getId());
        // レポート処理
        await reportCtrl(event, kintone.app.getId());
      }
    }
    endLoad();
    return event;
  });

})();
/** 実行関数 */
/**
 * 再生品管理にデータ連携 POST
 * @param {*} (json) event
 * @returns (jsone)event
 */
// async function POST_rentData(event){
//   // 再生品管理post用配列初期化
//   let postRentData = {'app': sysid.DEV.app_id.rental, 'records': []};
//   // 再生品管理post内容
//   let postRentBody = {
//     'pocType': {'value': event.record.salesType.value},
//     'aboutDelivery': {'value': event.record.aboutDelivery.value},
//     'tarDate': {'value': event.record.tarDate.value},
//     'returnDate': {'value': event.record.returnDate.value},
//     'returnCompDate': {'value': event.record.returnCompDate.value},
//     'receiver': {'value': event.record.receiver.value},
//     'phoneNum': {'value': event.record.phoneNum.value},
//     'zipcode': {'value': event.record.zipcode.value},
//     'prefectures': {'value': event.record.prefectures.value},
//     'city': {'value': event.record.city.value},
//     'address': {'value': event.record.address.value},
//     'buildingName': {'value': event.record.buildingName.value},
//     'corpName': {'value': event.record.corpName.value},
//     'deviceList': {'value': []},
//     'sys_prjNum': {'value': event.record.prjNum.value},
//     // 'sys_prjId': {'value': event.record.$id.value},
//     'prjId': {'value': event.record.$id.value},
//     'shipNote': {'value': event.record.prjMemo.value}
//   };
//   for(let i in event.record.deviceList.value){
//     let devListBody = {
//       'value': {
//         'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
//         'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value}
//       }
//     };
//     postRentBody.deviceList.value.push(devListBody);
//   }
//   postRentData.records.push(postRentBody);
//   // 再生品管理に情報連携
//   let postRentResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postRentData)
//     .then(function(resp){
//       return resp;
//     }).catch(function(error){
//       console.log(error);
//       return ['error', error];
//     });
//   if(Array.isArray(postRentResult)){
//     event.error = '再生品管理に情報連携する際にエラーが発生しました';
//     endLoad();
//     return event;
//   }else{
//     event.record.sys_rent_ID.value = postRentResult.ids[0];
//   }
// }

/**
 * 入出荷管理にデータ連携
 * @param {*} (json) event
 * @returns (jsone)event
 */
async function POST_shipData(event){
  // 入出荷管理post用配列初期化
  // let postShipData = {'app': sysid.INV.app_id.shipment, 'records': []};
  let postShipDatav2 = {'app': sysid.INV.app_id.shipmentv2, 'records': []};
  // 入出荷管理post内容
  let postShipBody = {
    // 'shipType': {'value': '確認中'},
    // 'aboutDelivery': {'value': event.record.aboutDelivery.value},
    // 'tarDate': {'value': event.record.tarDate.value},
    // 'dstSelection': {'value': event.record.dstSelection.value},
    // 'Contractor': {'value': event.record.Contractor.value},
    // 'instName': {'value': event.record.instName.value},
    // 'receiver': {'value': event.record.receiver.value},
    // 'phoneNum': {'value': event.record.phoneNum.value},
    // 'zipcode': {'value': event.record.zipcode.value},
    // 'prefectures': {'value': event.record.prefectures.value},
    // 'city': {'value': event.record.city.value},
    // 'address': {'value': event.record.address.value},
    // 'buildingName': {'value': event.record.buildingName.value},
    // 'corpName': {'value': event.record.corpName.value},
    // 'sys_instAddress': {'value': event.record.sys_instAddress.value},
    // 'sys_unitAddress': {'value': event.record.sys_unitAddress.value},
    'deviceList': {'value': []},
    'prjId': {'value': event.record.$id.value},
    // 'sys_prjId': {'value': event.record.$id.value},
    'prjNum': {'value': event.record.prjNum.value},
    'shipNote': {'value': event.record.prjMemo.value}
  };
  for(let i in event.record.deviceList.value){
    let devListBody = {
      'value': {
        'sys_listId': {'value': event.record.deviceList.value[i].id},
        'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
        'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value},
        'subBtn': {'value': event.record.deviceList.value[i].value.subBtn.value},
        'shipRemarks': {'value': event.record.deviceList.value[i].value.shipRemarks.value},
      }
    };
    postShipBody.deviceList.value.push(devListBody);
  }
  postShipDatav2.records.push(postShipBody);
  // 社内・社員予備機用post用サブデータ
  //post用データを格納（予備機がある場合は予備データも）
  // postShipData.records.push(postShipBody);
  //   postShipData.records.push(postShipSubBody);
  // }
  // 入出荷管理に情報連携
  // let postShipResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postShipData)
  //   .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  // if(Array.isArray(postShipResult)){
  //   event.error = '入出荷管理に情報連携する際にエラーが発生しました';
  //   endLoad();
  //   return event;
  // }else{
  //   let sys_shipment_id = '';
  //   for(let i in postShipResult.ids){
  //     if(i < postShipResult.ids.length - 1) sys_shipment_id += postShipResult.ids[i] + ',';
  //     else sys_shipment_id += postShipResult.ids[i];
  //   }
  //   event.record.sys_shipment_ID.value = sys_shipment_id;
  //   event.record.shipment_ID.value = sys_shipment_id;
  // }
  console.log(postShipDatav2);
  let postShipResultv2 = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postShipDatav2)
    .then(function(resp){
      return {result: true, resp:resp};
    }).catch(function(error){
      console.log(error);
      return {result: false, error: {target: 'POST_shipData', code: 'POST_shipData_postAPIerror'}};
    });
  if(!postShipResultv2.result){
    return postShipResultv2;
  }
  console.log(postShipDatav2);
  return {result: true, param: postShipResultv2.resp.ids[0]};
}

/**
 * 再生品管理にデータ連携 PUT
 * @param {*} (json) event
 * @returns (jsone)event
 */
// async function PUT_rentData(event){
//   // 再生品管理put用配列初期化
//   let putRentData = {'app': sysid.DEV.app_id.rental, 'records': []};
//   // 再生品管理put用配列作成
//   let putRentBody = {
//     'updateKey': {
//       'field': 'prjId',
//       'value': event.record.$id.value
//     },
//     'record': {
//       'pocType': {'value': event.record.salesType.value},
//       'aboutDelivery': {'value': event.record.aboutDelivery.value},
//       'tarDate': {'value': event.record.tarDate.value},
//       'returnDate': {'value': event.record.returnDate.value},
//       'returnCompDate': {'value': event.record.returnCompDate.value},
//       'receiver': {'value': event.record.receiver.value},
//       'phoneNum': {'value': event.record.phoneNum.value},
//       'zipcode': {'value': event.record.zipcode.value},
//       'prefectures': {'value': event.record.prefectures.value},
//       'city': {'value': event.record.city.value},
//       'address': {'value': event.record.address.value},
//       'buildingName': {'value': event.record.buildingName.value},
//       'corpName': {'value': event.record.corpName.value},
//       'deviceList': {'value': []},
//       'sys_prjNum': {'value': event.record.prjNum.value},
//       'prjNum': {'value': event.record.prjNum.value},
//       'shipNote': {'value': event.record.prjMemo.value}
//     }
//   };
//   for(let i in event.record.deviceList.value){
//     var devListBody = {
//       'value': {
//         'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
//         'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value}
//       }
//     };
//     putRentBody.record.deviceList.value.push(devListBody);
//   }
//   putRentData.records.push(putRentBody);
  // // 再生品管理にデータ連携
  // let putRentResult = await kintone.api(kintone.api.url('/k/v1/records', true), "PUT", putRentData)
  //   .then(function(resp){
  //     return resp;
  //   }).catch(function(error){
  //     console.log(error);
  //     return ['error', error];
  //   });
  // if(Array.isArray(putRentResult)) {
  //   event.error = '再生品管理に情報連携する際にエラーが発生しました';
  //   endLoad();
  //   return event;
  // }
  // ステータス更新
  // var getRentBody = {
  //   'app': sysid.DEV.app_id.rental,
  //   'query': 'sys_prjId in ("' + event.record.$id.value + '")'
  // };
  // let rentRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getRentBody)
  //   .then(function(resp){
  //     return resp;
  //   }).catch(function(error){
  //     console.log(error);
  //     return ['error', error];
  //   });
  // if(Array.isArray(rentRecord)){
  //   return {result: false, error: {target: 'PUT_rentData', code: 'PUT_rentData_getAPIerror'}};
  // }
//   var putStatusData = { 'app': sysid.DEV.app_id.rental, 'records': [] };
//   for(let i in rentRecord.records){
//     if(rentRecord.records[i].ステータス.value == '納品情報未確定'){
//       var putStatusBody = {
//         'id': rentRecord.records[i].$id.value,
//         'action': '処理開始',
//         'assignee': 'daisuke.shibata@accel-lab.com'
//       };
//       putStatusData.records.push(putStatusBody);
//     }
//   }
//   if(putStatusData.records.length > 0){
//     let putStatusResult = await kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusData)
//       .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
//     if(Array.isArray(putStatusResult)){
//       event.error = 'ステータス変更時にエラーが発生しました';
//       endLoad();
//       return event;
//     }
//   }
// }

/**
 * 入出荷管理にデータ連携 PUT
 * @param {*} (json) event
 * @returns (jsone)event
 */
async function PUT_shipData(event){
  // 入出荷管理put用配列初期化
  // let putShipData = {'app': sysid.INV.app_id.shipment, 'records': []};
  let putShipDatav2 = {'app': sysid.INV.app_id.shipmentv2, 'records': []};
  // 入出荷管理put用配列作成
  var putShipBody = {
    'id': event.record.shipment_ID.value,
    'record': {
      // 'aboutDelivery': {'value': event.record.aboutDelivery.value},
      // 'tarDate': {'value': event.record.tarDate.value},
      // 'dstSelection': {'value': event.record.dstSelection.value},
      // 'Contractor': {'value': event.record.Contractor.value},
      // 'instName': {'value': event.record.instName.value},
      // 'receiver': {'value': event.record.receiver.value},
      // 'phoneNum': {'value': event.record.phoneNum.value},
      // 'zipcode': {'value': event.record.zipcode.value},
      // 'prefectures': {'value': event.record.prefectures.value},
      // 'city': {'value': event.record.city.value},
      // 'address': {'value': event.record.address.value},
      // 'buildingName': {'value': event.record.buildingName.value},
      // 'corpName': {'value': event.record.corpName.value},
      // 'sys_instAddress': {'value': event.record.sys_instAddress.value},
      // 'sys_unitAddress': {'value': event.record.sys_unitAddress.value},
      'deviceList': {'value': []},
      'prjId': {'value': event.record.$id.value}
    }
  };
  for (let i in event.record.deviceList.value) {
    var devListBody = {
      'value': {
        'sys_listId': {'value': event.record.deviceList.value[i].id},
        'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
        'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value},
        'subBtn': {'value': event.record.deviceList.value[i].value.subBtn.value},
        'shipRemarks': {'value': event.record.deviceList.value[i].value.shipRemarks.value},
      }
    };
    putShipBody.record.deviceList.value.push(devListBody);
  }
  putShipDatav2.records.push(putShipBody);
  // 社内・社員予備機用put用サブデータ
  //put用データを格納（予備機がある場合は予備データも）
  // putShipData.records.push(putShipBody);
  //   putShipData.records.push(putShipSubBody);
  // }
  // 入出荷管理に情報連携
  // var putShipResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), "PUT", putShipData)
  //   .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  // if (Array.isArray(putShipResult)) {
  //   event.error = '入出荷管理に情報連携する際にエラーが発生しました';
  //   endLoad();
  //   return event;
  // }
  console.log(putShipDatav2);
  var putShipResultv2 = await kintone.api(kintone.api.url('/k/v1/records.json', true), "PUT", putShipDatav2)
    .then(function(resp){
      console.log('入出荷更新完了');
      return {result: true, resp:resp};
    }).catch(function(error){
      console.log(error);
      return {result: false, error: {target: 'PUT_shipData', code: 'PUT_shipData_updateAPIerror'}};
    });
  if (!putShipResultv2.result) {
    return putShipResultv2;
  }

  // ステータス更新
  /**
   * ステータス更新作り直し
   * putShipResultv2が成功した場合のみ更新かける
   * 1v1更新処理
   * 更新キー：event.record.shipment_ID.value
   * 更新対象：入出荷管理v2のみ
   */
  let setStatus = await kintone.api(kintone.api.url('/k/v1/record/status.json', true), "PUT", {
    app: sysid.INV.app_id.shipmentv2,
    id :event.record.shipment_ID.value,
    action: '処理開始'
  }).then(function(resp) {
    console.log('ステータス更新完了');
    return {result: true, resp:resp};
  }).catch(function(error){
    console.log(error);
    return {result: false, error: {target: 'PUT_shipData', code: 'PUT_shipData_statusAPIerror'}};
  });
  if(!setStatus.result){
    return setStatus
  }

  return {result: true};
}