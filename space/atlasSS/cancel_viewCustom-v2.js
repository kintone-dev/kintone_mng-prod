(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event) {
    setFieldShown('sys_sn_recordId', false);
    return event;
  });

  kintone.events.on(['app.record.create.show','app.record.edit.show','app.record.detail.show'], function(event) {
    event.record.firstRecordNum.disabled = true;
    event.record.appCampaign.disabled = true;
    return event;
  });
  kintone.events.on('app.record.edit.show', function(event){
    event.record.member_id.disabled = true;
    return event;
  });
  kintone.events.on('app.record.create.submit', async function(event){
    if(confirm(event.record)){
      return false;
    }
    const memberId = event.record.member_id.value;
    const get_applicationType = '新規申込';
    const get_appCampaign = (await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: sysid.ASS2.app_id.shipment,
      query: 'member_id = "' + memberId + '" and application_type in ("' + get_applicationType + '")',
      fields: ['appCampaign']
    })).records;

    if(get_appCampaign == undefined){
      event.record.member_id.error = '不明なエラー';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else if(get_appCampaign.length > 1){
      event.record.member_id.error = '同じ契約IDで、申し込み種別が新規申込になっているデータが複数存在します。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else if(get_appCampaign.length < 1){
      event.record.member_id.error = '申し込み種別が新規申込になっている契約IDが見つかりませんでした。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }else{
      event.record.appCampaign.value = get_appCampaign[0].appCampaign.value;
    }
    return event;
  });
  kintone.events.on('app.record.create.submit.success',async function(event) {
    let updateJson = {
      app: kintone.app.getId(),
      id: event.record.recordNum.value,
      record:{
        firstRecordNum:{
          value: event.record.recordNum.value
        }
      }
    }
    let putResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateJson)
      .then(function (resp) {
        // console.log(resp);
        return {
          result: true,
          message: resp
        };
      }).catch(function (error) {
        // console.log(error);
        return {
          result: false,
          message: error
        };
      });
    if(!putResult.result){
      alert('初回受付IDの登録に失敗しました')
      return event;
    }
    return event;
  });

})();
