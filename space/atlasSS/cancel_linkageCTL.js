(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    var linkageBtn = setBtn('btn_linkage_sNum', 'シリアル管理連携');
    $('#' + linkageBtn.id).on('click', async function () {
      startLoad();
      /* ＞＞＞ 更新用json作成 ＜＜＜ */
      let updateBody={app:sysid.DEV.app_id.sNum, records:[]}
      // devicelistの数forを回し、jsonをupdateBodyに格納
      for(const device of event.record.device_info.value){
        if(sStateMatchTable[device.value.sState.value]){
          let set_updateRecord={
            id: device.value.sys_sn_recordId.value,
            record: { sState: {value: sStateMatchTable[device.value.sState.value]} }
          };
          updateBody.records.push(set_updateRecord);
        }
      }

      /* ＞＞＞ シリアル管理連携 ＜＜＜ */
      let response_PUT;
      if(updateBody.records.length>0){
        // 更新API実行後、レスポンス内容をjsonにし変数に格納
        response_PUT = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody)
          .then(function (resp) {
            return {
              stat: 'success',
              message: resp
            };
          }).catch(function (error) {
            return {
              stat: 'error',
              message: error
            };
          });
      } else {
        // 更新内容がない場合、アラートを表示しreturn
        alert('更新データがありません。')
        endLoad();
        return event;
      }

      /* ＞＞＞ ログ作成 ＜＜＜ */
      let logUpdateBody={app:sysid.ASS2.app_id.cancellation, records:[]};
      // ログ更新内容
      let set_logUpdateBody = {
        id: event.record.$id.value,
        record: {
          syncLog_list: {
            value: [
              {value: {
                // ログ更新時間（サーバーから時間を取得）
                syncLog_date: {value: forListDate()},
                // 成功判断
                syncLog_status: {value: response_PUT.stat},
                // ログメッセージ（シリアル管理連携のレスポンス内容）
                syncLog_message: {value: JSON.stringify(response_PUT.message)},
              }}
            ]
          }
        }
      };
      logUpdateBody.records.push(set_logUpdateBody)
      await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', logUpdateBody)

      let testJson = {
        app: '179',
        id: '23',
        sbTableCode: 'inventoryList',
        listCode: 'sys_code',
        listValue:{
          'LS090WH-test_t2': {
            updateKey_listCode: 'LS090WH-test_t2',
            updateKey_listValue:{
              'arrivalNum':{
                updateKey_cell: 'arrivalNum',
                operator: '+',
                value: '2'
              },
              'shipNum':{
                updateKey_cell: 'shipNum',
                operator: '-',
                value: '3'
              }
            }
          },
          'LS258-test_t2': {
            updateKey_listCode: 'LS258-test_t2',
            updateKey_listValue:{
              'arrivalNum':{
                updateKey_cell: 'arrivalNum',
                operator: '*',
                value: '2'
              },
              'shipNum':{
                updateKey_cell: 'shipNum',
                operator: '/',
                value: '3'
              }
            }
          },
        }
      }

      console.log(await update_sbTable(testJson));

      endLoad();
      location.reload();
    });

    return event;
  });

})();
