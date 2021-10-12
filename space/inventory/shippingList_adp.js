(function () {
  'use strict';

  // 拠点情報取得＆繰り返し利用
  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    startLoad();
    var nStatus = event.nextStatus.value;
    if (nStatus === "集荷待ち") {
      //送付日未記入の場合エラー
      if (event.record.sendDate.value == null) {
        event.error = '送付日を記入して下さい。'
        endLoad();
        return event;
      }

      //ID更新
      var sNums = sNumRecords(event.record.deviceList.value, 'table');
      var putSnumData = [];
      var instNameValue=event.record.instName.value;
      if(instNameValue==undefined) instNameValue='';
      for (var i in sNums) {
        var snRecord = {
          'updateKey': {
            'field': 'sNum',
            'value': sNums[i]
          },
          'record': {
            'shipment': event.record.shipment,
            'sendDate': event.record.sendDate,
            'shipType': event.record.shipType,
            'instName': {type: 'SINGLE_LINE_TEXT', value: instNameValue}
          }
        };
        putSnumData.push(snRecord);
      }
      var putSnumResult = await putRecords(sysid.DEV.app_id.sNum, putSnumData)
        .catch(function (error) {
          event.error = 'シリアル番号追加でエラーが発生しました。';
          return 'error';
        });
      if (putSnumResult=='error') {
        endLoad();
        return event;
      }

      //在庫処理
      await stockCtrl(event, kintone.app.getId());
    } else if (nStatus === "出荷完了") {
      // 輸送情報連携
      setDeliveryInfo(event.record);
      // レポート処理
      await reportCtrl(event, kintone.app.getId());

    } else if (nStatus === "受領待ち") {
      var txt = $('[name=setShipment] option:selected').text();
      var val = $('[name=setShipment] option:selected').val();
      if (val != 'noSelect') {
        event.record.shipment.value = txt;
        event.record.sys_shipmentCode.value = val;
      } else {
        event.error = '出荷ロケーションを選択して下さい。';
      }
    }
    endLoad();
    return event;
  });

  // 納品情報未確定のものをステータス変更
  kintone.events.on('app.record.index.show', async function (event) {
    if (sessionStorage.getItem('record_updated') === '1') {
      sessionStorage.setItem('record_updated', '0');
      return event;
    }
    var getShipBody = {
      'app': sysid.INV.app_id.shipment,
      'query': 'prjId != ""'
    };
    var prjIdRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getShipBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return error;
      });

    if (prjIdRecord.records != 0) {
      var putStatusData = {
        'app': sysid.INV.app_id.shipment,
        'records': []
      };
      for (var i in prjIdRecord.records) {
        if (prjIdRecord.records[i].ステータス.value == '納品情報未確定') {
          var putStatusBody = {
            'id': prjIdRecord.records[i].$id.value,
            'action': '処理開始'
          };
          putStatusData.records.push(putStatusBody);
        }
      }
      kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusData);
      sessionStorage.setItem('record_updated', '1');
      location.reload();
    }

    return event;
  });

  /* ---以下関数--- */
  // 輸送情報連携
  const setDeliveryInfo = function (pageRecod) {
    var putDeliveryData = [];
    var putDeliveryBody = {
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
    };
    putDeliveryData.push(putDeliveryBody);
    var putStatusBody = {
      'app': sysid.PM.app_id.project,
      'id': pageRecod.prjId.value,
      'action': '製品発送'
    };
    putRecords(sysid.PM.app_id.project, putDeliveryData);
    kintone.api(kintone.api.url('/k/v1/record/status.json', true), "PUT", putStatusBody);
  }
})();