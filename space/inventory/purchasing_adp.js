(function () {
  'use strict';

  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    var nStatus = event.nextStatus.value;
    var sendDate = event.record.arrivalDate.value;
    sendDate = sendDate.replace(/-/g, '');
    sendDate = sendDate.slice(0, -2);
    var reportData = await checkEoMReport(sendDate);
    if (reportData == false) {
      event.error = '対応した日付のレポートは締切済みです。';
      return event;
    }

    if (nStatus === '仕入完了') {
      // 在庫処理
      await stockCtrl(event, kintone.app.getId());
      // レポート処理
      await reportCtrl(event, kintone.app.getId());
    }
  });
})();