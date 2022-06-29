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
      let result_LoginUserGroup= await kintone.api(kintone.api.url('/v1/user/groups', true), 'GET', {code: kintone.getLoginUser().code});
      // 注文書有無確認
      if(event.record.purchaseOrder.value.length < 1){
        let inGroup = false;
        for(let i in result_LoginUserGroup.groups){
          if (result_LoginUserGroup.groups[i].name == '営業責任者' || result_LoginUserGroup.groups[i].name == 'sysAdmin') {
            inGroup = true;
            break;
          }
        }
        if(inGroup){
          if(!confirm('注文書なしで納品を先行してもよろしいですか?')) event.error = '注文書を添付するか営業責任者に承認を求めてください！';
        }else{
          event.error = '注文書を添付するか営業責任者に承認を求めてください！';
        }
      }
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
      if(event.record.sys_shipment_ID.value == '' && event.record.sys_rent_ID.value == ''){
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
          if(event.record.salesType.value == '無償提供' || event.record.salesType.value == '貸与')
            POST_rentData(event);
          // 導入形態が「POC（無償提供、貸与）」以外の場合、入出荷管理にデータ連携(POST)
          else
            POST_shipData(event);
        }else{
          event.error = 'ステータスを進めるに必要な項目が未入力です';
        }
      }
    }else if(nStatus == '納品準備中'){
      /** ステータス進行条件確認 */
      /** データ連携 */
      // 導入形態が「POC（無償提供、貸与）」以外の場合、入出荷管理にデータ連携(POT)
      PUT_shipData(event);
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
 * @author Keiichi Maeda
 * @author Jay(include refactoring)
 */
async function POST_rentData(event){
  // 再生品管理post用配列初期化
  let postRentData = {'app': sysid.DEV.app_id.rental, 'records': []};
  // 再生品管理post内容
  let postRentBody = {
    'pocType': {'value': event.record.salesType.value},
    'aboutDelivery': {'value': event.record.aboutDelivery.value},
    'tarDate': {'value': event.record.tarDate.value},
    'returnDate': {'value': event.record.returnDate.value},
    'returnCompDate': {'value': event.record.returnCompDate.value},
    'receiver': {'value': event.record.receiver.value},
    'phoneNum': {'value': event.record.phoneNum.value},
    'zipcode': {'value': event.record.zipcode.value},
    'prefectures': {'value': event.record.prefectures.value},
    'city': {'value': event.record.city.value},
    'address': {'value': event.record.address.value},
    'buildingName': {'value': event.record.buildingName.value},
    'corpName': {'value': event.record.corpName.value},
    'deviceList': {'value': []},
    'sys_prjNum': {'value': event.record.prjNum.value},
    'sys_prjId': {'value': event.record.$id.value},
    'prjId': {'value': event.record.$id.value},
    'shipNote': {'value': event.record.prjMemo.value}
  };
  for(let i in event.record.deviceList.value){
    let devListBody = {
      'value': {
        'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
        'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value}
      }
    };
    postRentBody.deviceList.value.push(devListBody);
  }
  postRentData.records.push(postRentBody);
  // 再生品管理に情報連携
  let postRentResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postRentData)
    .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  if(Array.isArray(postRentResult)){
    event.error = '再生品管理に情報連携する際にエラーが発生しました';
    endLoad();
    return event;
  }else{
    let sys_rent_ID = '';
    for(let i in postRentResult.ids){
      if(i < postRentResult.ids.length - 1){
        sys_rent_ID += postRentResult.ids[i] + ',';
      }else{
        sys_rent_ID += postRentResult.ids[i];
      }
    }
    event.record.sys_rent_ID.value = sys_rent_ID;
  }
}

/**
 * 入出荷管理にデータ連携
 * @param {*} (json) event
 * @returns (jsone)event
 * @author Keiichi Maeda
 * @author Jay(include refactoring)
 */
async function POST_shipData(event){
  // 入出荷管理post用配列初期化
  // let postShipData = {'app': sysid.INV.app_id.shipment, 'records': []};
  let postShipDatav2 = {'app': sysid.INV.app_id.shipmentv2, 'records': []};
  // 入出荷管理post内容
  let postShipBody = {
    'aboutDelivery': {'value': event.record.aboutDelivery.value},
    'tarDate': {'value': event.record.tarDate.value},
    'dstSelection': {'value': event.record.dstSelection.value},
    'Contractor': {'value': event.record.Contractor.value},
    'instName': {'value': event.record.instName.value},
    'receiver': {'value': event.record.receiver.value},
    'phoneNum': {'value': event.record.phoneNum.value},
    'zipcode': {'value': event.record.zipcode.value},
    'prefectures': {'value': event.record.prefectures.value},
    'city': {'value': event.record.city.value},
    'address': {'value': event.record.address.value},
    'buildingName': {'value': event.record.buildingName.value},
    'corpName': {'value': event.record.corpName.value},
    'sys_instAddress': {'value': event.record.sys_instAddress.value},
    'sys_unitAddress': {'value': event.record.sys_unitAddress.value},
    'deviceList': {'value': []},
    'prjId': {'value': event.record.$id.value},
    'sys_prjId': {'value': event.record.$id.value},
    'prjNum': {'value': event.record.prjNum.value},
    'shipNote': {'value': event.record.prjMemo.value}
  };
  for(let i in event.record.deviceList.value){
    if(event.record.deviceList.value[i].value.subBtn.value == '通常'){
      let devListBody = {
        'value': {
          'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
          'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value}
        }
      };
      postShipBody.deviceList.value.push(devListBody);
    }
  }
  // 社内・社員予備機用post用サブデータ
  let postShipSubBody = {
    'shipType': {'value': '移動-拠点間'},
    'aboutDelivery': {'value': event.record.aboutDelivery.value},
    'tarDate': {'value': event.record.tarDate.value},
    'dstSelection': {'value': event.record.dstSelection.value},
    'Contractor': {'value': '社員予備'},
    'instName': {'value': event.record.instName.value},
    'receiver': {'value': event.record.receiver.value},
    'phoneNum': {'value': event.record.phoneNum.value},
    'zipcode': {'value': event.record.zipcode.value},
    'prefectures': {'value': event.record.prefectures.value},
    'city': {'value': event.record.city.value},
    'address': {'value': event.record.address.value},
    'buildingName': {'value': event.record.buildingName.value},
    'corpName': {'value': event.record.corpName.value},
    'sys_instAddress': {'value': event.record.sys_instAddress.value},
    'sys_unitAddress': {'value': event.record.sys_unitAddress.value},
    'deviceList': {'value': []},
    'prjId': {'value': event.record.$id.value + '-sub'},
    'prjNum': {'value': event.record.prjNum.value},
    'shipNote': {'value': event.record.prjMemo.value}
  };
  for(let i in event.record.deviceList.value){
    let devListBody = {
      'value': {
        'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
        'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value},
        'subBtn': {'value': '予備'},
        'shipRemarks': {'value': '社員予備'},
        'sys_listId': {'value': event.record.deviceList.value[i].id}
      }
    };
    postShipSubBody.deviceList.value.push(devListBody);
    // if(event.record.deviceList.value[i].value.subBtn.value == '予備'){
    // }
  }
  //post用データを格納（予備機がある場合は予備データも）
  // postShipData.records.push(postShipBody);
  // if(postShipSubBody.deviceList.value.length != 0){
  //   postShipData.records.push(postShipSubBody);
  // }
  postShipDatav2.records.push(postShipBody);
  if(postShipSubBody.deviceList.value.length != 0){
    postShipDatav2.records.push(postShipSubBody);
  }
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
  let postShipResultv2 = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postShipDatav2)
    .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  if(Array.isArray(postShipResultv2)){
    event.error = '入出荷管理に情報連携する際にエラーが発生しました';
    endLoad();
    return event;
  }else{
    let sys_shipment_id = '';
    for(let i in postShipResultv2.ids){
      if(i < postShipResultv2.ids.length - 1) sys_shipment_id += postShipResult.ids[i] + ',';
      else sys_shipment_id += postShipResultv2.ids[i];
    }
    event.record.sys_shipment_ID.value = sys_shipment_id;
    event.record.shipment_ID.value = sys_shipment_id;
  }
}

/**
 * 再生品管理にデータ連携 PUT
 * @param {*} (json) event
 * @returns (jsone)event
 * @author Keiichi Maeda
 * @author Jay(include refactoring)
 */
async function PUT_rentData(event){
  // 再生品管理put用配列初期化
  let putRentData = {'app': sysid.DEV.app_id.rental, 'records': []};
  // 再生品管理put用配列作成
  let putRentBody = {
    'updateKey': {
      'field': 'prjId',
      'value': event.record.$id.value
    },
    'record': {
      'pocType': {'value': event.record.salesType.value},
      'aboutDelivery': {'value': event.record.aboutDelivery.value},
      'tarDate': {'value': event.record.tarDate.value},
      'returnDate': {'value': event.record.returnDate.value},
      'returnCompDate': {'value': event.record.returnCompDate.value},
      'receiver': {'value': event.record.receiver.value},
      'phoneNum': {'value': event.record.phoneNum.value},
      'zipcode': {'value': event.record.zipcode.value},
      'prefectures': {'value': event.record.prefectures.value},
      'city': {'value': event.record.city.value},
      'address': {'value': event.record.address.value},
      'buildingName': {'value': event.record.buildingName.value},
      'corpName': {'value': event.record.corpName.value},
      'deviceList': {'value': []},
      'sys_prjNum': {'value': event.record.prjNum.value},
      'prjNum': {'value': event.record.prjNum.value},
      'shipNote': {'value': event.record.prjMemo.value}
    }
  };
  for(let i in event.record.deviceList.value){
    var devListBody = {
      'value': {
        'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
        'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value}
      }
    };
    putRentBody.record.deviceList.value.push(devListBody);
  }
  putRentData.records.push(putRentBody);
  // 再生品管理にデータ連携
  let putRentResult = await kintone.api(kintone.api.url('/k/v1/records', true), "PUT", putRentData)
    .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  if(Array.isArray(putRentResult)) {
    event.error = '再生品管理に情報連携する際にエラーが発生しました';
    endLoad();
    return event;
  }
  // ステータス更新
  var getRentBody = {
    'app': sysid.DEV.app_id.rental,
    'query': 'sys_prjId in ("' + event.record.$id.value + '")'
  };
  let rentRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getRentBody)
    .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  if(Array.isArray(rentRecord)){
    event.error = 'ステータス変更時にエラーが発生しました';
    endLoad();
    return event;
  }
  var putStatusData = { 'app': sysid.DEV.app_id.rental, 'records': [] };
  for(let i in rentRecord.records){
    if(rentRecord.records[i].ステータス.value == '納品情報未確定'){
      var putStatusBody = {
        'id': rentRecord.records[i].$id.value,
        'action': '処理開始',
        'assignee': 'daisuke.shibata@accel-lab.com'
      };
      putStatusData.records.push(putStatusBody);
    }
  }
  if(putStatusData.records.length > 0){
    let putStatusResult = await kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusData)
      .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
    if(Array.isArray(putStatusResult)){
      event.error = 'ステータス変更時にエラーが発生しました';
      endLoad();
      return event;
    }
  }
}

/**
 * 入出荷管理にデータ連携 PUT
 * @param {*} (json) event
 * @returns (jsone)event
 * @author Keiichi Maeda
 * @author Jay(include refactoring)
 */
async function PUT_shipData(event){
  // 入出荷管理put用配列初期化
  // let putShipData = {'app': sysid.INV.app_id.shipment, 'records': []};
  let putShipDatav2 = {'app': sysid.INV.app_id.shipmentv2, 'records': []};
  // 入出荷管理put用配列作成
  var putShipBody = {
    'updateKey': {
      'field': 'prjId',
      'value': event.record.$id.value
    },
    'record': {
      'aboutDelivery': {'value': event.record.aboutDelivery.value},
      'tarDate': {'value': event.record.tarDate.value},
      'dstSelection': {'value': event.record.dstSelection.value},
      'Contractor': {'value': event.record.Contractor.value},
      'instName': {'value': event.record.instName.value},
      'receiver': {'value': event.record.receiver.value},
      'phoneNum': {'value': event.record.phoneNum.value},
      'zipcode': {'value': event.record.zipcode.value},
      'prefectures': {'value': event.record.prefectures.value},
      'city': {'value': event.record.city.value},
      'address': {'value': event.record.address.value},
      'buildingName': {'value': event.record.buildingName.value},
      'corpName': {'value': event.record.corpName.value},
      'sys_instAddress': {'value': event.record.sys_instAddress.value},
      'sys_unitAddress': {'value': event.record.sys_unitAddress.value},
      'deviceList': {'value': []},
      'prjNum': {'value': event.record.prjNum.value},
      'shipNote': {'value': event.record.prjMemo.value}
    }
  };
  for (let i in event.record.deviceList.value) {
    if (event.record.deviceList.value[i].value.subBtn.value == '通常') {
      var devListBody = {
        'value': {
          'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
          'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value}
        }
      };
      putShipBody.record.deviceList.value.push(devListBody);
    }
  }
  // 社内・社員予備機用put用サブデータ
  var putShipSubBody = {
    'updateKey': {
      'field': 'prjId',
      'value': event.record.$id.value + '-sub'
    },
    'record': {
      'shipType': {'value': '移動-拠点間'},
      'aboutDelivery': {'value': event.record.aboutDelivery.value},
      'tarDate': {'value': event.record.tarDate.value},
      'dstSelection': {'value': event.record.dstSelection.value},
      'Contractor': {'value': '社員予備'},
      'instName': {'value': event.record.instName.value},
      'receiver': {'value': event.record.receiver.value},
      'phoneNum': {'value': event.record.phoneNum.value},
      'zipcode': {'value': event.record.zipcode.value},
      'prefectures': {'value': event.record.prefectures.value},
      'city': {'value': event.record.city.value},
      'address': {'value': event.record.address.value},
      'buildingName': {'value': event.record.buildingName.value},
      'corpName': {'value': event.record.corpName.value},
      'sys_instAddress': {'value': event.record.sys_instAddress.value},
      'sys_unitAddress': {'value': event.record.sys_unitAddress.value},
      'deviceList': {'value': []},
      'prjNum': {'value': event.record.prjNum.value},
      'shipNote': {'value': event.record.prjMemo.value}
    }
  };
  for (let i in event.record.deviceList.value) {
    if (event.record.deviceList.value[i].value.subBtn.value == '予備') {
      var devListBody = {
        'value': {
          'mNickname': {'value': event.record.deviceList.value[i].value.mNickname.value},
          'shipNum': {'value': event.record.deviceList.value[i].value.shipNum.value},
          'shipRemarks': {'value': '社員予備'}
        }
      };
      putShipSubBody.record.deviceList.value.push(devListBody);
    }
  }
  //put用データを格納（予備機がある場合は予備データも）
  // putShipData.records.push(putShipBody);
  // if(putShipSubBody.record.deviceList.value.length != 0){
  //   putShipData.records.push(putShipSubBody);
  // }
  putShipDatav2.records.push(putShipBody);
  if(putShipSubBody.record.deviceList.value.length != 0){
    putShipDatav2.records.push(putShipSubBody);
  }
  // 入出荷管理に情報連携
  // var putShipResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), "PUT", putShipData)
  //   .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  // if (Array.isArray(putShipResult)) {
  //   event.error = '入出荷管理に情報連携する際にエラーが発生しました';
  //   endLoad();
  //   return event;
  // }
  var putShipResultv2 = await kintone.api(kintone.api.url('/k/v1/records.json', true), "PUT", putShipDatav2)
    .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  if (Array.isArray(putShipResultv2)) {
    event.error = '入出荷管理に情報連携する際にエラーが発生しました';
    endLoad();
    return event;
  }

  // ステータス更新
  var prjIdArray = ['"' + event.record.$id.value + '"', '"' + event.record.$id.value + '-sub"'];
  // var getShipBody = {
  //   'app': sysid.INV.app_id.shipment,
  //   'query': 'prjId in (' + prjIdArray.join() + ')'
  // };
  var getShipBodyv2 = {
    'app': sysid.INV.app_id.shipmentv2,
    'query': 'prjId in (' + prjIdArray.join() + ')'
  };
  // var prjIdRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getShipBody)
  //   .then(function(resp) { return resp; }).catch(function(error){ return ['error', error]; });
  var prjIdRecordv2 = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getShipBodyv2)
    .then(function(resp) { return resp; }).catch(function(error){ return ['error', error]; });
  // var putStatusData = {
  //   'app': sysid.INV.app_id.shipment,
  //   'records': []
  // };
  var putStatusDatav2 = {
    'app': sysid.INV.app_id.shipmentv2,
    'records': []
  };
  // for (let i in prjIdRecord.records) {
  //   if (prjIdRecord.records[i].ステータス.value == '納品情報未確定') {
  //     var putStatusBody = {
  //       'id': prjIdRecord.records[i].$id.value,
  //       'action': '処理開始',
  //       'assignee': 'daisuke.shibata@accel-lab.com'
  //     };
  //     putStatusData.records.push(putStatusBody);
  //   }
  // }
  // if (putStatusData.records.length > 0) {
  //   var putStatusResult = await kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusData)
  //     .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  // }
  for (let i in prjIdRecordv2.records) {
    if (prjIdRecordv2.records[i].ステータス.value == '納品情報未確定') {
      var putStatusBody = {
        'id': prjIdRecordv2.records[i].$id.value,
        'action': '処理開始',
        'assignee': 'daisuke.shibata@accel-lab.com'
      };
      putStatusDatav2.records.push(putStatusBody);
    }
  }
  if (putStatusDatav2.records.length > 0) {
    var putStatusResultv2 = await kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusDatav2)
      .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
  }
  // if (Array.isArray(putStatusResult)&&Array.isArray(putStatusResultv2)) {
  //   event.error = 'ステータス変更時にエラーが発生しました';
  //   endLoad();
  //   return event;
  // }
  if (Array.isArray(putStatusResultv2)) {
    event.error = 'ステータス変更時にエラーが発生しました';
    endLoad();
    return event;
  }
}