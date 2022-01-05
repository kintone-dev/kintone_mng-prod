(function () {
  'use strict';
  var prjNumValue = '';
  kintone.events.on('app.record.create.show', function (event) {
    // event.record.prjNum.disabled = true;
    //コピー元の「prjNum」の値をsessionStorageの値を代入
    // event.record.prjNum.value = sessionStorage.getItem('prjNum');
    // event.record.shipType.value = sessionStorage.getItem('shipType');
    // event.record.tarDate.value = sessionStorage.getItem('tarDate');
    // event.record.instName.value = sessionStorage.getItem('instName');
    // event.record.instName.lookup = true;
    console.log(sessionStorage.getItem('is_copy_prjdata'));
    // データ複製ボタン受取
    var runPAN=true;
    if(sessionStorage.getItem('is_copy_prjdata')){
      let ssRecord=JSON.parse(sessionStorage.getItem('copy_prjdata'));
      event.record=ssRecord;
      if(ssRecord.prjNum.value!==''){
        prjNumValue=ssRecord.prjNum.value;
        runPAN=false;
      }
      sessionStorage.removeItem('is_copy_prjdata');
    }
     

    //キャンセルした時の処理
    var cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
    cancel_btn[0].addEventListener('click', function () {
      window.close();
    }, false);
    //反映したあとはsessionStorageの中身を削除
    sessionStorage.removeItem('prjNum');
    sessionStorage.removeItem('shipType');
    sessionStorage.removeItem('tarDate');
    sessionStorage.removeItem('instName');
    sessionStorage.removeItem('copy_shipdata');


    setFieldShown('invoiceStatus', false);
    // 新規導入案件 案件番号自動採番
    if(runPAN){
      autoNum('PRJ_', 'prjNum');
    }
    setFieldShown('invoiceNum', false);
    setFieldShown('invoiceStatus', false);
    return event;
  });


  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection'], function (event) {
    if (event.record.dstSelection.value == '担当手渡し') {
      event.record.receiver.value = event.record.cSales.value;
    } else {
      event.record.receiver.value = '';
    }
    return event;
  });

  kintone.events.on(['app.record.create.change.salesType', 'app.record.edit.change.salesType'], function (event) {
    if (event.record.salesType.value == '貸与') {
      setFieldShown('returnDate', true);
      setFieldShown('returnCompDate', true);
    } else{
      setFieldShown('returnDate', false);
      setFieldShown('returnCompDate', false);
    }
    return event;
  });

  kintone.events.on(['app.record.edit.change.invoiceNum', 'app.record.create.change.invoiceNum'], function (event) {
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
          for (let i in resp.groups) {
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

        var confTxt = '';
        for (let i in confirmSetting) {
          confTxt = confTxt + confirmSetting[i].fName + '：' + event.record[confirmSetting[i].fCode].value + '\n';
        }
        if (confirm(confTxt)) {
          return event;
        } else {
          return false;
        }
      });
    }
    return event;
  });

  kintone.events.on(['app.record.edit.change.deviceList','app.record.create.change.deviceList'], function(event){
    for (let i in event.record.deviceList.value) {
      event.record.deviceList.value[i].value.shipRemarks.disabled = true;
    }
    return event;
  });
  kintone.events.on(['app.record.edit.show', 'app.record.detail.show'], function (event) {
    if (event.record.invoiceNum.value === '' || event.record.invoiceNum.value === undefined) setFieldShown('invoiceStatus', false);
    else setFieldShown('invoiceStatus', true);
    for (let i in event.record.deviceList.value) {
      event.record.deviceList.value[i].value.shipRemarks.disabled = true;
    }
    if (event.record.ステータス.value == '納品準備中') {
      var types = ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'SUBTABLE', 'RICH_TEXT', 'NUMBER', 'DATE', 'DATETIME', 'TIME', 'DROP_DOWN', 'RADIO_BUTTON', 'CHECK_BOX', 'MULTI_SELECT', 'USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT', 'LINK', 'FILE'];
      var arr = Object.keys(event.record);
      arr.forEach(function (fcode) {
        if (types.indexOf(event.record[fcode].type) >= 0) {
          event.record[fcode].disabled = true;
        }
      });
      for (let i in event.record.deviceList.value) {
        event.record.deviceList.value[i].value.mNickname.disabled = true;
        event.record.deviceList.value[i].value.shipNum.disabled = true;
        event.record.deviceList.value[i].value.subBtn.disabled = true;
        // event.record.deviceList.value[i].value.shipRemarks.disabled = true;
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
    // setFieldShown('shipRemarks', false);
    // console.log(event.record.invoiceNum);
    
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

          if (event.record.salesType.value == '貸与') {
            setFieldShown('returnDate', true);
            setFieldShown('returnCompDate', true);
          } else{
            setFieldShown('returnDate', false);
            setFieldShown('returnCompDate', false);
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
          setFieldShown('returnDate', false);
          setFieldShown('returnCompDate', false);

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
          setFieldShown('returnDate', false);
          setFieldShown('returnCompDate', false);

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
          setFieldShown('returnDate', false);
          setFieldShown('returnCompDate', false);

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
    //タブメニュー作成
    tabMenu('tab_project', ['案件情報', '宛先情報', '納品明細', '輸送情報']);
    if (sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'));
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
    } else {
      tabSwitch('#案件情報');
    }
    //タブ切り替え表示設定
    $('.tab_project a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false; //aタグを無効にする
    });
    var newINST = setBtn('btn_newINST', '新規設置先');
    $('#' + newINST.id).on('click', function () {
      // createNewREC(sysid.PM.app_id.installation, ['prjNum', 'btn_newORG_shown'], [prjNumValue, 'none']);
      createNewREC(sysid.PM.app_id.installation, ['prjNum', 'unknowINST', 'setShown'], [prjNumValue, '', '']);
    });

    var unknowINST = setBtn('btn_unknowINST', '新規不特定設置先');
    $('#' + unknowINST.id).on('click', function () {
      kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        'app': sysid.PM.app_id.installation,
        'query':'limit 1'
      }).then(function(resp){
        let unknowINSTnum=Number(resp.records[0].$id.value);
        createNewREC(sysid.PM.app_id.installation, ['prjNum', 'unknowINST', 'setShown'], [prjNumValue, '不特定設置先'+unknowINSTnum, 'disable']);
      });
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

  kintone.events.on(['app.record.index.edit.show', 'app.record.create.show', 'app.record.edit.show'], function (event) {
    // 新規作成以外、案件管理番号編集と既存案件切り替え不可
    event.record.prjNum.disabled = true;
    event.record.Exist_Project.disabled = true;

    return event;
  });


  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection', 'app.record.create.change.sys_instAddress', 'app.record.edit.change.sys_instAddress', 'app.record.create.change.sys_unitAddress', 'app.record.edit.change.sys_unitAddress'], function (event) {
    do_dstSelection(event.record);

    return event;
  });

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
    setSearch(prjSerchJson);
    return event;
  });

  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    // 計算ボタン
    setBtn('calBtn', '計算');
    $('#calBtn').on('click', function () {
      calBtnFunc(kintone.app.record.get(), kintone.app.getId());
    });
    event.record.Exist_Project.disabled=true;
    return event;
  });

  // カーテンレールが選択された場合、シリアル番号欄にデータを記入
  kintone.events.on(['app.record.edit.change.mCode', 'app.record.create.change.mCode'], function (event) {
    for (let i in event.record.deviceList.value) {
      if (!String(event.record.deviceList.value[i].value.shipRemarks.value).match(/PAC/)) {
        var mCodeValue = event.record.deviceList.value[i].value.mCode.value;
        if (mCodeValue === undefined) {
          event.record.deviceList.value[i].value.shipRemarks.value = '';
        } else if (mCodeValue == 'KRT-DY') {
          krtSetting();
          $('#krtSetBtn').on('click', function () {
            var eRecord = kintone.app.record.get();
            let krtLength = $('.length').val();
            let krtOpenType = $('input[name=openType]:checked').val();
            let krtOpenDetail = $("select[name='openDetail']").val();
            let krtMethodType = $('input[name=methodType]:checked').val();
            eRecord.record.deviceList.value[i].value.shipRemarks.value = `WFP\nカーテンレール全長(mm)：${krtLength}\n開き勝手：${krtOpenType}\n開き方向：${krtOpenDetail}\n取り付け方法：${krtMethodType}`;
            kintone.app.record.set(eRecord);
            $('#mwFrame').fadeOut(1000, function () {
              $('#mwFrame').remove();
            });
          });
        } else if (mCodeValue.match(/pkg_/)) {
          event.record.deviceList.value[i].value.shipRemarks.value = 'WFP';
        } else if (mCodeValue.match(/ZSL10/)) {
          event.record.deviceList.value[i].value.shipRemarks.value = 'WFP';
        }
      }
    }
    return event;
  });

  //wfpチェック,添付書類チェック
  kintone.events.on('app.record.detail.show', async function (event) {
    // 新規レコード作成画面を開き、既存のレコードをコピーする
    setBtn_header('copy_shipdata', 'データ複製');
    $('#copy_shipdata').on('click', function () {
      kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {'app': kintone.app.getId(),'id': kintone.app.record.getId()}).then(function(resp){
        // let newRecord=resp.record;
        // delete newRecord.$id;
        // delete newRecord.$revision;
        // delete newRecord.ステータス;
        // delete newRecord.レコード番号;
        // delete newRecord.作成日時;
        // delete newRecord.作成者;
        // delete newRecord.作業者;
        // delete newRecord.更新日時;
        // delete newRecord.更新者;

        var newRecord={};
        
        // 複製項目選択
        let mw=mWindow();
        let copySelection=[
          {'id':'selt_address', 'name':'selt_address', 'value':'宛先情報'},
          {'id':'selt_device', 'name':'selt_device', 'value':'納品明細'}
        ];
        let copy_title=document.createElement('p');
        copy_title.innerText='複製する項目を選択してください';
        // 複製選択肢
        let copy_seltList=document.createElement('ul');
        for(let i in copySelection){
          // リスト生成
          let copy_select=document.createElement('li');
          // チェックボックス生成
          let seltBox=document.createElement('input');
          seltBox.name='copyselection';
          seltBox.type='checkbox';
          seltBox.id=copySelection[i].id;
          seltBox.value=copySelection[i].value;
          copy_select.appendChild(seltBox);
          // ラベル生成
          let seltLabel=document.createElement('label');
          seltLabel.htmlFor=copySelection[i].name;
          seltLabel.innerText=copySelection[i].value;
          copy_select.appendChild(seltLabel);
          // リスト代入
          copy_seltList.appendChild(copy_select);
        }
        mw.contents.appendChild(copy_title);
        mw.contents.appendChild(copy_seltList);
        // ボタン生成
        let copy_btnArea=document.createElement('div');
        let copy_newPrj=document.createElement('button');
        copy_newPrj.innerText='新規案件作成';
        copy_newPrj.onclick=function(){
          newRecord=new Object();
          if($("#selt_address").prop("checked") || $("#selt_device").prop("checked")){
            newRecord.Exist_Project={'value':[], 'type':resp.record.Exist_Project.type};
            newRecord.prjNum={'value':'', 'type':resp.record.prjNum.type};
            seltCopySelection();
            sessionStorage.setItem('copy_prjdata', JSON.stringify(newRecord));
            sessionStorage.setItem('is_copy_prjdata', true);
            window.open('https://accel-lab.cybozu.com/k/' + kintone.app.getId() + '/edit'); //該当アプリのレコード詳細画面を開く
          }else{
            alert('新規案件にデータを複製する場合は、何か選択してください。');
          }
        };
        copy_btnArea.appendChild(copy_newPrj);
        let copy_copyPrj=document.createElement('button');
        copy_copyPrj.innerText='既存案件複製';
        copy_copyPrj.onclick=function(){
          newRecord=new Object();
          // 既存案件情報代入
          seltExistProject();
          seltCopySelection();

          sessionStorage.setItem('copy_prjdata', JSON.stringify(newRecord));
          sessionStorage.setItem('is_copy_prjdata', true);
          window.open('https://accel-lab.cybozu.com/k/' + kintone.app.getId() + '/edit'); //該当アプリのレコード詳細画面を開く
        };
        copy_btnArea.appendChild(copy_copyPrj);
        mw.contents.appendChild(copy_btnArea);

        $('#mwFrame').fadeIn();
        function seltExistProject(){
          newRecord.Exist_Project={'value':['既存案件'], 'type':resp.record.Exist_Project.type};
          newRecord.prjNum={'value':resp.record.prjNum.value, 'type':resp.record.prjNum.type};
          newRecord.invoiceYears={'value':resp.record.invoiceYears.value, 'type':resp.record.invoiceYears.type};
          newRecord.invoiceMonth={'value':resp.record.invoiceMonth.value, 'type':resp.record.invoiceMonth.type};
          newRecord.predictDate={'value':resp.record.predictDate.value, 'type':resp.record.predictDate.type};
          newRecord.salesType={'value':resp.record.salesType.value, 'type':resp.record.salesType.type};
          newRecord.cSales={'value':resp.record.cSales.value, 'type':resp.record.cSales.type};
          newRecord.orgName={'value':resp.record.orgName.value, 'type':resp.record.orgName.type};
          newRecord.cName={'value':resp.record.cName.value, 'type':resp.record.cName.type};
          newRecord.instName={'value':resp.record.instName.value, 'type':resp.record.instName.type};
          newRecord.roomName={'value':resp.record.roomName.value, 'type':resp.record.roomName.type};
          newRecord.instDate={'value':resp.record.instDate.value, 'type':resp.record.instDate.type};
          newRecord.instDDday={'value':resp.record.instDDday.value, 'type':resp.record.instDDday.type};
          newRecord.prjSubtitle={'value':resp.record.prjSubtitle.value, 'type':resp.record.prjSubtitle.type};
          newRecord.prjMemo={'value':resp.record.prjMemo.value, 'type':resp.record.prjMemo.type};
          newRecord.doPairing={'value':resp.record.doPairing.value, 'type':resp.record.doPairing.type};
          newRecord.tdList_sc={'value':resp.record.tdList_sc.value, 'type':resp.record.tdList_sc.type};
        }
        function seltCopySelection(){
          if($("#selt_address").prop("checked")){
            newRecord.tarDate={'value':resp.record.tarDate.value, 'type':resp.record.tarDate.type};
            newRecord.aboutDelivery={'value':resp.record.aboutDelivery.value, 'type':resp.record.aboutDelivery.type};
            newRecord.dstSelection={'value':resp.record.dstSelection.value, 'type':resp.record.dstSelection.type};
            newRecord.receiver={'value':resp.record.receiver.value, 'type':resp.record.receiver.type};
            newRecord.phoneNum={'value':resp.record.phoneNum.value, 'type':resp.record.phoneNum.type};
            newRecord.zipcode={'value':resp.record.zipcode.value, 'type':resp.record.zipcode.type};
            newRecord.prefectures={'value':resp.record.prefectures.value, 'type':resp.record.prefectures.type};
            newRecord.city={'value':resp.record.city.value, 'type':resp.record.city.type};
            newRecord.address={'value':resp.record.address.value, 'type':resp.record.address.type};
            newRecord.buildingName={'value':resp.record.buildingName.value, 'type':resp.record.buildingName.type};
            newRecord.corpName={'value':resp.record.corpName.value, 'type':resp.record.corpName.type};
            newRecord.sys_instAddress={'value':resp.record.sys_instAddress.value, 'type':resp.record.sys_instAddress.type};
            newRecord.sys_unitAddress={'value':resp.record.sys_unitAddress.value, 'type':resp.record.sys_unitAddress.type};
            newRecord.Contractor={'value':resp.record.Contractor.value, 'type':resp.record.Contractor.type};
            newRecord.returnDate={'value':resp.record.returnDate.value, 'type':resp.record.returnDate.type};
            newRecord.returnCompDate={'value':resp.record.returnCompDate.value, 'type':resp.record.returnCompDate.type};
          }
          if($("#selt_device").prop("checked")){
            newRecord.deviceList={'value':resp.record.deviceList.value, 'type':resp.record.deviceList.type};
          }
        }
      });
    });
    let shipid=event.record.sys_shipment_ID.value;
    if(shipid!=''){
      setBtn_header('newTab_ship', '入出荷管理を開く');
      $('#newTab_ship').on('click', function () {
        window.open('https://accel-lab.cybozu.com/k/' + sysid.PM.app_id.project + '/show#record=' + shipid, '_blank'); //該当アプリのレコード詳細画面を開く
      });
    }
    if (sessionStorage.getItem('record_updated') === '1') {
      // //プロセスエラー処理
      // var processECheck = await processError(event);
      // console.log(processECheck);
      // if (processECheck[0] == 'error') {
      //   alert(processECheck[1]);
      // }
      sessionStorage.setItem('record_updated', '0');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
      return event;
    }
    var putData = [];
    var putBody = {
      'id': event.record.$id.value,
      'record': {}
    };

    if (event.record.deviceList.value.some(item => item.value.shipRemarks.value.match(/WFP/))) {
      putBody.record.sys_isReady = {
        'value': 'false'
      }
    } else {
      putBody.record.sys_isReady = {
        'value': 'true'
      }
    }

    if (event.record.purchaseOrder.value.length >= 1) {
      putBody.record.sys_purchaseOrder = {
        'value': ['POI']
      }
    } else {
      putBody.record.sys_purchaseOrder = {
        'value': []
      }
    }

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
      alert('過去の請求月になっています。請求月をご確認ください。');
      return event;
    }
    putData.push(putBody);
    await putRecords(kintone.app.getId(), putData);
    sessionStorage.setItem('record_updated', '1');
    location.reload();

    return event;
  });
})();