(function () {
  'use strict';
  //プロセス変更時
  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    startLoad();
    var nStatus = event.nextStatus.value;


    if (nStatus == '入力内容確認中') { //ステータスが入力内容確認中の場合
    } else if (nStatus == '納品準備中') {
    } else if (nStatus == '完了') { //ステータスが完了の場合
    }
    endLoad();
    return event;
  });



})();