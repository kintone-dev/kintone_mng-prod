(function () {
  'use strict';
  kintone.events.on('app.record.edit.show', function (event) {
    if(event.record.sys_isSubmit.value){
      alert('交換登録済みのデータです。\n更新が必要な場合は、管理者にご連絡ください。');
      window.history.back(-1);
      return false;
    }
  });
  kintone.events.on('app.record.edit.submit', function (event) {
    if(event.record.sys_isSubmit.value){
      alert('交換登録済みのデータです。\n更新が必要な場合は、管理者にご連絡ください。');
      return false;
    }
  });
  kintone.events.on('app.record.detail.show', function (event) {
    if(event.record.sys_isSubmit.value){
      startLoad();
      setBtn_header('update_swap', '更新');
      $('#update_swap').on('click', function(){
        alert('機能設計中。。。\nこの機能はまた使用できません。');
      });
      endLoad();
    }else{
      setBtn_header('submit_swap', '登録');
      $('#submit_swap').on('click', function(){
        startLoad();
        // sys_defective_recordID
        // sys_repaired_recordID
        // sys_isSubmit
        let is_putdefective=new Boolean();
        let is_putrepaired=new Boolean();
        console.log('is_putdefective: '+is_putdefective);
        console.log('is_putrepaired: '+is_putrepaired);
        let get_repairedInfo={
          'app': sysid.DEV.app_id.sNum,
          'id': event.record.sys_repaired_recordID.value
        };
        kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', get_repairedInfo).then(function(resp){
          console.log(resp);
          if(resp.record.sState.value=='再生品'){
            // 故障品シリアル情報取得
            let get_defectiveInfo={
              'app': sysid.DEV.app_id.sNum,
              'id': event.record.sys_defective_recordID.value
            };
            kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', get_defectiveInfo).then(async function(resp){
              console.log(resp);
              // 故障品シリアルの「状態」を更新
              let set_defectiveInfo={
                'app': sysid.DEV.app_id.sNum,
                'id': event.record.sys_defective_recordID.value,
                'record': {'sState': {'value': '検証待ち'}}
              };
              await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', set_defectiveInfo).then(function(resp){
                is_putdefective=true;
                console.log('is_putdefective: '+is_putdefective);
                console.log('is_putrepaired: '+is_putrepaired);
              });

              // 交換品シリアルに、故障品シリアルからのデータを上書き
              let set_repairedInfo={
                'app': sysid.DEV.app_id.sNum,
                'id': event.record.sys_repaired_recordID.value,
                'record': {
                  'instName': {'value': resp.record.instName.value},
                  'pkgid': {'value': resp.record.pkgid.value},
                  'warranty_startDate': {'value': resp.record.warranty_startDate.value},
                  'warranty_period': {'value': resp.record.warranty_period.value},
                  'use_stopDate': {'value': resp.record.use_stopDate.value},
                  'use_endDate': {'value': resp.record.use_endDate.value},
                  'toastcam_bizUserId': {'value': resp.record.toastcam_bizUserId.value},
                  'orgName': {'value': resp.record.orgName.value},
                  'receiver': {'value': resp.record.receiver.value},
                  'churn_type': {'value': resp.record.churn_type.value},

                  'sendDate': {'value': event.record.repaired_sendDate.value}
                  // 'warranty_endDate': {'value': resp.record.churn_type.value}, //計算式を確立の上、コメント解除する
                  // 'shipment': {'value': resp.record.churn_type.value}　//運用上の扱いを確立の上、コメント解除する
                }
              };
              await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', set_repairedInfo).then(function(resp){
                is_putrepaired=true;
                console.log('is_putdefective: '+is_putdefective);
                console.log('is_putrepaired: '+is_putrepaired);
              });

              // 当レコード「sys_isSubmit」値を更新
              console.log('is_putdefective: '+is_putdefective);
              console.log('is_putrepaired: '+is_putrepaired);
              if(is_putdefective && is_putrepaired){
                alert('登録完了しました');
                let set_isSubmit={
                  'app': kintone.app.getId(),
                  'id': kintone.app.record.getId(),
                  'record': {'sys_isSubmit': {'value': 'true'}}
                };
                kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', set_isSubmit).then(function(resp){location.reload();});
              }
              
            });
          }else{
            errorMessage('unknowSN');
          }
        }).catch(function(error){
          console.log(error);
          errorMessage('unknowSN');
        });
        endLoad();
      });
    }
    
    function errorMessage(messagrType){
      switch(messagrType){
        case 'unknowSN':
          alert('交換品シリアル番号に問題があります。\nシリアル番号を確認の上、再度お試しください。');
          break;
      }
    }
    
    return event;
  });
})();