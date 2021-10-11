(function() {
  'use strict';
  kintone.events.on('app.record.detail.show', function(event){
    var bizPW=event.record.toastcam_bizUserPassword.value;
    
    // var create_bizid=setBtn('btn_create_bizid','bizID作成');
    // $('#'+create_bizid.id).on('click', function(){
    //   var menID=event.record.member_id.value;
    //   var setRecordBody={
    //     'app': kintone.app.getId(),
    //     'id': kintone.app.record.getId(),
    //     'record': {
    //       'toastcam_bizUserId': {'value': menID+'@accel-lab.com'},
    //       'toastcam_bizUserPassword': {'value': pw_generator(10)}
    //     }
    //   };
    //   kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', setRecordBody);
    //   location.reload();
    // });
    //bizPASSが既にある場合、「bizID作成」ボタン非表示
    // var elTag = kintone.app.record.getSpaceElement('btn_create_bizid');
    // if(bizPW==='') elTag.parentNode.style.display = 'block';
    // else elTag.parentNode.style.display = 'none';
    
    //toastcamのCMSを別タブで開く
    // var openTcms=setBtn('btn_open_tCMS', 'CMS');
    // $('#'+openTcms.id).on('click', function(){
    //   window.open('https://cms.toastcam.com/#/bizUserManagementWrite?searchType=&searchWord=&pageNumber=1&count=10&time=1629776725393', '_blank');
    // });
    // return event;
  });
  
  kintone.events.on('app.record.detail.show',function(event){
    setSpaceShown('btn_open_tCMS','individual','none');
  });
})();
