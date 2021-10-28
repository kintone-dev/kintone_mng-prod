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
      console.log(compData);
      var putStatData = {
        'app': sysid.DEV.app_id.sNum,
        'records': []
      };
      for (let i in compData.records) {
        var putStatBody = {
          'updateKey': {
            'field': 'pkgid',
            'value': compData.records[i].member_id.value
          },
          'record': {
            'churn_type': {
              'value': compData.records[i].churn_type.value
            },
            'endDate': {
              'value': compData.records[i].churn_datetime.value
            }
          }
        }
        putStatData.records.push(putStatBody);
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