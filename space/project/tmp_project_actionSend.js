(function() {
'use strict';
  var prjNumValue='';
  var orgname='';
  var instname='';
  kintone.events.on('app.record.create.change.prjNum', function(event) {
    prjNumValue=event.record.prjNum.value;
    return event;
  });
  kintone.events.on('app.record.create.change.sys_orgName', function(event) {
    orgname=event.record.sys_orgName.value;
    return event;
  });
  kintone.events.on('app.record.create.change.instName', function(event) {
    instname=event.record.instName.value;
    return event;
  });


  kintone.events.on(['app.record.create.show','app.record.edit.show','app.record.detail.show'], function(event) {
    prjNumValue=event.record.prjNum.value;
    orgname=event.record.sys_orgName.value;
    instname=event.record.instName.value;
    //新規設置先
    var newIST=setBtn('btn_newIST','新規設置先');
    $('#'+newIST.id).on('click', function(){
      createNewREC(sysid.DIPM.app.inst, ['prjNum', 'orgName'], [prjNumValue, orgname]);
    });
  });

  kintone.events.on(['app.record.detail.show'], function(event) {
    if(event.record.Exist_Project.value[0]===''){
      console.log('good');
      setFieldShown('Exist_Project', false);
    }
    var sType=event.record.salesType.value;

    return event;
  });
})();
