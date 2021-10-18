(function(){
  'use strict';

  kintone.events.on(['app.record.edit.show'], function(event){
    event.record.mName.disabled = true;
    event.record.mCode.disabled = true;
    event.record.mNickname.disabled = true;
    event.record.mType.disabled = true;
    event.record.mVendor.disabled = true;
    event.record.mClassification.disabled = true;
    if(event.record.mType.value=='パッケージ品') setFieldShown('packageComp', true);
    else setFieldShown('packageComp', false);
    for(let i in event.record.packageComp.value){
      event.record.packageComp.value[i].value.pc_mVendor.disabled=true;
      event.record.packageComp.value[i].value.pc_mType.disabled=true;
      event.record.packageComp.value[i].value.pc_mCode.disabled=true;
      event.record.packageComp.value[i].value.pc_mName.disabled=true;
      event.record.packageComp.value[i].value.pc_Num.disabled=true;
    }
    [].forEach.call(document.getElementsByClassName("subtable-operation-gaia"), function(button){ button.style.display = 'none'; });
    return event;
  });
})();