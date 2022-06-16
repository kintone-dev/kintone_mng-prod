(function() {
  'use strict';
  kintone.events.on('app.record.index.show', function(event) {
    // var setCancelBody={
    //   'app': sysid.ASS.app_id.member,
    //   'updateKey': {
    //     'field': 'member_id',
    //     'value': event.record.member_id.value
    //   },
    //   'record': {
    //     'churn_datetime': {'value': event.record.churn_datetime.value},
    //     'churn_type': {'value': event.record.churn_type.value}
    //   }
    // };
    // kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', setCancelBody);
    return event;
  });

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
    const memberId = event.record.member_id.value;
    const applicationType = '新規申込';
    const get_appCampaign = await (kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: sysid.ASS2.app_id.shipment,
      query: 'member_id = "' + memberId + '" and application_type in ("' + applicationType + '")',
      fields: ['appCampaign']
    }).record);

    console.log(get_appCampaign);

    if(get_appCampaign == undefined){
      event.record.member_id.error = '不明なエラー';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }
    else if(get_appCampaign.length > 1){
      event.record.member_id.error = '同じ契約IDに申し込み種別が新規申込になっているデータが複数存在します。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }
    else if(get_appCampaign.length < 1){
      event.record.member_id.error = '申し込み種別が新規申込になっている契約IDが見つかりませんでした。';
      event.error = 'レコードを保存できませんでした。エラー内容をご確認ください。';
    }
    else{
      event.record.appCampaign.value = 'ttestt';
    }
    return event;
  });

})();
