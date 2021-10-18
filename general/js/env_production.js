var sysid = set_sysid();
(function () {
  kintone.events.on(['app.record.create.show','app.record.edit.show','app.record.detail.show'], function(event){
    for(let i=8; i<fields.length; i++){
      if(fields[i].var.match(/sys_/)){
        setFieldShown(fields[i].var, false);
      }
    }
    return event;
  });
})();