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
        'query': 'working_status in ("準備中") and application_type in ("新規申込") and syncStatus_member not in ("success")'
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
        //ステータス,ログデータ作成
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
              syncStatus_member: {},
              syncLog_list: {
                value: [{
                  value:{
                    // ログ更新時間（サーバーから時間を取得）
                    syncLog_date: {value: forListDate()},
                    // 実施内容
                    syncLog_type: {value: 'KT-会員情報'},
                    // 成功判断
                    syncLog_status: {},
                    // ログメッセージ（レスポンス内容）
                    syncLog_message: {},
                  }
                }]
              }
            }
          };
          postMemData.push(postBody_member);
          putWStatNewData.push(putBody_workStatNew);
        }

        try {
          if((postMemData.length>0)) await postRecords(sysid.ASS2.app_id.member, postMemData)
            .then(async function (resp) {
              console.log(resp);
              alert('新規申込情報連携に成功しました。');
              // ステータス,ログ更新
              for(const stat of putWStatNewData){
                stat.record.syncStatus_member.value = 'success';
                stat.record.syncLog_list.value[0].value.syncLog_status.value = 'success';
                stat.record.syncLog_list.value[0].value.syncLog_message.value = resp;
              }
              await putRecords(kintone.app.getId(), putWStatNewData)
            }).catch(async function (error) {
              alert('新規申込情報連携に失敗しました。システム管理者に連絡してください。');
              console.log(error);
              // エラーステータス更新
              for(const stat of putWStatNewData){
                stat.record.syncStatus_member.value = 'error';
                stat.record.syncLog_list.value[0].value.syncLog_status.value = 'error';
                stat.record.syncLog_list.value[0].value.syncLog_message = {
                  value: `${error}`
                };
              }
              await putRecords(kintone.app.getId(), putWStatNewData)
            });
        } catch(e){
          alert('新規申込情報連携に失敗しました。システム管理者に連絡してください。');
        }
      }

      endLoad();
      return event;
    });

    return event;
  });
})();