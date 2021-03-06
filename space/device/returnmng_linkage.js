(function() {
  'use strict';

  kintone.events.on('app.record.create.show',async function(event) {
    // ボタン作成
    var linkage_return=setBtn('btn_linkage_return','シリアルテーブル作成');
    $('#'+linkage_return.id).on('click', function(){
      startLoad();
      var eRecord = kintone.app.record.get();
      let createDLResult = createDeviceList(eRecord)
      if(!createDLResult.result){
        endLoad();
        return event;
      } else {
        // snum関連の初期化
        eRecord.record.sNums.value = '';
        eRecord.record.returnDate_into.value = '';
        eRecord.record.returnCheacker_into.value = '';
        eRecord.record.sState_into.value = '';
        // リストに追加
        eRecord.record.deviceList.value = createDLResult.data;
      }
      endLoad();
      kintone.app.record.set(eRecord);
    });
    return event;
  });

  kintone.events.on('app.record.create.submit',async function(event) {
    startLoad();
    if(event.record.deviceList.value.length!=0){
      // snumで更新するフィールドコードの指定
      let result_updateSnum = await updateSnum(event.record.deviceList.value);
      if(!result_updateSnum.result){
        endLoad();
        return event;
      }
    }
    endLoad();
    return event;
  });

  // 一時的
  kintone.events.on('app.record.edit.submit',async function(event) {
    startLoad();
    if(event.record.deviceList.value.length!=0){
      // snumで更新するフィールドコードの指定
      let result_updateSnum = await updateSnum(event.record.deviceList.value);
      if(!result_updateSnum.result){
        endLoad();
        return event;
      }
    }
    endLoad();
    return event;
  });

})();

function createDeviceList(eRecord){
  let snArray = (eRecord.record.sNums.value).split(/\r\n|\n/);
  for(const snums of snArray){
    // 空白文字か空の改行がある場合、エラー
    if(!snums || !snums.match(/\S/g)){
      alert('空白文字か空の改行が含まれています')
      return {result: false, error: {target: 'createDeviceList', code: 'createDeviceList_snumEmpty'}};
    }
  }

  let deviceList = eRecord.record.deviceList.value;
  for(const snums of snArray){
    let deviceJson = {
      value:{
        mName:{
          value: "",
          type: "SINGLE_LINE_TEXT"
        },
        nCode:{
          value: "",
          type: "SINGLE_LINE_TEXT"
        },
        sNumID:{
          value: "",
          type: "NUMBER"
        },
        sNum:{
          value: snums,
          lookup:true,
          type: "SINGLE_LINE_TEXT"
        },
        returnCheacker:{
          value: eRecord.record.returnCheacker_into.value,
          type: "SINGLE_LINE_TEXT"
        },
        returnDate:{
          value: eRecord.record.returnDate_into.value,
          type: "DATE"
        },
        sState:{
          value: eRecord.record.sState_into.value,
          type: "DROP_DOWN"
        }
      }
    }
    deviceList.push(deviceJson)
  }

  return {result: true, data: deviceList, error: {target: 'createDeviceList', code: 'createDeviceList_success'}};
}

// snumlist = snumとsNumIDを含むリスト
// updateArray = ["更新するフィールドコード",...]
async function updateSum(snumlist, updateArray){
  for(const list of snumlist){
    let updateJson = {
      app: sysid.DEV.app_id.sNum,
      id: list.value.sNumID.value,
      record:{}
    }
    for(const items of updateArray){
      updateJson.record[items] = {
        value:list.value[items].value
      }
    }
    // シリアル管理を更新
    let putResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateJson)
      .then(function (resp) {
        return {
          result: true,
          message: resp
        };
      }).catch(function (error) {
        return {
          result: false,
          message: error
        };
      });
    if(!putResult.result){
      return {result: false, error: {target: 'updateSum', code: 'updateSum_putError'}};
    }
    console.log(putResult);
  }

  return {result: true, error: {target: 'updateSum', code: 'updateSum_success'}};
}
async function updateSnum(tableValues){
  let putRecords = [];
  tableValues.forEach(list => {
    putRecords.push({
      id: list.value.sNumID.value,
      record: {
        sState: {value: list.value.sState.value},
        // Verifier: {value: list.value.sNumID.value},
        returnCheacker: {value: list.value.returnCheacker.value},
        returnDate: {value: list.value.returnDate.value}
      }
    })
  });
  if(putRecords.length > 0){
    let x = 0
    while(x < putRecords.length){
      let putBody_slice100 = {app:sysid.DEV.app_id.sNum, records:[]}
      if(x > putRecords.length-100){
        putBody_slice100.records = putRecords.slice(x, x + putRecords.length%100);
      }else{
        putBody_slice100.records = putRecords.slice(x, x + 100);
      }
      console.log(putBody_slice100);
      response_PUT.push(await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putBody_slice100));
      x += 100;
    }
  }
  console.log(putBody);
}