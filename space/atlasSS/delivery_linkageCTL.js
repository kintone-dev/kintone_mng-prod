(function() {
  'use strict';
  kintone.events.on('app.record.create.submit.success', function(event) {
    console.log(event.record);
    // if(){

    // }

    return event;
  });

})();
