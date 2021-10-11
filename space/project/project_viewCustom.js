(function () {
  'use strict';
  // 新規導入案件 案件番号自動採番
  kintone.events.on('app.record.create.show', function (event) {
    autoNum('PRJ_', 'prjNum');
    event.record.prjNum.disabled = true;
    setFieldShown('invoiceNum', false);
    setFieldShown('invoiceStatus', false);
    return event;
  });

  var prjNumValue = '';
  kintone.events.on('app.record.create.change.prjNum', function (event) {
    prjNumValue = event.record.prjNum.value;
    return event;
  });

  kintone.events.on('app.record.edit.change.invoiceNum', function (event) {
    if (event.record.invoiceNum.value === '' || event.record.invoiceNum.value === undefined) setFieldShown('invoiceStatus', false);
    else setFieldShown('invoiceStatus', true);
    return event;
  });

  kintone.events.on('app.record.detail.process.proceed', function (event) {
    var nStatus = event.nextStatus.value;
    if (nStatus == '入力内容確認中') {
      return kintone.api(kintone.api.url('/v1/user/groups', true), 'GET', {
        code: kintone.getLoginUser().code
      }).then(function (resp) {
        if (event.record.purchaseOrder.value.length < 1) {
          var inGroup = false;
          for (var i in resp.groups) {
            if (resp.groups[i].name == '営業責任者' || resp.groups[i].name == 'sysAdmin') {
              inGroup = true;
              break;
            }
          }
          if (inGroup) {
            var isConfirm = window.confirm('注文書なしで納品を先行してもよろしいですか?');
            if (!isConfirm) {
              event.error = '請求書を添付するか営業責任者に承認を求めてください！';
            }
          } else {
            event.error = '請求書を添付するか営業責任者に承認を求めてください！';
          }
        }
        return event;
      });
    }
    return event;
  });
  kintone.events.on(['app.record.edit.show', 'app.record.detail.show'], function (event) {

    if (event.record.ステータス.value == '納品準備中') {
      var types = ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'SUBTABLE', 'RICH_TEXT', 'NUMBER', 'DATE', 'DATETIME', 'TIME', 'DROP_DOWN', 'RADIO_BUTTON', 'CHECK_BOX', 'MULTI_SELECT', 'USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT', 'LINK', 'FILE'];
      var arr = Object.keys(event.record);
      arr.forEach(function (fcode) {
        if (types.indexOf(event.record[fcode].type) >= 0) {
          event.record[fcode].disabled = true;
        }
      });
      for (var i in event.record.deviceList.value) {
        event.record.deviceList.value[i].value.mNickname.disabled = true;
        event.record.deviceList.value[i].value.shipNum.disabled = true;
        event.record.deviceList.value[i].value.subBtn.disabled = true;
        event.record.deviceList.value[i].value.shipRemarks.disabled = true;
      }
      event.record.sys_invoiceDate.disabled = false;
      event.record.invoiceNum.disabled = false;
      event.record.invoiceStatus.disabled = false;
    }
    return event;
  });


  kintone.events.on(['app.record.create.show', 'app.record.detail.show', 'app.record.edit.show'], function (event) {
    setFieldShown('mVendor', false);
    setFieldShown('mName', false);
    event.record.cSales.disabled = false;
    setFieldShown('sys_suptitle', true);
    if (event.record.invoiceNum.value === '' || event.record.invoiceNum.value === undefined) setFieldShown('invoiceStatus', false);
    else setFieldShown('invoiceStatus', true);
    // タブ表示切り替え
    function tabSwitch(onSelect) {
      switch (onSelect) {
        case '#案件情報':
          setFieldShown('prjNum', true);
          setFieldShown('Exist_Project', true);
          setFieldShown('salesType', true);
          setFieldShown('predictDate', true);
          setFieldShown('purchaseOrder', true);
          setFieldShown('purchaseOrder_status', true);
          setFieldShown('prjMemo', true);
          if (event.record.Exist_Project.value.length > 0) {
            setFieldShown('samePRJ', true);
          } else {
            setFieldShown('samePRJ', false);
          }

          setFieldShown('cName', true);
          setFieldShown('orgName', true);
          setFieldShown('instName', true);
          setFieldShown('Contractor', true);
          if (event.record.instName.value == '' || event.record.instName.value == undefined) {
            setSpaceShown('btn_newINST', 'individual', 'inline-block');
            setSpaceShown('btn_unknowINST', 'individual', 'inline-block');
          } else {
            setSpaceShown('btn_newINST', 'individual', 'none');
            setSpaceShown('btn_unknowINST', 'individual', 'none');
          }

          setFieldShown('cSales', true);
          setFieldShown('instStatus', true);
          setFieldShown('instDate', true);
          setFieldShown('instDDday', true);

          setSpaceShown('calBtn', 'line', 'none');
          setFieldShown('tarDate', false);
          setFieldShown('aboutDelivery', false);
          setFieldShown('deviceList', false);

          setFieldShown('dstSelection', false);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('buildingName', false);
          setFieldShown('corpName', false);

          setFieldShown('deliveryCorp', false);
          setFieldShown('trckNum', false);
          setFieldShown('sendDate', false);
          setFieldShown('expArrivalDate', false);
          break;
        case '#宛先情報':
          setFieldShown('prjNum', false);
          setFieldShown('Exist_Project', false);
          setFieldShown('salesType', false);
          setFieldShown('predictDate', false);
          setFieldShown('purchaseOrder', false);
          setFieldShown('purchaseOrder_status', false);
          setFieldShown('prjMemo', false);
          setFieldShown('samePRJ', false);

          setFieldShown('cName', false);
          setFieldShown('orgName', false);
          setFieldShown('instName', false);
          setSpaceShown('btn_newINST', 'individual', 'none');
          setSpaceShown('btn_unknowINST', 'individual', 'none');
          setFieldShown('cSales', false);
          setFieldShown('instStatus', false);
          setFieldShown('instDate', false);
          setFieldShown('instDDday', false);
          setFieldShown('Contractor', false);

          setSpaceShown('calBtn', 'line', 'none');
          setFieldShown('tarDate', false);
          setFieldShown('aboutDelivery', false);
          setFieldShown('deviceList', false);

          setFieldShown('dstSelection', true);
          setFieldShown('receiver', true);
          setFieldShown('phoneNum', true);
          setFieldShown('zipcode', true);
          setFieldShown('prefectures', true);
          setFieldShown('city', true);
          setFieldShown('address', true);
          setFieldShown('buildingName', true);
          setFieldShown('corpName', true);

          setFieldShown('deliveryCorp', false);
          setFieldShown('trckNum', false);
          setFieldShown('sendDate', false);
          setFieldShown('expArrivalDate', false);
          break;
        case '#納品明細':
          setFieldShown('prjNum', false);
          setFieldShown('Exist_Project', false);
          setFieldShown('salesType', false);
          setFieldShown('predictDate', false);
          setFieldShown('purchaseOrder', false);
          setFieldShown('purchaseOrder_status', false);
          setFieldShown('prjMemo', false);
          setFieldShown('samePRJ', false);

          setFieldShown('cName', false);
          setFieldShown('orgName', false);
          setFieldShown('instName', false);
          setSpaceShown('btn_newINST', 'individual', 'none');
          setSpaceShown('btn_unknowINST', 'individual', 'none');
          setFieldShown('cSales', false);
          setFieldShown('instStatus', false);
          setFieldShown('instDate', false);
          setFieldShown('instDDday', false);
          setFieldShown('Contractor', false);

          setSpaceShown('calBtn', 'line', 'block');
          setFieldShown('tarDate', true);
          setFieldShown('aboutDelivery', true);
          setFieldShown('deviceList', true);

          setFieldShown('dstSelection', false);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('buildingName', false);
          setFieldShown('corpName', false);

          setFieldShown('deliveryCorp', false);
          setFieldShown('trckNum', false);
          setFieldShown('sendDate', false);
          setFieldShown('expArrivalDate', false);
          break;
        case '#輸送情報':
          setFieldShown('prjNum', false);
          setFieldShown('Exist_Project', false);
          setFieldShown('salesType', false);
          setFieldShown('predictDate', false);
          setFieldShown('purchaseOrder', false);
          setFieldShown('purchaseOrder_status', false);
          setFieldShown('prjMemo', false);
          setFieldShown('samePRJ', false);

          setFieldShown('cName', false);
          setFieldShown('orgName', false);
          setFieldShown('instName', false);
          setSpaceShown('btn_newINST', 'individual', 'none');
          setSpaceShown('btn_unknowINST', 'individual', 'none');
          setFieldShown('cSales', false);
          setFieldShown('instStatus', false);
          setFieldShown('instDate', false);
          setFieldShown('instDDday', false);
          setFieldShown('Contractor', false);

          setSpaceShown('calBtn', 'line', 'none');
          setFieldShown('tarDate', true);
          setFieldShown('aboutDelivery', false);
          setFieldShown('deviceList', false);

          setFieldShown('dstSelection', false);
          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('buildingName', false);
          setFieldShown('corpName', false);

          setFieldShown('deliveryCorp', true);
          setFieldShown('trckNum', true);
          setFieldShown('sendDate', true);
          setFieldShown('expArrivalDate', true);
          break;
      }
    }
    tabSwitch('#案件情報');
    //タブメニュー作成
    tabMenu('tab_project', ['案件情報', '宛先情報', '納品明細', '輸送情報']);
    //タブ切り替え表示設定
    $('.tab_project a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      return false; //aタグを無効にする
    });
    var newINST = setBtn('btn_newINST', '新規設置先');
    $('#' + newINST.id).on('click', function () {
      // createNewREC(sysid.PM.app_id.installation, ['prjNum', 'btn_newORG_shown'], [prjNumValue, 'none']);
      createNewREC(sysid.PM.app_id.installation, ['prjNum', 'unknowINST', 'setShown'], [prjNumValue, '', '']);
    });

    var unknowINST = setBtn('btn_unknowINST', '新規不特定設置先');
    $('#' + unknowINST.id).on('click', function () {
      createNewREC(sysid.PM.app_id.installation, ['prjNum', 'unknowINST', 'setShown'], [prjNumValue, '不特定設置先', 'disable']);
    });
  });

  kintone.events.on(['app.record.edit.change.sys_instAddress', 'app.record.create.change.sys_instAddress'], function (event) {
    if (event.record.instName.value == '' || event.record.instName.value == undefined) {
      setSpaceShown('btn_newINST', 'individual', 'inline-block');
      setSpaceShown('btn_unknowINST', 'individual', 'inline-block');
      console.log('no');
    } else {
      setSpaceShown('btn_newINST', 'individual', 'none');
      setSpaceShown('btn_unknowINST', 'individual', 'none');
      console.log('ok');
    }

    return event;
  });

  kintone.events.on(['app.record.index.edit.show', 'app.record.edit.show'], function (event) {
    // 新規作成以外、案件管理番号編集と既存案件切り替え不可
    event.record.prjNum.disabled = true;
    event.record.Exist_Project.disabled = true;

    return event;
  });

  // 新・既存案件表示切り替え
  kintone.events.on(['app.record.create.change.Exist_Project', 'app.record.edit.change.Exist_Project'], function (event) {
    if (event.record.Exist_Project.value == '既存案件') {
      setFieldShown('samePRJ', true);
      event.record.prjNum.value = "";
      event.record.prjNum.disabled = false;
    } else {
      setFieldShown('samePRJ', false);
      autoNum('PRJ_', 'prjNum');
      event.record.prjNum.disabled = true;
    }
    return event;
  });

  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection', 'app.record.create.change.sys_instAddress', 'app.record.edit.change.sys_instAddress', 'app.record.create.change.sys_unitAddress', 'app.record.edit.change.sys_unitAddress'], function (event) {
    do_dstSelection(event.record);

    return event;
  });

  /*
    kintone.events.on('app.record.detail.process.proceed', function (event) {
      var nStatus = event.nextStatus.value;
      if (nStatus == '納品手配済') {
        var queryBody = {
          'app': sysID.DIPM.app.ship,
          'query': 'prjNum="' + event.record.prjNum.value + '" and ステータス in ("納品情報未確定")',
          'fields': ['prjNum', '$id', 'ステータス', 'shipType']
        };

        kintone.api(kintone.api.url('/k/v1/records', true), 'GET', queryBody).then(function (getResp) {
          //「確認中」の「用途」がある場合、「用途」を更新するBody作成
          var update_shipType = {
            'app': sysID.DIPM.app.ship,
            'records': []
          };
          //Statusの更新用Body作成
          var update_Status = {
            'app': sysID.DIPM.app.ship,
            'records': []
          };

          for (var i in getResp.records) {
            //「確認中」の「用途」がある場合、update_shipTypeのrecordsに追加
            if (getResp.records[i].shipType.value == '確認中') {
              update_shipType.records.push({
                'id': getResp.records[i].$id.value,
                'record': {
                  'shipType': {
                    'value': event.record.shipType.value
                  }
                }
              });
            }
            update_Status.records.push({
              'id': getResp.records[i].$id.value,
              'action': '処理開始',
              //'assignee': 'kintone_mng@accel-lab.com'
            });
          }
          if (update_shipType.records.length > 0) kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', update_shipType); //.then(function(resp){console.log(resp)}).catch(function(error){console.log(error)});
          kintone.api(kintone.api.url('/k/v1/records/status', true), 'PUT', update_Status); //.then(function(resp){console.log(resp)}).catch(function(error){console.log(error)});

        }).catch(function (error) {
          console.log(error);
          console.log(error.message);
        });

        var putBody = {

        };
      }
      return event;
    });
  */

  function do_dstSelection(eRecords) {
    var selection = eRecords.dstSelection.value;
    if (selection == '施工業者/拠点へ納品') {
      eRecords.receiver.disabled = true;
      eRecords.phoneNum.disabled = true;
      eRecords.zipcode.disabled = true;
      eRecords.prefectures.disabled = true;
      eRecords.city.disabled = true;
      eRecords.address.disabled = true;
      eRecords.buildingName.disabled = true;
      eRecords.corpName.disabled = true;
      if (eRecords.sys_unitAddress.value !== undefined) {
        var unitAddress = eRecords.sys_unitAddress.value.split(',');
        eRecords.receiver.value = unitAddress[0];
        eRecords.phoneNum.value = unitAddress[1];
        eRecords.zipcode.value = unitAddress[2];
        eRecords.prefectures.value = unitAddress[3];
        eRecords.city.value = unitAddress[4];
        eRecords.address.value = unitAddress[5];
        eRecords.buildingName.value = unitAddress[6];
        eRecords.corpName.value = unitAddress[7];
      }
    } else if (selection == '設置先と同じ') {
      eRecords.receiver.disabled = false;
      eRecords.phoneNum.disabled = false;
      eRecords.zipcode.disabled = false;
      eRecords.prefectures.disabled = false;
      eRecords.city.disabled = false;
      eRecords.address.disabled = false;
      eRecords.buildingName.disabled = false;
      eRecords.corpName.disabled = false;
      if (eRecords.sys_instAddress.value !== undefined) {
        var instAddress = eRecords.sys_instAddress.value.split(',');
        eRecords.receiver.value = instAddress[0];
        eRecords.phoneNum.value = instAddress[1];
        eRecords.zipcode.value = instAddress[2];
        eRecords.prefectures.value = instAddress[3];
        eRecords.city.value = instAddress[4];
        eRecords.address.value = instAddress[5];
        eRecords.buildingName.value = instAddress[6];
        eRecords.corpName.value = instAddress[7];
      }
    } else if (selection == '担当手渡し') {
      eRecords.receiver.disabled = false;
      eRecords.phoneNum.disabled = false;
      eRecords.zipcode.disabled = true;
      eRecords.prefectures.disabled = true;
      eRecords.city.disabled = true;
      eRecords.address.disabled = true;
      eRecords.buildingName.disabled = true;
      eRecords.corpName.disabled = true;
      eRecords.zipcode.value = '';
      eRecords.prefectures.value = '';
      eRecords.city.value = '';
      eRecords.address.value = '';
      eRecords.buildingName.value = '';
      eRecords.corpName.value = '';
    } else {
      eRecords.receiver.disabled = false;
      eRecords.phoneNum.disabled = false;
      eRecords.zipcode.disabled = false;
      eRecords.prefectures.disabled = false;
      eRecords.city.disabled = false;
      eRecords.address.disabled = false;
      eRecords.buildingName.disabled = false;
      eRecords.corpName.disabled = false;
    }
  }

  //検索窓設置
  kintone.events.on('app.record.index.show', function (event) {
    setEasySearch(prjSerchJson);
    return event;
  });

  // 計算ボタン
  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    setBtn('calBtn', '計算');
    $('#calBtn').on('click', function () {
      calBtnFunc(kintone.app.record.get(), kintone.app.getId());
    });
    return event;
  });

  // カーテンレールが選択された場合、シリアル番号欄にデータを記入
  kintone.events.on(['app.record.edit.change.mCode', 'app.record.create.change.mCode'], function (event) {
    for (var i in event.record.deviceList.value) {
      if (!String(event.record.deviceList.value[i].value.shipRemarks.value).match(/PAC/)) {
        var mCodeValue = event.record.deviceList.value[i].value.mCode.value;
        if (mCodeValue === undefined) event.record.deviceList.value[i].value.shipRemarks.value = '';
        else if (mCodeValue == 'KRT-DY') event.record.deviceList.value[i].value.shipRemarks.value = 'WFP\nカーテンレール全長(mm)：\n開き勝手：(S)片開き/(W)両開き\n取り付け方法：天井/壁付S/壁付W';
        else if (mCodeValue.match(/pkg_/)) event.record.deviceList.value[i].value.shipRemarks.value = 'WFP';
        else if (mCodeValue.match(/ZSL10/)) event.record.deviceList.value[i].value.shipRemarks.value = 'WFP';
      }
    }
    return event;
  });

  //wfpチェック,添付書類チェック
  kintone.events.on('app.record.detail.show', async function (event) {
    if (sessionStorage.getItem('record_updated') === '1') {
      sessionStorage.setItem('record_updated', '0');
      return event;
    }
    var putData = [];
    var putBody = {
      'id': event.record.$id.value,
      'record': {}
    };

    if (event.record.deviceList.value.some(item => item.value.shipRemarks.value.match(/WFP/))) {
      putBody.record.sys_isReady = {
        'value':'false'
      }
    } else {
      putBody.record.sys_isReady = {
        'value':'true'
      }
    }

    if(event.record.purchaseOrder.value.length >= 1){
      putBody.record.sys_purchaseOrder = {
        'value':['POI']
      }
    }else{
      putBody.record.sys_purchaseOrder = {
        'value':[]
      }
    }

    putData.push(putBody);
    putRecords(kintone.app.getId(), putData);
    sessionStorage.setItem('record_updated', '1');
    location.reload();

    //サーバー時間取得
    function getNowDate() {
      return $.ajax({
        type: 'GET',
        async: false
      }).done(function (data, status, xhr) {
        return xhr;
      });
    }
    var currentDate = new Date(getNowDate().getResponseHeader('Date'));
    var nowDateFormat = String(currentDate.getFullYear()) + String(("0" + (currentDate.getMonth() + 1)).slice(-2));
    if (parseInt(nowDateFormat) > parseInt(event.record.sys_invoiceDate.value)) {
      alert('昔の請求書です。');
      return event;
    }
    return event;
  });

})();