(function () {
  'use strict';
  kintone.events.on('app.record.detail.process.proceed', async function(event){
    startLoad();
    let nStatus=event.nextStatus.value;
    console.log(nStatus);
    if(nStatus=='検証完了'){
      let getSN_sState={
        'app':sysid.DEV.app_id.sNum,
        'query':'sNum="'+event.record.sNum.value+'" and sState not in ("","使用中","正常品","再生品")'
      };
      kintone.api(kintone.api.url('/k/v1/records', true), 'GET', getSN_sState).then(function(resp){
        let putDefectiveMgtData=[];
        let putDefectiveMgtBody={
          'updateKey': {
            'field': 'sNum',
            'value': event.record.sNum.value
          },
          'record': {}
        }
        let defectiveJudgment=event.record.defectiveJudgment.value;
        switch(defectiveJudgment){
          case '故障あり':
            putDefectiveMgtBody.record={
              'sState':{'value': '故障品'},
              'sDstate':{'value': event.record.sDstate.value},
              'Verifier':{'value': event.record.Verifier.value}
            }
            break;
          case '故障なし':
            putDefectiveMgtBody.record={
              'sState':{'value': '再生品'},
              'sDstate':{'value': ''},
              'Verifier':{'value': event.record.Verifier.value}
            }
            break;
          case '判定不可':
            putDefectiveMgtBody.record={
              'sState':{'value': '判定不可'},
              'sDstate':{'value': ''},
              'Verifier':{'value': event.record.Verifier.value}
            }
            break;
        }
        putDefectiveMgtData.push(putDefectiveMgtBody);
        await putRecords(sysid.DEV.app_id.sNum, putDefectiveMgtData);
      }).catch(function(error){
        console.log(error);
        return ['error', error];
      });
    }
    if (Array.isArray(getRepResult)) {
      event.error = '未登録のシリアル番号または故障申告ができてないシリアル番号です。';
      endLoad();
      return event;
    }
    endLoad();
    return event;
  });
})();