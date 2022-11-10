(function () {
  'use strict';
  kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], async function(event){
    // btn_renew
    let renew=setBtn('btn_renew','更新');
    renew.onclick=function(){
      alert('tttt');
    }
  });
})();