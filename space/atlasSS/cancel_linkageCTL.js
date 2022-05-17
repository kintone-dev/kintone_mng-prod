(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    var linkageBtn = setBtn('btn_linkage_sNum', 'シリアル管理連携');
    $('#' + linkageBtn.id).on('click', async function () {
      startLoad();
      /* ＞＞＞ 更新用json作成 ＜＜＜ */
      let updateBody={app:sysid.DEV.app_id.sNum, records:[]}
      for(const device of event.record.device_info.value){
        if(sStateMatchTable[device.value.sState.value]){
          let set_updateRecord={
            id: device.value.sys_sn_recordId.value,
            record: {
              sState: {value: sStateMatchTable[device.value.sState.value]}
            }
          };
          updateBody.records.push(set_updateRecord);
        }
      }

      /* ＞＞＞ シリアル管理連携 ＜＜＜ */
      let response_PUT={};
      if(updateBody.records.length>0){
        response_PUT = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody);
      } else {
        alert('更新データがありません。')
        return event;
      }

      /* ＞＞＞ ログ作成 ＜＜＜ */
      let logUpdateBody={app:sysid.ASS2.app_id.cancellation, records:[]};
      response_PUT.then(async function (resp) {
        console.log(resp);
        let set_logUpdateBody = {
          id: event.record.$id.value,
          record: {
            syncLog_list: {
              value: [
                {value: {
                  syncLog_date: {value: forListDate()},
                  syncLog_status: {value: 'success'},
                  syncLog_message: {value: resp},
                }}
              ]
            }
          }
        };
        logUpdateBody.records.push(set_logUpdateBody)
        await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', logUpdateBody)
        return resp;
      }).catch(async function (error) {
        console.log(error);
        let set_logUpdateBody = {
          id: event.record.$id.value,
          record: {
            syncLog_list: {
              value: [
                {value: {
                  syncLog_date: {value: forListDate()},
                  syncLog_status: {value: 'error'},
                  syncLog_message: {value: error},
                }}
              ]
            }
          }
        };
        logUpdateBody.records.push(set_logUpdateBody)
        await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', logUpdateBody)
        return 'error';
      });
      endLoad();
      location.reload();
    });

    return event;
  });

})();
