(function () {
  'use strict';
  //新規拠点作成時アクション
  kintone.events.on('app.record.create.show', async function (event) {
    startLoad();
    var getDevBody = {
      'app': sysid.INV.app_id.device,
      'query': null
    };
    var getDevresult = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getDevBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return error;
      });

    var eRecord = kintone.app.record.get();
    //反転して格納
    var tarRecords = getDevresult.records.reverse();
    //各拠点情報を当アプリの拠点リストに格納する
    //最初の空白の1行目を削除
    eRecord.record.mStockList.value.splice(0, 1);
    for (let i in tarRecords) {
      eRecord.record.mStockList.value.push({ //unshift({
        value: {
          mCode: {
            value: tarRecords[i].mCode.value,
            type: 'SINGLE_LINE_TEXT'
          },
          mName: {
            value: tarRecords[i].mName.value,
            type: 'SINGLE_LINE_TEXT'
          },
          mStock: {
            value: '',
            type: 'NUMBER'
          }
        }
      });
      eRecord.record.mStockList.value[i].value.mCode.disabled = true;
      eRecord.record.mStockList.value[i].value.mName.disabled = true;
      eRecord.record.mStockList.value[i].value.mStock.disabled = true;
      kintone.app.record.set(event);
    }
    kintone.app.record.set(eRecord);

    endLoad();
    return event;
  });

  //新規保存時アクション
  kintone.events.on('app.record.create.submit.success', async function (event) {
    startLoad();
    var getDevBody = {
      'app': sysid.INV.app_id.device,
      'query': null
    };
    var devRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getDevBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return error;
      });
    var tarRecords = devRecord.records;
    //商品管理アプリの拠点リストに上書きするデータ作成
    var NewPrdInfo = {
      'app': sysid.INV.app_id.device,
      'records': []
    };
    for (let i in tarRecords) {
      var records_set = {
        'id': tarRecords[i].$id.value,
        'record': {
          'uStockList': tarRecords[i].uStockList
        }
      };
      var addRowData = {
        'value': {
          'uCode': event.record.uCode,
          'uName': event.record.uName
        }
      };
      records_set.record.uStockList.value.push(addRowData);
      NewPrdInfo.records.push(records_set);
    }
    await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', NewPrdInfo)
      .then(function (resp) {
        //転送成功
        console.log('商品管理に新規拠点を追加');
      });
    endLoad();
    return event;
  });

  //編集保存時アクション
  kintone.events.on('app.record.edit.submit.success', async function (event) {
    startLoad();
    var getDevBody = {
      'app': sysid.INV.app_id.device,
      'query': null
    };
    var devRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getDevBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return error;
      });
    var tarRecords = devRecord.records;
    //商品管理アプリの拠点リストに上書きするデータ作成
    var NewPrdInfo = {
      'app': sysid.INV.app_id.device,
      'records': []
    };
    //sud: set unit data
    for (let i in tarRecords) {
      var records_set = {
        'id': tarRecords[i].$id.value,
        'record': {
          'uStockList': tarRecords[i].uStockList
        }
      };
      NewPrdInfo.records.push(records_set);
    }
    //編集した拠点名を反映
    for (let i in NewPrdInfo.records) {
      for (let y in NewPrdInfo.records[i].record.uStockList.value) {
        if (NewPrdInfo.records[i].record.uStockList.value[y].value.uCode.value == event.record.uCode.value) {
          NewPrdInfo.records[i].record.uStockList.value[y].value.uName.value = event.record.uName.value;
        }
      }
    }
    await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', NewPrdInfo)
      .then(function (resp) {
        //転送成功
        console.log('商品管理の拠点リストを編集');
      });
    endLoad();
    return event;
  });

})();