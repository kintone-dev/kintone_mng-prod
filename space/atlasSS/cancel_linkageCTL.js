(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    var linkageBtn = setBtn('btn_linkage_sNum', 'シリアル管理連携');
    $('#' + linkageBtn.id).on('click', async function () {
      startLoad();
      // エラー処理

      // 更新用json作成
      let updateBody={app:sysid.DEV.app_id.sNum, records:[]}

      for(const device of event.record.device_info.value){
        if(!setShiptype[device.value.sState.value]){
          let set_updateRecord={
            id: device.value.sys_sn_recordId.value,
            record: {
              sState: {value: setShiptype[device.value.sState.value]}
            }
          };
          updateBody.records.push(set_updateRecord);
        }
      }

      console.log(updateBody);

      // シリアル管理連携
      // let response_PUT={};
      // if(updateBody.records.length>0) response_PUT = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody);

      let logDate = formatDate(getServerDate(), 'YYYY')+'-'+formatDate(getServerDate(), 'MM')+'-'+formatDate(getServerDate(), 'DD')+'T'+formatDate(getServerDate(), 'hh')+':'+formatDate(getServerDate(), 'mm')+':00Z'
      console.log(logDate);

      // ログ作成
      let logUpdateBody={app:sysid.ASS2.app_id.cancellation, records:[]};
      let set_logUpdateBody = {
        id: event.record.$id.value,
        record: {
          "syncLog_list": {
            value: [
              {value: {
                syncLog_date: {value: logDate},
                syncLog_status: {value: 'success'},
                syncLog_message: {value: 'test'},
              }}
            ]
          }
        }
      };
      logUpdateBody.records.push(set_logUpdateBody)
      await kintone.api(kintone.api.url('/k/v1/records.json', true), 'POST', logUpdateBody)

      // response_PUT.then(function (resp) {
      //   console.log(resp);

      //   await kintone.api(kintone.api.url('/k/v1/records.json', true), 'POST', logUpdateBody)
      //   return resp;
      // }).catch(function (error) {
      //   console.log(error);
      //   return 'error';
      // });

      endLoad();
    });

    return event;
  });

})();
