(function() {
  'use strict';
  kintone.events.on(['app.record.create.submit.success','app.record.edit.submit.success'], function(event) {
    console.log(event.record);
    if(!event.record.working_status.value=='出荷完了'){
      return event;
    }
    if(event.record.syncStatus_batch.value=='error'){
      return event;
    }
    console.log(!event.record.syncStatus_serial.value=='success');
    if(!event.record.syncStatus_serial.value=='success'){
      console.log(event.record.syncStatus_serial.value);
    }

    return event;
  });

})();
