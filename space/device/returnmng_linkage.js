(function() {
  'use strict';
  kintone.events.on('app.record.edit.show',async function(event) {
    var linkage_return=setBtn('btn_linkage_return','シリアルテーブル作成');
    $('#'+linkage_return.id).on('click', function(){
      var eRecord = kintone.app.record.get();
      let snArray = (eRecord.record.sNums.value).split(/\r\n|\n/);
      console.log(snArray);
			// snArray.forEach(function(snum){
			// 	if(snum) snumsInfo.serial[snum]={sNum: snum, sInfo: i};
			// });

    });


    return event;
  });


})();