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
          var result_POST_shipData = await POST_shipData(event);
          if(!result_POST_shipData.result){
            event.error = result_POST_shipData.error.target + ': ' + errorCode[result_POST_shipData.error.code];
            endLoad();
            return event;
          }
          event.record.sys_shipment_ID.value = result_POST_shipData.param;
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

  kintone.events.on('app.record.detail.show', async function (event) {
    startLoad();
    // 入出荷IDをルックアップに挿入
    if(event.record.sys_shipment_ID.value!=''&&event.record.shipment_ID.value==''){
      let putshipIDBody = {
        'app': kintone.app.getId(),
        'id': kintone.app.record.getId(),
        'record': {
          shipment_ID:{
            value: event.record.sys_shipment_ID.value
          }
        }
      }
      await kintone.api(kintone.api.url('/k/v1/record', true), "PUT", putshipIDBody)
      .then(function(resp){
        console.log(resp);
        location.reload();
      }).catch(function(error){
        console.log(error);
      });
    }
    endLoad();
    return event;
  });

})();


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

  return {result: true, param: postShipResultv2.resp.ids[0]};
}

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

  // ステータス更新
  let setStatus = await kintone.api(kintone.api.url('/k/v1/record/status.json', true), "PUT", {
    app: sysid.INV.app_id.shipmentv2,
    id :event.record.shipment_ID.value,
    action: '処理開始'
  }).then(async function(resp) {
    console.log('ステータス更新完了');
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