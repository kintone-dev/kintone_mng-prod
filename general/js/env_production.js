var sysid = set_sysid();
(function () {
  kintone.events.on(['app.record.create.show','app.record.edit.show','app.record.detail.show'], function(event){
    const fields = Object.values(cybozu.data.page.FORM_DATA.schema.table.fieldList);
    for(var fc=8; fc<fields.length; fc++){
      if(fields[fc].var.match(/sys_/)){
        setFieldShown(fields[fc].var, false);
      }
    }
    return event;
  });
})();