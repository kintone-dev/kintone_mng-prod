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
      // 登録する会員情報を検索
      let getNewMemBody = {
        'app': kintone.app.getId(),
        'query': 'working_status in ("準備中") and application_type in ("新規申込") and syncStatus_member not in ("success")'
      };
      let newMemData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNewMemBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      var newMemList = newMemData.records;
      if(newMemList.length==0){
        alert('連携する会員データがありません');
      }else{
        // 会員情報が重複していないか確認
        var memIdArray = [];
        for (const newMem of newMemList) {
          memIdArray.push('"' + newMem.member_id.value + '"');
        }
        let getMemBody = {
          'app': sysid.ASS2.app_id.member,
          'query': 'member_id in (' + memIdArray.join() + ')'
        };
        let memData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getMemBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
        console.log(getMemBody);
        console.log(newMemList);
        console.log(memData);

        // 新規申込データ作成
        let postMemData=[];
        // ステータス,ログデータ作成
        let putWStatNewData=[];
        // 重複データ配列
        let dupeData=[];
        if(memData.records.length==0){
          for(const newMem of newMemList){
            var postBody_member = {
              'member_id': {
                'value': newMem.member_id.value
              },
              'member_type': {
                'value': newMem.member_type.value
              },
              'application_datetime': {
                'value': newMem.application_datetime.value
              },
              'start_date': {
                'value': newMem.start_date.value
              },
              'application_type': {
                'value': newMem.application_type.value
              }
            };
            var putBody_workStatNew = {
              'id': newMem.レコード番号.value,
              'record': {
                syncStatus_member: {}
              }
            };
            postMemData.push(postBody_member);
            putWStatNewData.push(putBody_workStatNew);
          }
        } else {
          //新規申込内容作成
          for(const newMem of newMemList) {
            for(const mem of memData.records){
              console.log(newMem.member_id.value);
              console.log(mem.member_id.value);
              if(newMem.member_id.value==mem.member_id.value){
                dupeData.push(newMem.member_id.value)
              }else{
                var postBody_member = {
                  'member_id': {
                    'value': newMem.member_id.value
                  },
                  'member_type': {
                    'value': newMem.member_type.value
                  },
                  'application_datetime': {
                    'value': newMem.application_datetime.value
                  },
                  'start_date': {
                    'value': newMem.start_date.value
                  },
                  'application_type': {
                    'value': newMem.application_type.value
                  }
                };
                var putBody_workStatNew = {
                  'id': newMem.レコード番号.value,
                  'record': {
                    syncStatus_member: {}
                  }
                };
                postMemData.push(postBody_member);
                putWStatNewData.push(putBody_workStatNew);
              }
            }
          }
        }
        console.log(postMemData);
        try {
          if(postMemData.length>0) await postRecords(sysid.ASS2.app_id.member, postMemData)
            .then(async function (resp) {
              alert('新規申込情報連携に成功しました。');
              // ステータス更新
              for(const stat of putWStatNewData){
                stat.record.syncStatus_member.value = 'success';
              }
              //ログ更新
              await setlog_single({
                value: {
                  sys_log_acction: {value: 'KT-会員情報'},
                  syncLog_status: {value: 'success'},
                  sys_log_value: {value: JSON.stringify(resp)}
                }
              });
              await putRecords(kintone.app.getId(), putWStatNewData)
            }).catch(async function (error) {
              alert('新規申込情報連携に失敗しました。システム管理者に連絡してください。');
              // エラーステータス更新
              for(const stat of putWStatNewData){
                stat.record.syncStatus_member.value = 'error';
              }
              await putRecords(kintone.app.getId(), putWStatNewData)
            });
        } catch(e){
          alert('新規申込情報連携に失敗しました。システム管理者に連絡してください。');
          return event;
        }
        if(dupeData.length>0) alert("次の契約IDは登録済みです"+dupeData)
      }


      endLoad();
      return event;
    });

    return event;
  });
})();