(function () {
  'use strict';
  kintone.events.on('app.record.index.show', function (event) {
    var sync_kintone = setBtn_index('btn_sync_kintone', '情報連携');

    $('#' + sync_kintone.id).on('click', async function () {
      startLoad();
      /*①
        申込種別：指定なし
        作業ステータス：対応完了
        シリアル管理の対応した会員IDのものに申込種別を更新
      */
      var getCompBody = {
        'app': kintone.app.getId(),
        'query': 'churn_status in ("対応完了")'
      };
      var compData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getCompBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
      if (Array.isArray(compData)) {
        alert('シリアル管理連携の際にエラーが発生しました');
        endLoad();
        return event;
      }
      var memIdArray = [];
      for (let i in compData.records) {
        memIdArray.push('"' + compData.records[i].member_id.value + '"');
      }
      var getSnumBody = {
        'app': sysid.DEV.app_id.sNum,
        'query': 'pkgid in (' + memIdArray.join() + ')'
      };
      var sNumData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getSnumBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
      if (Array.isArray(sNumData)) {
        alert('シリアル管理連携の際にエラーが発生しました');
        endLoad();
        return event;
      };
      var putStatData = {
        'app': sysid.DEV.app_id.sNum,
        'records': []
      };
      for (let i in sNumData.records) {
        for (let j in compData.records) {
          if (sNumData.records[i].pkgid.value == compData.records[j].member_id.value) {
            var date = new Date(compData.records[j].churn_datetime.value);
            console.log(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
            var putStatBody = {
              'id': sNumData.records[i].$id.value,
              'record': {
                'churn_type': {
                  'value': compData.records[j].churn_type.value
                },
                'endDate': {
                  'value': date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
                }
              }
            }
            putStatData.records.push(putStatBody);
          }
        }
      }

      console.log(putStatData);
      var putStatResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putStatData)
        .then(function (resp) {
          console.log('success');
          console.log(resp);
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
      if (Array.isArray(putStatResult)) {
        alert('シリアル管理連携の際にエラーが発生しました');
        endLoad();
        return event;
      }
      endLoad();
    });

    return event;
  });
})();