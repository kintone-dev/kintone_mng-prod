(function () {
  'use strict';
  //拠点情報取得＆繰り返し利用
  var getUNITdata = api_getRecords(sysid.INV.app_id.unit);

  //新規品目作成時アクション
  kintone.events.on('app.record.create.show', function (event) {
    startLoad();
    var getUniBody = {
      'app': sysid.INV.app_id.unit,
      'query': null
    };
    kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getUniBody)
      .then(function (resp) {
        var eRecord = kintone.app.record.get();
        //反転して格納
        var tarRecords = resp.records.reverse();
        //各拠点情報を当アプリの拠点リストに格納する
        //最初の空白の1行目を削除
        eRecord.record.uStockList.value.splice(0, 1);
        for (let i in tarRecords) {
          eRecord.record.uStockList.value.push({
            value: {
              uCode: {
                value: tarRecords[i].uCode.value,
                type: 'SINGLE_LINE_TEXT'
              },
              uName: {
                value: tarRecords[i].uName.value,
                type: 'SINGLE_LINE_TEXT'
              },
              uStock: {
                value: '',
                type: 'NUMBER'
              }
            }
          });
          eRecord.record.uStockList.value[i].value.uCode.disabled = true;
          eRecord.record.uStockList.value[i].value.uName.disabled = true;
          eRecord.record.uStockList.value[i].value.uStock.disabled = true;
          kintone.app.record.set(eRecord);
        }
        kintone.app.record.set(eRecord);
        endLoad();
      }).catch(function (error) {
        console.log(error);
        return error;
      });
      return event;
  });

  // 新規保存時アクション
  kintone.events.on('app.record.create.submit.success', async function (event) {
    startLoad();
    var getUniBody = {
      'app': sysid.INV.app_id.unit,
      'query': null
    };
    var uniRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getUniBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return error;
      });
    var tarRecords = uniRecord.records;
    // 拠点管理アプリの品目リストに上書きするデータ作成
    var NewPrdInfo = {
      'app': sysid.INV.app_id.unit,
      'records': []
    };
    for (let i in tarRecords) {
      var records_set = {
        'id': tarRecords[i].$id.value,
        'record': {
          'mStockList': tarRecords[i].mStockList
        }
      };
      var addRowData = {
        'value': {
          'mCode': event.record.mCode.value,
          'mName': event.record.mName.value
        }
      };
      records_set.record.mStockList.value.push(addRowData);
      NewPrdInfo.records.push(records_set);
    }
    var purNewPrdResult = await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', NewPrdInfo)
      .then(function (resp) {
        console.log('拠点管理に新規商品を追加');
        console.log(resp);
        return resp;
      }).catch(function (error) {
        console.log(error);
        return ['error', error];
      });
    if(purNewPrdResult[0]=='error'){
      event.error='拠点管理に新規商品を追加する際にエラーが発生しました';
      endLoad();
      return event;
    }

    /* 新規データ転送 */
    // 転送データ作成
    var postItemBody = {
      'app': '',
      'record': {
        'mName': event.record.mName,
        'mCode': event.record.mCode,
        'mNickname': event.record.mNickname,
        'mType': event.record.mType,
        'mVendor': event.record.mVendor,
        'mClassification': event.record.mClassification,
        'packageComp': event.record.packageComp,
        'endService': event.record.endService
      }
    };
    // 転送先指定
    var tarAPP = [
      sysid.PM.app_id.item,
      sysid.SUP.app_id.item,
      sysid.ASS.app_id.item
    ];
    // 品目マスターに転送実行
    for (let i in tarAPP) {
      postItemBody.app = tarAPP[i];
      await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', postItemBody)
        .then(function (resp) {
          //転送成功
          console.log('品目マスターに転送成功');
        });
    }

    endLoad();
    return event;
  });

  // 編集保存時アクション（現在編集不可）
  kintone.events.on('app.record.edit.submit.success', async function (event) {
    startLoad();
    var getUniBody = {
      'app': sysid.INV.app_id.unit,
      'query': null
    };
    var uniRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getUniBody)
      .then(function (resp) {
        return resp;
      }).catch(function (error) {
        console.log(error);
        return error;
      });

    var tarRecords = uniRecord.records;
    // 拠点管理アプリの品目リストに上書きするデータ作成
    var NewPrdInfo = {
      'app': sysid.INV.app_id.unit,
      'records': []
    };
    for (let i in tarRecords) {
      var records_set = {
        'id': tarRecords[i].$id.value,
        'record': {
          'mStockList': tarRecords[i].mStockList
        }
      };
      NewPrdInfo.records.push(records_set);
    }
    //編集した品目名を反映
    for (let i in NewPrdInfo.records) {
      for (let j in NewPrdInfo.records[i].record.mStockList.value) {
        if (NewPrdInfo.records[i].record.mStockList.value[j].value.mCode.value == event.record.mCode.value) {
          NewPrdInfo.records[i].record.mStockList.value[j].value.mName.value = event.record.mName.value;
        }
      }
    }
    await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', NewPrdInfo)
      .then(function (resp) {
        //転送成功
        console.log('拠点管理に新規商品を追加');
      });


    // api実行先指定
    var tarAPP = [
      sysid.PM.app_id.item,
      sysid.SUP.app_id.item,
      sysid.ASS.app_id.item
    ];
    /* api実行データ作成 */
    // 転送データ作成
    var putItemBody = {
      'app': '',
      'updateKey': {
        'field': 'mCode',
        'value': event.record.mCode.value
      },
      'record': {
        'mName': event.record.mName,
        'mNickname': event.record.mNickname,
        'mType': event.record.mType,
        'mVendor': event.record.mVendor,
        'mClassification': event.record.mClassification,
        'packageComp': event.record.packageComp,
        'endService': event.record.endService
      }
    };

    // api実行
    for (let i in tarAPP) {
      putItemBody.app = tarAPP[i];
      await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', putItemBody)
        .then(function (resp) {
          //転送成功
          console.log('品目マスターに転送成功');
        });
    }

    endLoad();
    return event;
  });

  //パッケージ一覧編集時
  kintone.events.on(['app.record.create.change.pc_mCode', 'app.record.edit.change.pc_mCode'], function (event) {
    startLoad();
    var deviceQuery = [];
    for (let i in event.record.packageComp.value) {
      deviceQuery.push('"' + event.record.packageComp.value[i].value.pc_mCode.value + '"');
    }
    var getPacBody = {
      'app': sysid.INV.app_id.device,
      'query': 'mCode in (' + deviceQuery.join() + ')'
    };
    kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getPacBody)
      .then(function (resp) {
        var eRecord = kintone.app.record.get();

        for (let i in eRecord.record.packageComp.value) {
          for (let j in resp.records) {
            if (eRecord.record.packageComp.value[i].value.pc_mCode.value == resp.records[j].mCode.value) {
              eRecord.record.packageComp.value[i].value.pc_mVendor.value = resp.records[j].mVendor.value;
              eRecord.record.packageComp.value[i].value.pc_mType.value = resp.records[j].mType.value;
              eRecord.record.packageComp.value[i].value.pc_mName.value = resp.records[j].mName.value;
              eRecord.record.packageComp.value[i].value.pc_mNickname.value = resp.records[j].mNickname.value;
            }
          }
        }

        for (let i in eRecord.record.packageComp.value) {
          eRecord.record.packageComp.value[i].value.pc_mVendor.disabled = true;
          eRecord.record.packageComp.value[i].value.pc_mType.disabled = true;
          eRecord.record.packageComp.value[i].value.pc_mName.disabled = true;
          eRecord.record.packageComp.value[i].value.pc_mNickname.disabled = true;
          eRecord.record.packageComp.value[i].value.pc_Num.disabled = false;
          eRecord.record.packageComp.value[i].value.pc_mCode.disabled = false;
        }

        kintone.app.record.set(eRecord);
        endLoad();
        return event;
      });
  });

})();