(function () {
  'use strict';
  kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], async function(event){
    // btn_renew
    // sys_supNum
    // supNum
    let renew=setBtn('btn_renew','更新');
    renew.onclick=async function(){
      let supNumValue = event.record.supNum.value;
      let sys_supNumValue = event.record.sys_supNum.value;

      let renewBody = {};
      if(!supNumValue || supNumValue == sys_supNumValue){
        console.log('更新');
        renewBody = {
          app: kintone.app.getId(),
          id: kintone.app.record.getId(),
          record: {
            supNum: {value: sys_supNumValue},
            infoError: {value: []},
            ErrorMessage: {value: ''}
          }
        };
      }else{
        console.log('エラー');
        renewBody = {
          app: kintone.app.getId(),
          id: kintone.app.record.getId(),
          record: {
            infoError: {value: ['InformationError']},
            ErrorMessage: {value: '格納した問い合わせ番号と、連携した問い合わせ番号が一致しません。'}
          }
        };
      }
      let renewResult = await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', renewBody);
      console.log(renewResult);
    }
  });
})();