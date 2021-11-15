(function () {
  'use strict';
  kintone.events.on('app.record.detail.process.proceed', async function(event){
    startLoad();
    let nStatus=event.nextStatus.value;
    console.log(nStatus);
    if(nStatus=='検証完了'){
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
    }
    endLoad();
    return event;
  });
})();