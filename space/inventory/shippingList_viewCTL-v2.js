(function(){
  'use strict';
  /** イベント　通常イベント発生時 */
  // 一覧表示
  kintone.events.on('app.record.index.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */
    endLoad();
    return event;
  });
  // 新規レコード作成
  kintone.events.on('app.record.create.show', function(event){
    startLoad();
    /** 初期設定 start */
    acl_defalut(event);
    /** 初期設定 end */

    /** アクション受領時 start */
    /** アクション受領時 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */

    /** 前バージョン */
    /** for temp */
    // temp_fDesibale(event);
    //レコード作成時、発送関連情報を非表示
    setFieldShown('deliveryCorp', false);
    setFieldShown('trckNum', false);
    setFieldShown('sendDate', false);
    setFieldShown('expArrivalDate', false);
    // setSpaceShown('setShipment', 'line', 'none');

    // event.record.prjNum.disabled = true;
    //コピー元の「prjNum」の値をsessionStorageの値を代入
    // event.record.prjNum.value = sessionStorage.getItem('prjNum');
    // event.record.shipType.value = sessionStorage.getItem('shipType');
    // event.record.tarDate.value = sessionStorage.getItem('tarDate');
    // event.record.instName.value = sessionStorage.getItem('instName');
    // event.record.instName.lookup = true;
    // データ複製ボタン受取
    // if(sessionStorage.getItem('is_copy_shipdata')){
    //   let ssRecord=JSON.parse(sessionStorage.getItem('copy_shipdata'));
    //   for(let i in ssRecord){
    //     console.log(i);
    //     console.log(ssRecord[i].fcode)
    //     console.log(event.record[ssRecord[i].fcode]);
    //     console.log(event.record[ssRecord[i].fcode].value);
    //     event.record[ssRecord[i].fcode].value=ssRecord[i].value;
    //   }
    //   let devicelistValue=event.record.deviceList.value;
    //   for(let i in devicelistValue){
    //     devicelistValue[i].value.mNickname.lookup=true;
    //   }
    //   event.record.Contractor.lookup=true;
    //   event.record.instName.lookup=true;
    //   event.record.prjId.lookup=true;
    //   sessionStorage.removeItem('is_copy_shipdata');
    // }

    //キャンセルした時の処理
    var cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
    cancel_btn[0].addEventListener('click', function () {
      window.close();
    }, false);
    //反映したあとはsessionStorageの中身を削除
    sessionStorage.removeItem('prjNum');
    sessionStorage.removeItem('shipType');
    sessionStorage.removeItem('tarDate');
    sessionStorage.removeItem('instName');
    sessionStorage.removeItem('copy_shipdata');
    endLoad();
    return event;
  });
  // レコード編集
  kintone.events.on('app.record.edit.show', function(event){
    startLoad();
    /** 初期設定 start */
    acl_defalut(event);
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */

    /** for temp */
    // temp_fDesibale(event);
    endLoad();
    return event;
  });
  // レコード詳細閲覧
  kintone.events.on('app.record.detail.show', function(event){
    // startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    // 一時的
    setBtn_header('resetSerial', 'シリアルリセット');
    $('#resetSerial').on('click', async function () {
      const sninfo = renew_sNumsInfo_alship_forShippingv2(event.record, 'deviceList');
      const sNumsSerial = Object.keys(sninfo.serial);
      console.log(sninfo);
      console.log(sNumsSerial);

      // シリアル配列からquery用テキスト作成
      let sNum_queryText=null;
      for(let i in sNumsSerial){
        if(sNum_queryText==null) sNum_queryText = '"'+sNumsSerial[i]+'"';
        else sNum_queryText += ',"' + sNumsSerial[i] + '"';
      }
      // 入力シリアル番号のレコード情報取得
      let snRecords = (await getRecords({app: sysid.DEV.app_id.sNum, filterCond: 'sNum in (' + sNum_queryText + ')'})).records;
      console.log(snRecords);

      // console.log(snList);

      let putRecords = [];
      snRecords.forEach(sn => {
        putRecords.push({
          id: sn.$id.value,
          record: {
            sState: {value: '新品'},
            tmp_titanSN: {value: '強制新品-Jay' + new Date()},
          }
        })
      });
      console.log(putRecords);
      let response_PUT=[];
      if(putRecords.length > 0){
        let x = 0
        while(x < putRecords.length){
          let putBody_slice100 = {app:159, records:[]}
          if(x > putRecords.length-100){
            putBody_slice100.records = putRecords.slice(x, x + putRecords.length%100);
          }else{
            putBody_slice100.records = putRecords.slice(x, x + 100);
          }
          console.log(putBody_slice100);
          response_PUT.push(await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putBody_slice100));
          x += 100;
        }
      }
      console.log(response_PUT);
      alert('シリアル初期化完了しました。');
    });
    /** 前バージョン */
    let prjid=event.record.prjId.value;
    if(prjid!=''){
      setBtn_header('newTab_prj', '案件管理を開く');
      $('#newTab_prj').on('click', function () {
        window.open('https://accel-lab.cybozu.com/k/' + sysid.PM.app_id.project + '/show#record=' + prjid, '_blank'); //該当アプリのレコード詳細画面を開く
      });
    }
    return event;
  });
  /** イベント 項目変更 */
  //
  kintone.events.on('app.record.create.change.', function(event){
    startLoad();
    //
    endLoad();
    return event;
  });

  /** イベント 新規保存 */
  //
  kintone.events.on('app.record.create.submit', function(event){
    startLoad();
    //
    // // 新規レコード保存時、履歴を残す
    setlog_new(event)
    endLoad();
    return event;
  });
  /** イベント 編集保存 */
  //
  kintone.events.on('app.record.edit.submit', function(event){
    startLoad();
    // 出荷区分と入出荷ロケーション確認
    const shiptype = event.record.shipType.value;
    const shipment = event.record.shipment.value;
    const destination = event.record.destination.value;
    // if(shiptype)
    endLoad();
    return event;
  });
  /** イベント 詳細確認時 */
  // kintone.events.on('app.record.detail.show', function(event){
  // });
  /** イベント 編集保存完了 */
  //
  kintone.events.on('app.record.edit.submit.success', async function(event){
    startLoad();
    acl_defalut(event);
    recordSplit(event);
    endLoad();
    return event;
  });
  /** イベント　プロセス進行 */
  kintone.events.on('app.record.detail.process.proceed', function (event) {
    startLoad();
    //
    endLoad();
    return event;
  });

  /** 実行関数 */
  // デフォルトアクセス制限
  function acl_defalut(event){
    event.record.prjTitle.disabled = false;
    event.record.prjSubtitle.disabled = false;
    event.record.shipType.disabled = false;
    event.record.c_Contractor.disabled = false;
    event.record.tarDate.disabled = false;
    event.record.dstSelection.disabled = false;
    event.record.receiver.disabled = false;
    event.record.phoneNum.disabled = false;
    event.record.zipcode.disabled = false;
    event.record.prefectures.disabled = false;
    event.record.city.disabled = false;
    event.record.address.disabled = false;
    event.record.buildingName.disabled = false;
    event.record.corpName.disabled = false;
    event.record.shipNote.disabled = false;
    event.record.aboutDelivery.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    // event.record.prjSubtitle.disabled = false;
    event.record.recordSplitType.disabled = true;
    // setFieldShown('sys_listId', false);
    // setFieldShown('sys_recordSplitStatus', false);
    let deviceListValue = event.record.deviceList.value;
    let SplitType = event.record.recordSplitType.value;
    // メインレコードの分岐済み行を編集不可にする
    deviceListValue.forEach(list => {
      if(list.value.sys_recordSplitStatus.value.length > 0){
        list.value.recordSplit.disabled = true;
        if(SplitType == 'メイン'){
          list.value.mNickname.disabled = true;
          list.value.shipNum.disabled = true;
          list.value.subBtn.disabled = true;
          list.value.cmsID.disabled = true;
          list.value.sNum.disabled = true;
          list.value.shipRemarks.disabled = true;
        }
      }
      list.value.sys_listId.disabled = true;
      list.value.sys_recordSplitStatus.disabled = true;
    });
    return event;
  }
  /** 分岐レコード作成 */
  async function recordSplit(event){
    // 分岐レコード作成
    const recordSplitTypeValue = event.record.recordSplitType.value;
    if(recordSplitTypeValue == 'メイン'){
      // テーブルの分岐にチェックが入っている場合、そのデータを取得して分岐レコードを作成する
      const thisRecordId = event.record.$id.value;
      let deviceListValue = JSON.parse(JSON.stringify(event.record.deviceList.value));
      let spliceRecord = JSON.parse(JSON.stringify(event.record));
      // let mainRecordDeviceListValue = event.record.deviceList.value;
      spliceRecord.deviceList.value = [];
      let splitCheck = false;
      // await deviceListValue.forEach(list => {
      //   let recordSplitValue = list.value.recordSplit.value;
      //   let sys_recordSplitStatusValue = list.value.sys_recordSplitStatus.value;
      //   if(recordSplitValue.length > 0 && sys_recordSplitStatusValue == 0){
      //     splitCheck = true;
      //     // 分岐レコード用デバイスリストを作成
      //     list.value.sys_recordSplitStatus.value = ['splitAlready'];
      //     list.value.recordSplit.value = ['分岐'];
      //     list.value.sys_listId.value = list.id;
      //     spliceRecord.deviceList.value.push(list);
      //     // メインレコード用分岐済み値をセット
      //   }
      //   // delete list.id;
      // });
      for(let i in deviceListValue){
        let list = deviceListValue[i];
        let recordSplitValue = list.value.recordSplit.value;
        let sys_recordSplitStatusValue = list.value.sys_recordSplitStatus.value;
        if(recordSplitValue.length > 0 && sys_recordSplitStatusValue == 0){
          splitCheck = true;
          // 分岐レコード用デバイスリストを作成
          list.value.sys_recordSplitStatus.value = ['splitAlready'];
          list.value.recordSplit.value = ['分岐'];
          list.value.sys_listId.value = list.id;
          spliceRecord.deviceList.value.push(list);
          // メインレコード用分岐済み値をセット
          event.record.deviceList.value[i].value.sys_recordSplitStatus.value = ['splitAlready'];
        }
      }
      if(splitCheck){
        delete spliceRecord.$id;
        delete spliceRecord.$revision;
        delete spliceRecord['ステータス'];
        delete spliceRecord['レコード番号'];
        delete spliceRecord['作成日時'];
        delete spliceRecord['作成者'];
        delete spliceRecord['作業者'];
        delete spliceRecord['更新日時'];
        delete spliceRecord['更新者'];
        delete spliceRecord.sys_log;
        delete spliceRecord.sys_snResult;
        spliceRecord.recordSplitType.value = '分岐';
        spliceRecord.sys_recordSplitCode.value = thisRecordId;

        // 新規レコード作成
        await kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
          app: kintone.app.getId(),
          record: spliceRecord
        }).then(function(resp){
          console.log(resp);
          kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
            app: kintone.app.getId(),
            id: thisRecordId,
            record: {
              deviceList: {value: event.record.deviceList.value},
              sys_recordSplitCode: {value: thisRecordId}
            }
          }).then(function(resp2){
            alert('レコード分岐に成功しました。\n分岐したレコード番号は「'+ resp.id +'」です。\nブラウザを更新してください。')
          });
        }).catch(function(e){
          console.log(e);
          alert('レコード分岐に失敗しました。');
        });
      }
    }
    // // 新規レコード保存時、履歴を残す
  }

  // function temp_fDesibale(event){
  //   console.log(event);
  //   let get_fCode = getFields();
  //   console.log(get_fCode);
  //   for(let i=8; i<get_fCode.length; i++){
  //     if(get_fCode[i].type !== "REFERENCE_TABLE"){
  //       event.record[get_fCode[i].var].disabled = false;
  //     }
  //   }
  //   return event;
  // }

})();
async function setStatus(){
  let resp_get = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
    'app': kintone.app.getId(),
    'query': 'ステータス = "完了"',
    'fields': ['$id', 'prjId', 'shipment_update', 'sendDate', '出荷完了']
  });
  console.log(resp_get);
  let status_body = {
    app: 133,
    records: []
  };
  console.log(resp_get.records.length);
  for(let i in resp_get.records){
    status_body.records.push({
      id: resp_get.records[i].$id.value,
      action: 'tmp_出荷完了'//tmp_完了
    });
  }
  console.log(status_body);
  await kintone.api(kintone.api.url('/k/v1/records/status.json', true), 'PUT', status_body, (resp_status) => {
    // success
    console.log(resp_status);
  }, (error) => {
    // error
    console.log(error);
  });
}
async function resetShipmentID(){
  let resp_get = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
    'app': kintone.app.getId(),
    'query': 'shipment_update != "" and recordSplitType not in ("メイン")',
    'fields': ['$id', 'shipment_update', 'sendDate', 'ステータス']
  });
  console.log(resp_get);
  let put_body = {
    app: 133,
    records: []
  };
  console.log(resp_get.records.length);
  for(let i in resp_get.records){
    put_body.records.push({
      id: resp_get.records[i].$id.value,
      action: 'tmp_出荷完了'
    });
  }
  console.log(put_body);
  await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', put_body, (resp_status) => {
    // success
    console.log(resp_status);
  }, (error) => {
    // error
    console.log(error);
  });
}
async function setSNstatus(){
  const sninfo = renew_sNumsInfo_alship_forShippingv2(event.record, 'deviceList');
  const snList = Object.keys(sninfo.serial)


  console.log(snList);
  let putRecords = [];
  snList.forEach(sn => {
    putRecords.push({
      updateKey: {value: sn},
      record: {
        sState: {value: '新品'},
        tmp_titanSN: {value: '強制新品-Jay' + new Date()},
      }
    })
  });
  console.log(putRecords);
  let response_PUT=[];
  if(putRecords.length > 0){
    let x = 0
    while(x < putRecords.length){
      let putBody_slice100 = {app:338, records:[]}
      if(x > putRecords.length-100){
        putBody_slice100.records = putRecords.slice(x, x + putRecords.length%100);
      }else{
        putBody_slice100.records = putRecords.slice(x, x + 100);
      }
      console.log(putBody_slice100);
      response_PUT.push(await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putBody_slice100));
      x += 100;
    }
  }
  console.log(response_PUT);
}