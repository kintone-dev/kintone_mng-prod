(function () {
  'use strict';

  kintone.events.on('app.record.create.change.cmsType', async function (event) {
    const cmstype = event.record.cmsType.value;
    event.record.cmsPW.disabled = true;
    event.record.cmsPW.value = pw_generator(10);
    if(cmstype == 'TCアカウント'){
      event.record.cmsID.disabled = true;
      let ttt = await $.ajax({
        type: 'GET'
      }).done(function (data, status, xhr) {
        let serverDate = new Date(xhr.getResponseHeader('Date')).getTime(); //サーバー時刻を代入
        let utcNum = Math.floor(serverDate / 5000); //5秒の幅を持って、切り上げる

        // let eRecord = kintone.app.record.get(); //レコード値を取得
        // eRecord.record.cmsID.value = 'TC_' + utcNum + '@accel-lab.com';
        // eRecord.record.cmsPW.value = pw_generator(10);
        // // eRecord.record.contractStatus.value = '';
        // // eRecord.record.usageStatus.value = '';
        // kintone.app.record.set(eRecord); //変更内容を反映

        // event.record.cmsID.value = 'TC_' + utcNum + '@accel-lab.com';
        return utcNum
      });
      console.log(ttt);
    }
    if(cmstype == 'Danaアカウント'){
      event.record.cmsID.disabled = false;
      event.record.cmsID.value = '';
    }
    return event;
  });
  
  // kintone.events.on('app.record.create.show', function(event){
  //   return event;
  // });

  kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], function (event) {
    const cmstype = event.record.cmsType.value;
    if(cmstype == 'TCアカウント'){
      var openTcms = setBtn('btn_open_cms', 'ToastCam CMS');
    
      $('#' + openTcms.id).on('click', function () {
        window.open('https://cms.toastcam.com/#/bizUserManagementWrite?searchType=&searchWord=&pageNumber=1&count=10&time=1629776725393', '_blank');
      });
    }
    if(cmstype == 'Danaアカウント'){
      var openTcms = setBtn('btn_open_cms', 'Danalock CMS');
    
      $('#' + openTcms.id).on('click', function () {
        window.open('https://my.danalock.com/#/login', '_blank');
      });
    }
    return event;
  });

})();