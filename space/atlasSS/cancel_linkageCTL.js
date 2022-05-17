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
        let set_updateRecord={
          id: device.value.sys_sn_recordId.value,
          record: {
            sState: {value: device.value.sState.value}
          }
        };
        updateBody.records.push(set_updateRecord);
      }

      console.log(updateBody);

      // シリアル管理連携


      // ログ作成

      endLoad();
    });

    return event;
  });

})();
