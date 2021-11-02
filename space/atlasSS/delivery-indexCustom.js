(function () {
  'use strict';

  kintone.events.on('app.record.index.show', function (event) {
    var del_records = setBtn_index('btn_del_records', 'KT-処理済みデータ削除');
    var sync_kintone = setBtn_index('btn_sync_kintone', 'KT-情報連携');

    //処理済みデータ削除
    $('#' + del_records.id).on('click', async function () {
      var deleteReqBody = {
        'app': kintone.app.getId(),
        'query': 'working_status in (\"登録完了\") and person_in_charge in (\"ATLAS Smart Security\")'
      };
      var deleteReqdata = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', deleteReqBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });

      function getNowDate() {
        return $.ajax({
          type: 'GET',
          async: false
        }).done(function (data, status, xhr) {
          return xhr;
        });
      }
      var currentDate = new Date(getNowDate().getResponseHeader('Date'));
      var deleteData = [];
      //90日以上経ったデータを配列に格納
      for(let i in deleteReqdata.records) {
        var createDate = new Date(deleteReqdata.records[i].更新日時.value);
        var dateComp = currentDate.getTime() - createDate.getTime();

        if (dateComp > 7776000 * 1000) {
          deleteData.push(deleteReqdata.records[i].$id.value)
        }
      }
      // 削除
      await deleteRecords(kintone.app.getId(), deleteData);

      return event;
    });

    //内部連携ボタンクリック時
    $('#' + sync_kintone.id).on('click', async function () {
      startLoad();
      /*①
        作業ステータス：準備中
        担当者：--------
        申込種別：新規申込

        会員情報に情報を更新
        AL専用を会員情報登録済に
      */
      var getNewMemBody = {
        'app': kintone.app.getId(),
        'query': 'working_status in ("準備中") and application_type in ("新規申込") and al_result = ""'
      };
      var newMemData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNewMemBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      console.log(newMemData);

      var newMemList = newMemData.records;
      //新規申込データ作成
      var postMemData = [];
      //新規申込作業ステータスデータ作成
      var putWStatNewData = [];
      //新規申込内容作成
      for(let i in newMemList) {
        var postBody_member = {
          'member_id': {
            'value': newMemList[i].member_id.value
          },
          'member_type': {
            'value': newMemList[i].member_type.value
          },
          'application_datetime': {
            'value': newMemList[i].application_datetime.value
          },
          'application_type': {
            'value': newMemList[i].application_type.value
          }
        };
        var putBody_workStatNew = {
          'id': newMemList[i].レコード番号.value,
          'record': {
            'al_result': {
              'value': '会員情報登録済'
            }
          }
        };
        postMemData.push(postBody_member);
        putWStatNewData.push(putBody_workStatNew);
      }

      await postRecords(sysid.ASS.app_id.member, postMemData)
        .then(function (resp) {
          console.log('新規申込情報連携に成功しました。');
          putRecords(kintone.app.getId(), putWStatNewData);
        }).catch(function (error) {
          console.log(error);
          alert('新規申込情報連携に失敗しました。システム管理者に連絡してください。');
        });

      /*②
        作業ステータス：TOASTCAM登録待ち＞＞集荷待ち(by Jay)
        担当者：Accel Lab
        申込種別：故障交換（保証期間内）、故障交換（保証期間外）

        ・故障品の情報を「検証待ち」、「故障品」に
        ・交換品の情報は出荷日、出荷用途以外は故障品からコピー
          出荷日、出荷用途は配送先リストから更新
      */
      var getReqBody = {
        'app': kintone.app.getId(),
        // 'query': 'working_status in ("TOASTCAM登録待ち") and person_in_charge in ("Accel Lab") and application_type in ("故障交換（保証対象）", "故障交換（保証対象外）")'
        'query': 'working_status in ("集荷待ち") and application_type in ("故障交換（保証対象）", "故障交換（保証対象外）")'
      };

      //取得した配送先リスト情報
      var DefRepData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReqBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });

      var shipList = DefRepData.records;
      //故障品データ作成
      var putDefData = [];
      //交換品データ作成
      var putRepData = [];
      //交換品query
      var getRepQueryArray = [];
      //api用変数
      var getRepBody = {
        'app': sysid.DEV.app_id.sNum,
        'query': ''
      };
      // sNum更新データ作成
      for (let ri in shipList) {
        //日時をTで区切る
        var dateCutter = shipList[ri].shipping_datetime.value.indexOf('T');
        var putDefBody_sNum = {
          'updateKey': {
            'field': 'sNum',
            'value': resp.records[ri].failure_sNum.value
          },
          'memId': resp.records[ri].member_id.value,
          'record': {
            'sState': {
              'value': '故障品'
            },
            'sDstate': {
              'value': '検証待ち'
            }
          }
        };
        var putRepBody_sNum = {
          'updateKey': {
            'field': 'sNum',
            'value': resp.records[ri].replacement_sNum.value
          },
          'defKey': resp.records[ri].failure_sNum.value,
          'appType': shipList[ri].application_type.value,
          'shipDate': shipList[ri].shipping_datetime.value.substring(0, dateCutter),
          'record': ''
        };
        getRepQueryArray.push('sNum = ');
        getRepQueryArray.push('"' + resp.records[ri].failure_sNum.value + '"');
        getRepQueryArray.push(' or ');
        putDefData.push(putDefBody_sNum);
        putRepData.push(putRepBody_sNum);
      }
      if (getRepQueryArray != []) {
        getRepQueryArray.pop();
      }
      var getDefQuery = getRepQueryArray.join('');
      getRepBody.query = getDefQuery;

      //故障品sNum情報を取得
      var repData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getRepBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      console.log(repData);

      var defRec = repData.records;
      //メンバーID比較
      for (let pdd in putDefData) {
        var defSnum = putDefData[pdd].updateKey.value;
        var defMemId = putDefData[pdd].memId;
        for (let ri in defRec) {
          if (defRec[ri].sNum.value == defSnum) {
            if (!defRec[ri].pkgid.value == defMemId) {
              putDefData.splice(pdd, 1);
            }
          }
        }
      }
      for (let pd in putDefData) {
        delete putDefData[pd].memId;
      }
      for (let prd in putRepData) {
        var defKey = putRepData[prd].defKey;
        for (let ri in defRec) {
          if (defKey == defRec[ri].sNum.value) {
            delete defRec[ri].$id;
            delete defRec[ri].$revision;
            delete defRec[ri].sDstate;
            delete defRec[ri].sState;
            delete defRec[ri].レコード番号;
            delete defRec[ri].作成日時;
            delete defRec[ri].作成者;
            delete defRec[ri].ステータス;
            delete defRec[ri].更新者;
            delete defRec[ri].更新日時;
            putRepData[prd].record = defRec[ri];
          }
        }
      }
      for (let rd in putRepData) {
        putRepData[rd].record.sendDate.value = putRepData[rd].shipDate;
        putRepData[rd].record.sendType.value = putRepData[rd].appType;
        delete putRepData[rd].defKey;
        delete putRepData[rd].appType;
        delete putRepData[rd].shipDate;
        delete putRepData[rd].record.sNum;
      }

      /*③
        作業ステータス：TOASTCAM登録待ち＞＞集荷待ち(by Jay)
        担当者：Accel Lab
        申込種別：故障交換（保証期間内）、故障交換（保証期間外）以外
        ・記入されたシリアル番号に配送先リストの情報を追加する
      */
      var getNotDefBody = {
        'app': kintone.app.getId(),
        //'query': 'working_status in ("TOASTCAM登録待ち") and person_in_charge in ("Accel Lab") and application_type not in ("故障交換（保証対象）", "故障交換（保証対象外）")'
        'query': 'working_status in ("集荷待ち") and application_type not in ("故障交換（保証対象）", "故障交換（保証対象外）")'
      };

      var notDefData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNotDefBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      console.log(notDefData);

      //故障交換ステータスデータ作成
      var putNotDefData = [];
      var notDefList = notDefData.records;
      for(let i in notDefList) {
        let sNums = sNumRecords(notDefList[i].deviceList.value, 'table');
        for(let y in sNums.SNs) {
          var dateCutter1 = notDefList[i].shipping_datetime.value.indexOf('T');
          var dateCutter2 = notDefList[i].application_datetime.value.indexOf('T');
          var putSnumBody = {
            'updateKey': {
              'field': 'sNum',
              'value': sNums.SNs[y]
            },
            'record': {
              'sendDate': {
                'value': notDefList[i].shipping_datetime.value.substring(0, dateCutter1)
              },
              'sendType': {
                'value': '検証待ち'
              },
              'shipment': {
                'value': '123倉庫'
              },
              'instName': {
                'value': '高井戸西2丁目'
              },
              'pkgid': {
                'value': notDefList[i].member_id.value
              },
              'startDate': {
                'value': notDefList[i].application_datetime.value.substring(0, dateCutter2)
              },
            }
          };
          for(let x in putNotDefData) {
            if (putNotDefData[x].updateKey.value == putSnumBody.updateKey.value) {
              putNotDefData.splice(psdl, 1);
            }
          }
          putNotDefData.push(putSnumBody);
        }
      }
      // ②、③情報連結
      var putSnumData = putRepData.concat(putDefData);
      putSnumData = putNotDefData.concat(putSnumData);
      console.log(putSnumData);
      // シリアル管理情報更新
      await putRecords(sysid.DEV.app_id.sNum, putSnumData)
        .then(function (resp) {
          console.log('シリアル番号情報連携に成功しました。');
        }).catch(function (error) {
          console.log(error);
          alert('シリアル番号情報連携に失敗しました。システム管理者に連絡してください。');
        });

      /*
        作業ステータス：出荷完了 or 着荷完了（コメントアウト）
        担当者：--------
        申込種別：新規申込、デバイス追加、故障交換（保証期間外）

        ・デバイスの個数分積送（ASS）の商品を増やし、titanの商品を減らす（在庫管理、商品管理）
        ・月次レポートの対応欄の出荷数、入荷数を変更
       */
      var getShipCompBody = {
        'app': kintone.app.getId(),
        'query': 'working_status in ("出荷完了") and application_type in ("新規申込", "デバイス追加","故障交換（保証対象外）")'
      };
      // var getShipCompBody = {
      //   'app': kintone.app.getId(),
      //   'query': 'working_status in ("着荷完了") and application_type in ("新規申込", "デバイス追加","故障交換（保証対象外）")'
      // };
      var shipCompData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getShipCompBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      console.log(shipCompData);
      //対象のレコード数分実行
      for(let i in shipCompData.records){
        await stockCtrl(shipCompData.records[i], kintone.app.getId());
        await reportCtrl(shipCompData.records[i], kintone.app.getId());
      }

      /*
        停止
        作業ステータス：着荷完了
        担当者：--------
        申込種別：新規申込

        ・着荷日から7日以上過ぎたものの個数分積送（ASS）から減らす
        ・月次レポートの対応欄の出荷数を変更
       */
      // var getArrCompNewBody = {
      //   'app': kintone.app.getId(),
      //   'query': 'working_status in ("着荷完了") and application_type in ("新規申込")'
      // };
      // var arrCompNewData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getArrCompNewBody)
      //   .then(function (resp) {
      //     return resp;
      //   }).catch(function (error) {
      //     return error;
      //   });
      // console.log(arrCompNewData);
      // //対象のレコード数分実行
      // for(let i in arrCompNewData.records){
      //   await stockCtrl(arrCompNewData.records[i], kintone.app.getId());
      //   await reportCtrl(arrCompNewData.records[i], kintone.app.getId());
      // }

      /*
        停止
        作業ステータス：着荷完了
        担当者：--------
        申込種別：デバイス追加、故障交換（保証期間外）

        ・デバイスの個数分積送（ASS）から減らす
        ・月次レポートの対応欄の出荷数を変更
       */
      // var getArrCompAddBody = {
      //   'app': kintone.app.getId(),
      //   'query': 'working_status in ("着荷完了") and application_type in ("デバイス追加","故障交換（保証対象外）")'
      // };
      // var arrCompAddData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getArrCompAddBody)
      //   .then(function (resp) {
      //     return resp;
      //   }).catch(function (error) {
      //     return error;
      //   });
      // console.log(arrCompAddData);
      // //対象のレコード数分実行
      // for(let i in arrCompAddData.records){
      //   await stockCtrl(arrCompAddData.records[i], kintone.app.getId());
      //   await reportCtrl(arrCompAddData.records[i], kintone.app.getId());
      // }

      /*
        作業ステータス：TOASTCAM登録待ち
        担当者：Accel Lab
        申込種別：--------
        BizID登録済み

        ・作業ステータスを必要情報入力済みに
      */
      var getBizIdCompBody = {
        'app': kintone.app.getId(),
        'query': 'working_status in ("TOASTCAM登録待ち") and person_in_charge in ("Accel Lab") and toastcam_bizUserId != ""'
      };
      var toastData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getBizIdCompBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          return error;
        });
      //故障交換ステータスデータ作成
      var putStatData = [];
      for(let i in toastData.records) {
        var putBody_workStat = {
          'id': toastData.records[i].レコード番号.value,
          'record': {
            'working_status': {
              'value': '必要情報入力済み'
            }
          }
        };
        putStatData.push(putBody_workStat);
      }
      await putRecords(kintone.app.getId(), putStatData);

      endLoad();

      return event;
    });

    return event;
  });
})();