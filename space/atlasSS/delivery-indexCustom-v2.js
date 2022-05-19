(function () {
  'use strict';

  kintone.events.on('app.record.index.show', function (event) {
    var sync_kintone = setBtn_index('btn_sync_kintone', '会員情報連携');

    //内部連携ボタンクリック時
    $('#' + sync_kintone.id).on('click', async function () {
      startLoad();
      /*①
        作業ステータス：準備中
        担当者：--------
        申込種別：新規申込

        会員情報に情報を更新
        AL専用を会員情報登録済に
      */
      var getNewMemBody = {
        'app': kintone.app.getId(),
        'query': 'working_status in ("準備中") and application_type in ("新規申込") and sys_alResult not in ("success")'
      };
      var newMemData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNewMemBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      console.log(newMemData);

      var newMemList = newMemData.records;
      if(newMemList.length==0){
        console.log('連携する会員データがありません');
      }else{
        //新規申込データ作成
        var postMemData = [];
        //新規申込作業ステータスデータ作成
        var putWStatNewData = [];
        //新規申込内容作成
        for(let i in newMemList) {
          var postBody_member = {
            'member_id': {
              'value': newMemList[i].member_id.value
            },
            'member_type': {
              'value': newMemList[i].member_type.value
            },
            'application_datetime': {
              'value': newMemList[i].application_datetime.value
            },
            'start_date': {
              'value': newMemList[i].start_date.value
            },
            'application_type': {
              'value': newMemList[i].application_type.value
            }
          };
          var putBody_workStatNew = {
            'id': newMemList[i].レコード番号.value,
            'record': {
              'syncStatus_member': {}
            }
          };
          postMemData.push(postBody_member);
          putWStatNewData.push(putBody_workStatNew);
        }


        await postRecords(sysid.ASS2.app_id.member, postMemData)
          .then(function (resp) {
            alert('新規申込情報連携に成功しました。');
            for(const logs of putWStatNewData){
              logs.record.syncStatus_member.value = 'success';
            }
            putRecords(kintone.app.getId(), putWStatNewData);
          }).catch(function (error) {
            alert('新規申込情報連携に失敗しました。システム管理者に連絡してください。');
            for(const logs of putWStatNewData){
              logs.record.syncStatus_member.value = 'error';
            }
            putRecords(kintone.app.getId(), putWStatNewData);
          });
      }

      endLoad();

      return event;
    });

    return event;
  });
})();