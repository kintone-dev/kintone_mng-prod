(function($) {
  "use strict";
  kintone.events.on(['app.record.detail.show','app.record.create.show','app.record.edit.show'], function(event) {
    var recordNo=event.record.mCode.value;
    $(kintone.app.record.getSpaceElement("barcode")).barcode(recordNo, "code128");
  });})(jQuery);