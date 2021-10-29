(function () {
  'use strict';

  // 拠点情報取得＆繰り返し利用
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
    if (cStatus === "出荷準備中" && nStatus === "集荷待ち") {
      //送付日未記入の場合エラー
      if (event.record.sendDate.value == null) {
        event.error = '送付日を記入して下さい。'
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
        console.log(deviceListValue_mCode);
        console.log(deviceListValue_mType);
        console.log(deviceListValue_shipNum);
        console.log(!deviceListValue_mCode.match(ship_uncheckList.mcode))
        console.log(!deviceListValue_mType.match(ship_uncheckList.mtype))
        // 特定のものは除外
        if(!deviceListValue_mCode.match(ship_uncheckList.mcode) || !deviceListValue_mType.match(ship_uncheckList.mtype)){
          // 依頼数と出荷シリアル数が一致しない場合エラー
          if (deviceListValue_shipNum != sNums[deviceListValue_mCode].length) {
            event.error = `製品名「${deviceListValue[i].value.mNickname.value}」の依頼数と出荷数が一致しません。`;
            endLoad();
            return event;
          }
        }
      }
      //シリアル番号情報を更新
      var putSnumData = [];
      var instNameValue = event.record.instName.value;
      if (instNameValue == undefined) instNameValue = '';
      for (let i in sNums.SNs) {
        var snRecord = {
          'updateKey': {
            'field': 'sNum',
            'value': sNums.SNs[i]
          },
          'record': {
            'shipment': event.record.shipment,
            'sendDate': event.record.sendDate,
            'shipType': event.record.shipType,
            'instName': {
              type: 'SINGLE_LINE_TEXT',
              value: instNameValue
            }
          }
        };
        putSnumData.push(snRecord);
      }
      console.log(putSnumData);
      var postSnumData = [];
      for (let i in putSnumData) {
        var postSnBody = {
          'sNum': {
            type: 'SINGLE_LINE_TEXT',
            value: sNums.SNs[i]
          },
          'shipment': event.record.shipment,
          'sendDate': event.record.sendDate,
          'shipType': event.record.shipType,
          'instName': {
            type: 'SINGLE_LINE_TEXT',
            value: instNameValue
          }
        };
        postSnumData.push(postSnBody);
      }
      console.log(postSnumData);
      var putSnumResult = await putRecords(sysid.DEV.app_id.sNum, putSnumData)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return 'error';
        });
      //シリアル番号更新失敗の際に、新規シリアル番号としてpost
      if (putSnumResult == 'error') {
        if (confirm('シリアル番号が登録されていません。\nシリアル番号を新規登録しますか？')) {
          var postSnumResult = await postRecords(sysid.DEV.app_id.sNum, postSnumData)
            .then(function (resp) {
              return resp;
            }).catch(function (error) {
              console.log(error);
              return 'error';
            });
          if (postSnumResult == 'error') {
            endLoad();
            event.error = 'シリアル番号更新でエラーが発生しました。';
            return event;
          }
        } else {
          endLoad();
          event.error = 'シリアル番号更新でエラーが発生しました。';
          return event;
        }
      }

      //在庫処理
      await stockCtrl(event, kintone.app.getId());
    } else if (cStatus === "集荷待ち" && nStatus === "出荷完了") {
      //案件IDがある場合のみ実施
      if (event.record.prjId.value != '') {
        // 輸送情報連携
        var delInfo = await setDeliveryInfo(event.record);
        if (Array.isArray(delInfo)) {
          event.error = 'ステータス変更でエラーが発生しました。\n該当の案件管理ページを確認してください。'
          endLoad();
          return event;
        }
      }
      // レポート処理
      reportCtrl(event, kintone.app.getId());
    } else if (cStatus === "処理中" && nStatus === "受領待ち") {
      var txt = $('[name=setShipment] option:selected').text();
      var val = $('[name=setShipment] option:selected').val();
      if (val != 'noSelect') {
        event.record.shipment.value = txt;
        event.record.sys_shipmentCode.value = val;
      } else {
        event.error = '出荷ロケーションを選択して下さい。';
      }
    } else if (cStatus === "処理中" && nStatus === "納品情報未確定") {
      //案件IDがある場合のみ実施
      if (event.record.prjId.value != '') {
        let putStatusData = {
          'app': sysid.PM.app_id.project,
          'id': event.record.prjId.value,
          'action': '差戻'
        };
        var statResult = await kintone.api(kintone.api.url('/k/v1/record/status.json', true), "PUT", putStatusData)
          .then(function (resp) {
            return resp;
          }).catch(function (error) {
            console.log(error);
            return ['error', error];
          });
        if (Array.isArray(statResult)) {
          event.error = '差戻でエラーが発生しました。\n該当の案件管理ページを確認してください。'
          endLoad();
          return event;
        }
      }
    }
    endLoad();
    return event;
  });

  /* ---以下関数--- */
  // 輸送情報連携
  function setDeliveryInfo(pageRecod) {
    return new Promise(async function (resolve, reject) {
      var putDeliveryData = {
        'app': sysid.PM.app_id.project,
        'id': pageRecod.prjId.value,
        'record': {
          'deliveryCorp': {
            'value': pageRecod.deliveryCorp.value
          },
          'trckNum': {
            'value': pageRecod.trckNum.value
          },
          'sendDate': {
            'value': pageRecod.sendDate.value
          },
          'expArrivalDate': {
            'value': pageRecod.expArrivalDate.value
          }
        }
      }
      var putStatusData = {
        'app': sysid.PM.app_id.project,
        'id': pageRecod.prjId.value,
        'action': '製品発送済',
        // 'assignee': pageRecod.作業者.value[0].code
      };
      var putResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), "PUT", putDeliveryData)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
      if (Array.isArray(putResult)) {
        resolve(putResult);
      }
      var statResult = await kintone.api(kintone.api.url('/k/v1/record/status.json', true), "PUT", putStatusData)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
      if (Array.isArray(statResult)) {
        resolve(statResult);
      }

      resolve();
    });

  }
})();