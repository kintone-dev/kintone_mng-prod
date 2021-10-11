(function () {
  'use strict';

  // カーテンレールパーツの提供ベンダー
  const vendor = {
    'KRT-DY2000': '太陽パーツ', // レールアルミ
    'DS157-07D': 'DOOYA', // ラバーベルト
    'DS157-10': 'DOOYA', // ベルトクリップ
    'DS157-00B-00': 'DOOYA', // エンドボックス
    'DS157-04': 'DOOYA', // エンドフック
    'DS157A-00A-01': 'DOOYA', // エンドボックスカバー
    'DS157-22': 'DOOYA', // バンパー
    'DS157-09S': 'DOOYA', // マスターキャリア(S)
    'DS157-06A': 'DOOYA', // ランナー
    'DS157-08D': 'DOOYA', // 取り付け金具(D)
    'DS157-09G': 'DOOYA', // マスターキャリア(G)
    'DS157-23': 'DOOYA', // 連結金具
    'DS157-08': 'DOOYA', // 取り付け金具(none)
    'DS157-18': 'DOOYA', // L字金具(1トラック)
    'DS157-19': 'DOOYA' // L字金具(2トラック)
  };

  // 品名テーブル
  const partsName = {
    'KRT-DY2000': 'カーテンレール（DY）2000', // レールアルミ
    'DS157-07D': 'Rubber Belt', // ラバーベルト
    'DS157-10': 'Belt Clip', // ベルトクリップ
    'DS157-00B-00': 'End Box', // エンドボックス
    'DS157-04': 'End Hook', // エンドフック
    'DS157A-00A-01': 'End Box Cover', // エンドボックスカバー
    'DS157-22': 'Bumper', // バンパー
    'DS157-09S': 'Master Carrier', // マスターキャリア(S)
    'DS157-06A': 'Carriers', // ランナー
    'DS157-08D': 'Ceiling Bracket(D)', // 取り付け金具(D)
    'DS157-09G': 'Master Carrier(G)', // マスターキャリア(G)
    'DS157-23': 'Connecting Kit', // 連結金具
    'DS157-08': 'Ceiling Bracket', // 取り付け金具(none)
    'DS157-18': 'Wall Bracket Single Track', // L字金具(1トラック)
    'DS157-19': 'Wall Bracket Double Track' // L字金具(2トラック)
  }

  var stv = 0;
  var events = ['app.record.edit.change.deviceList',
    'app.redord.create.change.deviceList',
    'app.record.edit.change.mdevice',
    'app.record.edit.change.sNum',
    'app.record.edit.change.shipNum'
  ];
  kintone.events.on(events, function (event) {

    // カーテンレールパーツの数量を記憶させる
    var workInProcess = {
      'KRT-DY2000': 0, // レールアルミ
      'DS157-07D': 0, // ラバーベルト
      'DS157-10': 0, // ベルトクリップ
      'DS157-00B-00': 0, // エンドボックス
      'DS157-04': 0, // エンドフック
      'DS157A-00A-01': 0, // エンドボックスカバー
      'DS157-22': 0, // バンパー
      'DS157-09S': 0, // マスターキャリア(S)
      'DS157-06A': 0, // ランナー
      'DS157-08D': 0, // 取り付け金具(D)
      'DS157-09G': 0, // マスターキャリア(G)
      'DS157-23': 0, // 連結金具
      'DS157-08': 0, // 取り付け金具(none)
      'DS157-18': 0, // L字金具(1トラック)
      'DS157-19': 0 // L字金具(2トラック)
    };

    //debug
    console.log(event);

    /*
      event.record.deviceList.value.forEach( function(row, i) {
          if( row.value.mCode.value in workInProcess ){
            event.record.deviceList.value.splice(i, 1);
          }
      });
      // event.record.set({record: event.record});
    */

    while (stv < event.record.deviceList.value.length) {
      if (event.record.deviceList.value[stv].value.mCode.value == 'KRT-DY') {

        var lengthStr = '0';
        var openType = 'O';
        var mounterType = 'O';
        // 長さと開きの正規表現
        var specRegExp = new RegExp(/^[1-9][0-9]+[SW]$/);
        // 取付方法の正規表現
        var mounterRegExp = new RegExp(/壁|天井|ボックス/);
        // 依頼数
        var iLshipNum = parseInt(event.record.deviceList.value[stv].value.shipNum.value, 10);
        // 仕様をシリアル番号から読む
        var iLSpecs = (String(event.record.deviceList.value[stv].value.sNum.value)).split(/\r\n|\n/);

        for (var z = 0; z < iLSpecs.length; z++) {
          if (specRegExp.test(iLSpecs[z]) === true) {
            // 長さと開きを表す文字列が記載されている
            lengthStr = iLSpecs[z].substring(0, iLSpecs[z].length - 1);
            openType = iLSpecs[z].substring(iLSpecs[z].length - 1);
          } // endif
          if (mounterRegExp.test(iLSpecs[z]) === true) {
            if (iLSpecs[z].match('壁') === true) {
              // 壁付け
              mounterType = 'W';
            } else {
              // 天井またはボックスt付け
              mounterType = 'C';
            }
          }
        }

        // シリアル番号に必要なスペック情報がなかった
        if ((lengthStr === '0') || (openType === 'O') || (mounterType === 'O')) {
          // この商品ははスキップ。
          vent.record.deviceList.value[stv].value.sNum.error = 'カーテンレールの仕様が、シリアル項目に書ききれていません';
        } else {
          //-----------------------------------------------
          // 1本当たりのパーツ数を計算する
          //-----------------------------------------------
          // レール1本当たりのアルミトラックの長さを計算（140=エンドボックスの長さ）
          var railLength = parseInt(lengthStr, 10) - 140;
          // レール1本当たり、2mのレールを何本使うか計算
          var railCount = Math.floor(1 + (railLength / 2000));
          // レール1本当たり、取付金具の数を計算
          var mounterCount = Math.floor(2 + ((railLength - 190) / 500));
          // レール1本当たりのランナーの数
          var runnerCount = Math.floor((railLength + 62.5) / 125);
          //-----------------------------------------------
          // 依頼中のパーツ数を計算（1本当たり * 依頼数））
          //-----------------------------------------------
          // アルミトラック（２m）
          workInProcess['KRT-DY2000'] += railCount * iLshipNum;
          // 連結金具
          workInProcess['DS157-23'] += (railCount - 1) * iLshipNum;
          // ラバーベルト
          workInProcess['DS157-07D'] += (Math.floor(1 + ((railLength * 2 + 240) / 1000))) * iLshipNum;
          // エンドボックス
          workInProcess['DS157-00B-00'] += 2 * iLshipNum;
          // エンドボックスカバー
          workInProcess['DS157A-00A-01'] += iLshipNum;
          // バンパー
          workInProcess['DS157-22'] += 2 * iLshipNum;
          // ランナー
          workInProcess['DS157-06A'] += runnerCount * iLshipNum;
          if (openType == 'W') {
            //--------------------------------------
            // 両開き
            //--------------------------------------
            // ベルトクリップ
            workInProcess['DS157-10'] += 4 * iLshipNum;
            // エンドフック
            workInProcess['DS157-04'] += 2 * iLshipNum;
            if (railCount == 1) {
              // マスターキャリア
              workInProcess['DS157-09S'] += 2 * iLshipNum;
            } else {
              // マスターキャリア(連結レール)
              workInProcess['DS157-09G'] += 2 * iLshipNum;
            }
            if ((runnerCount % 2) == 1) {
              // 両開きなので、ランナーの数を偶数に調整
              workInProcess['DS157-06A'] += 1 * iLshipNum;
            }
          } else {
            //--------------------------------------
            // 方開き
            //--------------------------------------
            // ベルトクリップ
            workInProcess['DS157-10'] += 2 * iLshipNum;
            // エンドフック
            workInProcess['DS157-04'] += 1 * iLshipNum;
            if (railCount == 1) {
              // マスターキャリア
              workInProcess['DS157-09S'] += 1 * iLshipNum;
            } else {
              // マスターキャリア(連結レール)
              workInProcess['DS157-09G'] += 1 * iLshipNum;
            }
          }
          //-----------------------------------------------
          // 取付金具のパーツ数を計算（1本当たり * 依頼数））
          //-----------------------------------------------
          if (mounterType == 'C') {
            // 取付金具（天井）
            workInProcess['DS157-08D'] += mounterCount * iLshipNum;
          } else {
            // L字金具
            workInProcess['DS157-18'] += mounterCount * iLshipNum;
            // 取付金具(壁)
            workInProcess['DS157-08'] += mounterCount * iLshipNum;
          }
        }
        /*
                event.record.deviceList.value.push({
                  'value':{
                    //'mName':{'value':'Master Carrier(G)'},
                    mCode: {type: "SINGLE_LINE_TEXT", value: ""},
                    mName: {type: "SINGLE_LINE_TEXT", value: "Master Carrier(G)"},
                    mType: {type: "SINGLE_LINE_TEXT", value: ""},
                    mVendor: {type: "SINGLE_LINE_TEXT", value: ""},
                    sNum: {type: "MULTI_LINE_TEXT", value: ""},
                    shipRemarks: {type: "SINGLE_LINE_TEXT", value: ""},
                    shipNum: {type: "NUMBER", value: ""}
                  }
                });
                stv=event.record.deviceList.value.length-1;
                event.record.deviceList.value[stv].value.mName.lookup=true;
                break;
        */
      } // end-if
      stv++;
      console.log(workInProcess);
    } // end-while

    // debug
    for (let key in workInProcess) {
      if (workInProcess[key] > 0) {
        console.log('change: mCode=' + key + ', mName=' + partsName[key] + ', shipNum=' + workInProcess[key]);
      }
    }

    var j = event.record.deviceList.value.length - 1;
    for (let key in workInProcess) {
      if (workInProcess[key] > 0) {
        console.log('change: mCode=' + key + ', mName=' + partsName[key] + ', shipNum=' + workInProcess[key]);
        event.record.deviceList.value.push({
          'value': {
            mCode: {
              type: 'SINGLE_LINE_TEXT',
              value: key
            },
            mName: {
              type: 'SINGLE_LINE_TEXT',
              value: partsName[key]
            },
            mType: {
              type: 'SINGLE_LINE_TEXT',
              value: ''
            },
            mVendor: {
              type: 'SINGLE_LINE_TEXT',
              value: ''
            },
            sNum: {
              type: 'MULTI_LINE_TEXT',
              value: ''
            },
            shipRemarks: {
              type: 'SINGLE_LINE_TEXT',
              value: ''
            },
            shipNum: {
              type: 'NUMBER',
              value: workInProcess[key]
            }
          }
        });
        event.record.deviceList.value[j].value.mName.lookup = true;
        j++;
      } // end-if
    } // end-for
    console.log("コンソール確認");
    return event;
  });


  kintone.events.on('app.record.create.submit', function (event) {

    // debug
    console.log(event);

    // カーテンレールパーツの数量を記憶させる
    var workInProcess = {
      'KRT-DY2000': 0, // レールアルミ
      'DS157-07D': 0, // ラバーベルト
      'DS157-10': 0, // ベルトクリップ
      'DS157-00B-00': 0, // エンドボックス
      'DS157-04': 0, // エンドフック
      'DS157A-00A-01': 0, // エンドボックスカバー
      'DS157-22': 0, // バンパー
      'DS157-09S': 0, // マスターキャリア(S)
      'DS157-06A': 0, // ランナー
      'DS157-08D': 0, // 取り付け金具(D)
      'DS157-09G': 0, // マスターキャリア(G)
      'DS157-23': 0, // 連結金具
      'DS157-08': 0, // 取り付け金具(none)
      'DS157-18': 0, // L字金具(1トラック)
      'DS157-19': 0 // L字金具(2トラック)
    };

    //-------------------------------------------
    // 納品品目一覧(deviceList)のレコード取得
    //-------------------------------------------
    var itemList = event.record.deviceList.value;
    for (var iL = 0; iL < itemList.length; iL++) {
      // 品目コード
      var iLmCode = itemList[iL].value['mCode'].value;
      // 依頼数
      var iLshipNum = parseInt(itemList[iL].value['shipNum'].value, 10);
      // 仕様をシリアル番号から読む
      var iLSpec = itemList[iL].value['sNum'].value;
      var iLSpecs = (String(iLSpec)).split(/\r\n|\n/);

      var lengthStr = '0';
      var openType = 'O';
      var mounterType = 'O';

      if (iLmCode === 'KRT-DY') {
        // 長さと開きの正規表現
        var specRegExp = new RegExp(/^[1-9][0-9]+[SW]$/);
        // 取付方法の正規表現
        var mounterRegExp = new RegExp(/壁|天井|ボックス/);
        for (var z = 0; z < iLSpecs.length; z++) {
          if (specRegExp.test(iLSpecs[z]) === true) {
            // 長さと開きを表す文字列が記載されている
            lengthStr = iLSpecs[z].substring(0, iLSpecs[z].length - 1);
            openType = iLSpecs[z].substring(iLSpecs[z].length - 1);
          } // endif
          if (mounterRegExp.test(iLSpecs[z]) === true) {
            if (iLSpecs[z].match('壁') === true) {
              // 壁付け
              mounterType = 'W';
            } else {
              // 天井またはボックスt付け
              mounterType = 'C';
            }
          }
        }

        // シリアル番号に必要なスペック情報がなかった
        if ((lengthStr === '0') || (openType === 'O') || (mounterType === 'O')) {
          // この商品ははスキップ。本当はエラーにするべきか？
          itemList[iL].value['sNum'].error = 'カーテンレールの仕様が、シリアル項目に書ききれていません';
          return event;
        }

        //-----------------------------------------------
        // 1本当たりのパーツ数を計算する
        //-----------------------------------------------
        // レール1本当たりのアルミトラックの長さを計算（140=エンドボックスの長さ）
        var railLength = parseInt(lengthStr, 10) - 140;
        // レール1本当たり、2mのレールを何本使うか計算
        var railCount = Math.floor(1 + (railLength / 2000));
        // レール1本当たり、取付金具の数を計算
        var mounterCount = Math.floor(2 + ((railLength - 190) / 500));
        // レール1本当たりのランナーの数
        var runnerCount = Math.floor((railLength + 62.5) / 125);

        //-----------------------------------------------
        // 依頼中のパーツ数を計算（1本当たり * 依頼数））
        //-----------------------------------------------
        // アルミトラック（２m）
        workInProcess['KRT-DY2000'] += railCount * iLshipNum;
        // 連結金具
        workInProcess['DS157-23'] += (railCount - 1) * iLshipNum;
        // ラバーベルト
        workInProcess['DS157-07D'] += (Math.floor(1 + ((railLength * 2 + 240) / 1000))) * iLshipNum;
        // エンドボックス
        workInProcess['DS157-00B-00'] += 2 * iLshipNum;
        // エンドボックスカバー
        workInProcess['DS157A-00A-01'] += iLshipNum;
        // バンパー
        workInProcess['DS157-22'] += 2 * iLshipNum;
        // ランナー
        workInProcess['DS157-06A'] += runnerCount * iLshipNum;
        if (openType == 'W') {
          //--------------------------------------
          // 両開き
          //--------------------------------------
          // ベルトクリップ
          workInProcess['DS157-10'] += 4 * iLshipNum;
          // エンドフック
          workInProcess['DS157-04'] += 2 * iLshipNum;
          if (railCount == 1) {
            // マスターキャリア
            workInProcess['DS157-09S'] += 2 * iLshipNum;
          } else {
            // マスターキャリア(連結レール)
            workInProcess['DS157-09G'] += 2 * iLshipNum;
          }
          if ((runnerCount % 2) == 1) {
            // 両開きなので、ランナーの数を偶数に調整
            workInProcess['DS157-06A'] += 1 * iLshipNum;
          }
        } else {
          //--------------------------------------
          // 方開き
          //--------------------------------------
          // ベルトクリップ
          workInProcess['DS157-10'] += 2 * iLshipNum;
          // エンドフック
          workInProcess['DS157-04'] += 1 * iLshipNum;
          if (railCount == 1) {
            // マスターキャリア
            workInProcess['DS157-09S'] += 1 * iLshipNum;
          } else {
            // マスターキャリア(連結レール)
            workInProcess['DS157-09G'] += 1 * iLshipNum;
          }
        }

        //-----------------------------------------------
        // 取付金具のパーツ数を計算（1本当たり * 依頼数））
        //-----------------------------------------------
        if (mounterType == 'C') {
          // 取付金具（天井）
          workInProcess['DS157-08D'] += mounterCount * iLshipNum;
        } else {
          // L字金具
          workInProcess['DS157-18'] += mounterCount * iLshipNum;
          // 取付金具(壁)
          workInProcess['DS157-08'] += mounterCount * iLshipNum;
        }
        console.log(workInProcess);
      } // endif KRT-DY
    } // endfor

    // debug
    for (let key in workInProcess) {
      if (workInProcess[key] > 0) {
        console.log('create.submit: mCode=' + key + ', mName=' + partsName[key] + ', shipNum=' + workInProcess[key]);
      }
    }

    var stv = event.record.deviceList.value.length - 1;
    for (let key in workInProcess) {
      if (workInProcess[key] > 0) {
        event.record.deviceList.value.push({
          //console.log({
          'value': {
            'mCode': {
              'type': 'SINGLE_LINE_TEXT',
              'value': ''
            },
            'mName': {
              'type': 'SINGLE_LINE_TEXT',
              'value': partsName[key]
            },
            'mType': {
              'type': 'SINGLE_LINE_TEXT',
              'value': ''
            },
            'mVendor': {
              'type': 'SINGLE_LINE_TEXT',
              'value': ''
            },
            'sNum': {
              'type': 'MULTI_LINE_TEXT',
              'value': ''
            },
            'shipRemarks': {
              'type': 'SINGLE_LINE_TEXT',
              'value': ''
            },
            'shipNum': {
              'type': 'NUMBER',
              'value': workInProcess[key]
            }
          }
        });
        //event.record.deviceList.value[stv].value.mName.lookup=true;
      } // end-if
    } // end-for

    console.log("コンソール確認");
    return event;
  });
})();