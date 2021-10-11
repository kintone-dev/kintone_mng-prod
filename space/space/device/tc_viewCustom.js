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
    event.record.toastcam_bizUserId.disabled = true;
    event.record.toastcam_bizUserPassword.disabled = true;

    return event;
  });

  kintone.events.on('app.record.create.show', function (event) {
    $.ajax({
      type: 'GET'
    }).done(function (data, status, xhr) {
      var serverDate = new Date(xhr.getResponseHeader('Date')).getTime(); //サーバー時刻を代入
      var utcNum = Math.floor(serverDate / 5000); //5秒の幅を持って、切り上げる

      var eRecord = kintone.app.record.get(); //レコード値を取得

      eRecord.record.toastcam_bizUserId.value = 'TC_' + utcNum + '@accel-lab.com';
      eRecord.record.toastcam_bizUserPassword.value = pw_generator(10);
      kintone.app.record.set(eRecord); //変更内容を反映
    });

    return event;
  });

  kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], function (event) {
    var openTcms = setBtn('btn_open_tCMS', 'CMS');
    
    $('#' + openTcms.id).on('click', function () {
      window.open('https://cms.toastcam.com/#/bizUserManagementWrite?searchType=&searchWord=&pageNumber=1&count=10&time=1629776725393', '_blank');
    });

    return event;
  });

})();