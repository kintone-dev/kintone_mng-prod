function deletSB(subTable, fCode){
  kintone.events.on('app.record.index.record', function(event){
    console.log(event);
  });
  // let subTableValue=kintone.app.record.get().record[subTable];
  // for(let i in subTableValue){
  //   subTableValue[i].value[fCode].value='';
  // }
}
function testtt(text){
  console.log(text)
}