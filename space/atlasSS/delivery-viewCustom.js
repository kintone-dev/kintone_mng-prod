(function () {
  'use strict';
  kintone.events.on('app.record.create.submit.success', function (event) {

    var application_type = event.record.application_type.value;
    if (application_type == '新規申込') {
      var new_memID = {
        'app': sysid.ASS.app_id.member,
        'record': {
          'member_id': {
            'value': event.record.member_id.value
          },
          'member_type': {
            'value': event.record.member_type.value
          },
          'application_datetime': {
            'value': event.record.application_datetime.value
          },
          'toastcam_bizUserId': {
            'value': event.record.toastcam_bizUserId.value
          },
          'application_type': {
            'value': event.record.application_type.value
          }
        }
      };

      kintone.api(kintone.api.url('/k/v1/record', true), 'POST', new_memID).then(function (resp) {
        console.log(resp);
      }).catch(function (error) {
        console.log(error);
      });
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
  kintone.events.on('app.record.detail.process.proceed', function (event) {
    var nStatus = event.nextStatus.value;
    if (nStatus === "送付済み？") {
      //パラメータsNumInfoにjsonデータ作成
      var sNumInfo = {
        'app': sysid.DIPM.app.sn,
        'records': []
      };
      var shipTable = event.record.deviceList.value;
      var shipIName = event.record.instName.value;
      var shipShipment = event.record.shipment.value;

      for(let i in shipTable) {
        var ship_member_id = shipTable[i].value.member_id.value;
        var ship_shipnum = shipTable[i].value.shipNum.value;
        var ship_sn = shipTable[i].value.sNum.value;
        //get serial numbers
        var get_sNums = ship_sn.split(/\r\n|\n/);
        //except Boolean
        var sNums = get_sNums.filter(Boolean);

        for(let y in sNums) {
          var snRecord = {
            'updateKey': {
              'field': 'sNum',
              'value': sNums[y]
            },
            'record': {
              'member_id': {
                'value': ship_member_id
              },
              'instName': {
                'value': shipInstName
              },
              'shipment': {
                'value': shipShipment
              }
            }
          };
          sNumInfo.records.push(snRecord);
        }
      }
      var setSNinfo = new kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', sNumInfo);
      return setSNinfo.then(function (resp) {
        console.log('update success');
      }).catch(function (error) {
        console.log('update error' + error.message);
        console.log(error);
      });
    }
  });
  kintone.events.on(['app.record.edit.submit'], function(event){
    let alResult=event.record.sys_alResult.value;
    let workingstatus=event.record.working_status.value;
    let applicationType=event.record.application_type.value;

    // 保存不可条件
    /**
     * 申込種別＝新規申込
     * 作業ステータス！＝準備中
     * 会員情報連携実績なし(alResult not in meminfo)
     */
    if(applicationType=='新規申込' && workingstatus!=='準備中' && !alResult.match(/meminfo/)){
      event.error='会員情報が連携されていません。先に会員情報を連携してください。';
    }
    /**
     * 作業ステータス＝出荷完了
     * シリアル情報連携実績なし（alResult not in sNum）
     */
    if(workingstatus=='出荷完了' && !alResult.match(/sNum/)){
      event.error='作業ステータスを一旦「集荷待ち」にして「KT-情報連携」ボタンを押してから「出荷完了」に変更してください。';
    }
    /**
     * 作業ステータス＝/着荷完了|持ち戻り|再配達依頼|再配達中|配達中止/
     * 在庫処理未実行（alResult not in stock）
     */
    if(workingstatus==/着荷完了|持ち戻り|再配達依頼|再配達中|配達中止/ && !alResult.match(/stock/)){
      event.error='作業ステータスを一旦「出荷完了」にして「KT-情報連携」ボタンを押してから「'+workingstatus+'」に変更してください。';
    }
    return event;
  });
})();