(function () {
  'use strict';

  var events_ced = [
    'app.record.create.submit',
    'app.record.edit.submit'
  ];

  kintone.events.on(events_ced, async function (event) {
    let instname=event.record.instName.value;
    let pkgid=event.record.pkgid.value;

    /**
     * Titan関連
     * 設置先がass-ASSの場合、契約IDが空欄の場合エラー
     */
    // 設置先がass-ASSの場合、PKG-ID/部屋・物件名/契約ID
    if(instname=='ass-ASS'){
      if(pkgid==undefined){
        event.error=('Titanの会員IDを入力してください');
      }else{
        startLoad();
        let queryBody={
          'app': sysid.ASS.app_id.shipment,
          'query': 'member_id="'+pkgid+'" and application_type in ("新規申込") and sys_alResult not like "tcinfo"'
        }
        let getTitanId=await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', queryBody).then(async function(resp){
          console.log(resp);
          let bizid=event.record.toastcam_bizUserId.value;
          let bizpw=event.record.toastcam_bizUserPassword.value;
          let setMemberRecord={
            'app': sysid.ASS.app_id.member,
            'updateKey': {
              'field': 'member_id',
              'value': pkgid
            },
            'record': {
              'toastcam_bizUserId': {'value': bizid},
              'toastcam_bizUserPassword': {'value': bizpw}
            }
          };
          let setShipmentRecord={
            'app': sysid.ASS.app_id.shipment,
            'id': resp.records[0].$id.value,
            'record':{
              'toastcam_bizUserId': {'value': bizid},
              'working_status': {'value': '必要情報入力済み'},
              'person_in_charge': {'value': 'For needs'},
              'sys_alResult': {'value': resp.records[0].sys_alResult.value+', tcinfo'}
            }
          };
          console.log(setMemberRecord);
          console.log(setShipmentRecord);
          let setMemberResult=await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', setMemberRecord);
          let setShipmentResult=await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', setShipmentRecord);
          let respResult=[{'getShipment': resp}];
          respResult.push({'setShipment': setShipmentResult});
          respResult.push({'setMember': setMemberResult});
          console.log(respResult)
          return respResult;
        }).catch(function(error){
          console.log(error);
          return error;
        });
        if (Array.isArray(getTitanId)) {
          event.error = 'Titan関連エラー。入力したデーターを確認し、もう一度お試しください。問題が解決しない場合はシステム管理者にご連絡ください。';
          endLoad();
          return event;
        }
        alert('BizUserId連携成功');
      }
    }
    endLoad();
    return event;
  });

})();