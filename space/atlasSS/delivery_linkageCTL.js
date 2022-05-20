(function() {
  'use strict';
  kintone.events.on(['app.record.create.submit.success','app.record.edit.submit.success'], function(event) {
    console.log(event.record);
    if(event.record.working_status.value!='出荷完了'){
      console.log('作業ステータスが出荷完了以外です。');
      return event;
    }
    if(event.record.syncStatus_batch.value=='error'){
      console.log('デバイス登録確認がエラーです。');
      return event;
    }
    if(event.record.syncStatus_serial.value!='success'){
      console.log(event.record.syncStatus_serial.value);
    }

    return event;
  });

})();
