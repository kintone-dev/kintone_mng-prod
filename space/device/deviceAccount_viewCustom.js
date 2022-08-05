(function () {
  'use strict';

  var events_ced = [
    'mobile.app.record.create.show',
    'mobile.app.record.edit.show',
    'mobile.app.record.detail.show',
    'app.record.create.show',
    'app.record.detail.show',
    'app.record.edit.show'
  ];

  kintone.events.on(events_ced, function (event) {
    const cmstype = event.record.cmsType.value;
    if(cmstype == 'TCアカウント'){
      event.record.cmsID.disabled = true;
      event.record.cmsPW.disabled = true;
    }
    if(cmstype == 'Danaアカウント'){
      event.record.cmsID.disabled = false;
      event.record.cmsPW.disabled = false;
    }

    return event;
  });

  kintone.events.on('app.record.create.change.cmsType', function (event) {
    const cmstype = event.record.cmsType.value;
    if(cmstype == 'TCアカウント'){
      $.ajax({
        type: 'GET'
      }).done(function (data, status, xhr) {
        var serverDate = new Date(xhr.getResponseHeader('Date')).getTime(); //サーバー時刻を代入
        var utcNum = Math.floor(serverDate / 5000); //5秒の幅を持って、切り上げる

        var eRecord = kintone.app.record.get(); //レコード値を取得

        eRecord.record.cmsID.value = 'TC_' + utcNum + '@accel-lab.com';
        eRecord.record.cmsPW.value = pw_generator(10);
        // eRecord.record.contractStatus.value = '';
        // eRecord.record.usageStatus.value = '';
        kintone.app.record.set(eRecord); //変更内容を反映
      });
    }
    if(cmstype == 'Danaアカウント'){
      event.record.cmsID.value = '';
      event.record.cmsPW.value = '';
    }

    return event;
  });

  kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], function (event) {
    var openTcms = setBtn('btn_open_tCMS', 'ToastComCMS');
    
    $('#' + openTcms.id).on('click', function () {
      window.open('https://cms.toastcam.com/#/bizUserManagementWrite?searchType=&searchWord=&pageNumber=1&count=10&time=1629776725393', '_blank');
    });

    return event;
  });

})();