(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', async function (event) {
    setBtn_header('submit_swap', '登録');
    $('#submit_swap').on('click', function(){
      startLoad();
      // sys_defective_recordID
      // sys_repaired_recordID
      let get_repairedInfo={
        'app': sysid.DEV.app_id.sNum,
        'id':event.record.sys_repaired_recordID.value
      }
      kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', get_repairedInfo).then(function(resp){
        // レコードが取得できた場合
        console.log(resp);
      }).catch(function(error){
        console.log(error);
        alert('交換品シリアル番号を入れてください。');
      });
      endLoad();
    });
    return event;
    /**　故障品処理
     * 故障品のシリアルに対し、値を変更する
     * 状態：検証待ち
     * 故障状況：検証待ち
     */
/*
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
          'value': '検証待ち'
        }
      }
    };
    putDefectiveData.push(putDefectiveBody);
    await putRecords(sysid.DEV.app_id.sNum, putDefectiveData);

    /** 交換品処理
     * 故障品情報を取得し、値をコピー
     * 出荷日時を更新
     * /
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
    if (Array.isArray(getRepResult)) {
      event.error = '故障品情報を取得する際にエラーが発生しました。';
      endLoad();
      return event;
    }
    // 取得した故障品の中で不要なデータ削除
    var respRecords = getRepResult.records;
    delete respRecords[0].レコード番号;
    delete respRecords[0].$id;
    delete respRecords[0].$revision;
    delete respRecords[0].sNum;
    delete respRecords[0].sDstate;
    delete respRecords[0].sState;
    delete respRecords[0].sendDate;
    delete respRecords[0].sendType;
    delete respRecords[0].作成日時;
    delete respRecords[0].作成者;
    delete respRecords[0].ステータス;
    delete respRecords[0].更新者;
    delete respRecords[0].更新日時;

    // 交換品情報更新
    var putRepairedData = [];
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
*/
    
    
  });
})();