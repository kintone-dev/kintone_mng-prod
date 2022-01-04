(function () {
  'use strict';
  kintone.events.on('app.record.create.show', function(event){
    if(sessionStorage.getItem('is_copy_prjdata')){
      event.record+=JSON.parse(sessionStorage.getItem('copy_prjdata'));
      // event.record.Contractor.lookup=true;
      // event.record.instName.lookup=true;
      // event.record.sys_prjId.lookup=true;
      // let devicelistValue=event.record.deviceList.value;
      // for(let i in devicelistValue){
      //   devicelistValue[i].value.mNickname.lookup=true;
      // }
      console.log(event);
      sessionStorage.removeItem('is_copy_prjdata');
    }
    return event;
  });
})();