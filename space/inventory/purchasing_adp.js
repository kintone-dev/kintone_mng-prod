(function () {
  'use strict';

  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    startLoad();
    var nStatus = event.nextStatus.value;
    var sendDate = event.record.arrivalDate.value;
    sendDate = sendDate.replace(/-/g, '');
    sendDate = sendDate.slice(0, -2);
    var reportData = await checkEoMReport(sendDate, kintone.getLoginUser());
    if(Array.isArray(reportData)){
      if (reportData[0] == 'false') {
        event.error = '対応した日付のレポートは' + reportData[1] + '済みです。';
        endLoad();
        return event;
      } else if(reportData[0] == 'true'){
        if(!confirm('対応した日付のレポートは' + reportData[1] + '済みです。\n作業を続けますか？')){
          endLoad();
          return event;
        }
      }
    }
    if (nStatus === '仕入完了') {
      var devArray = [];
      for (let i in event.record.arrivalList.value) {
        devArray.push(event.record.arrivalList.value[i].value.mCode.value);
      }
      console.log(devArray);
      //重複チェック関数
      function existsSameValue(a) {
        var s = new Set(a);
        return s.size != a.length;
      }
      if (existsSameValue(devArray)) {
        event.error = '品目が重複しています'
        endLoad();
        return event;
      }
      // 在庫処理
      await stockCtrl(event, kintone.app.getId());
      // レポート処理
      await reportCtrl(event, kintone.app.getId());
    }
    endLoad();
    return event;
  });
})();