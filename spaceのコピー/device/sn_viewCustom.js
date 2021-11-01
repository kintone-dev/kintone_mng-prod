(function() {
  'use strict';
  kintone.events.on(['app.record.create.show','app.record.detail.show','app.record.edit.show'], function(event) {
    if(event.record.pkgid.value===''){
      setFieldShown('pkgList', false);
    }else{
      setFieldShown('pkgList', true);
    }
    return event;
  });
})();