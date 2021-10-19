(function () {
  'use strict';

  var events_ced = [
    'app.record.create.submit',
    'app.record.edit.submit'
  ];

  kintone.events.on(events_ced, async function (event) {
    startLoad();
    //故障品情報格納配列
    var putDefectiveData = [];
    //故障品情報
    var putDefectiveBody = {
      'updateKey': {
        'field': 'sNum',
        'value': event.record.defective.value
      },
      'record': {
        'sState': {
          'value': '故障品'
        },
        'sDstate': {
          'value': '検証待ち'
        }
      }
    };
    putDefectiveData.push(putDefectiveBody);
    await putRecords(sysid.DEV.app_id.sNum, putDefectiveData);

    //故障品情報取得
    var queryBody = {
      'app': sysid.DEV.app_id.sNum,
      'query': 'sNum="' + event.record.defective.value + '"',
    };
    var getRepResult = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', queryBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return ['error', error];
      });
    if (getRepResult[0] == 'error') {
      event.error = '故障品情報を取得する際にエラーが発生しました。';
      endLoad();
      return event;
    }


    var respRecords = getRepResult.records;
    delete respRecords[0].$id;
    delete respRecords[0].$revision;
    delete respRecords[0].sNum;
    delete respRecords[0].sDstate;
    delete respRecords[0].sState;
    delete respRecords[0].sendDate;
    delete respRecords[0].sendType;
    delete respRecords[0].レコード番号;
    delete respRecords[0].作成日時;
    delete respRecords[0].作成者;
    delete respRecords[0].ステータス;
    delete respRecords[0].更新者;
    delete respRecords[0].更新日時;

    //交換品情報格納配列
    var putRepairedData = [];
    //故障品情報
    var putRepairedBody = {
      'updateKey': {
        'field': 'sNum',
        'value': event.record.repaired.value
      },
      'record': {}
    };

    putRepairedBody.record = respRecords[0];

    putRepairedData.push(putRepairedBody);
    await putRecords(sysid.DEV.app_id.sNum, putRepairedData);

    endLoad();
    return event;
  });

})();