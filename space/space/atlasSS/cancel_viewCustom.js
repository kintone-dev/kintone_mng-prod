(function() {
  'use strict';
  kintone.events.on('app.record.index.show', function(event) {
    var setCancelBody={
      'app': sysid.ASS.app_id.member,
      'updateKey': {
        'field': 'member_id',
        'value': event.record.member_id.value
      },
      'record': {
        'churn_datetime': {'value': event.record.churn_datetime.value},
        'churn_type': {'value': event.record.churn_type.value}
      }
    };
    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', setCancelBody);
    return event;
  });
})();
