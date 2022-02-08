(function(){
  'use strict';
  var prjNumValue='';
  var salesTypeValue='';
  var instNameValue='';

  /** イベント　通常イベント発生時 */
  // 一覧表示
  kintone.events.on('app.record.index.show', function(event){
    startLoad();
    /** 初期設定 start */
    // 編集不可項目
    // event.record.prjNum.disabled = true;
    // event.record.Exist_Project.disabled = true;
    // 検索エンジン
    setSearch(prjSerchJson);
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    endLoad();
    return event;
  });

  // 新規レコード作成
  kintone.events.on('app.record.create.show', function(event){
    startLoad();
    /** 初期設定 start */
    // デフォルトコントロール
    defaultCTL(event);
    // タブメニュー
    setTabmenu();
    // デフォルト非表示項目
    setFieldShown('invoiceStatus', false);
    setFieldShown('invoiceNum', false);
    setFieldShown('invoiceStatus', false);
    /** 初期設定 end */

    /** アクション受領時 start */
    // 新規作成時、受取用データがあるか確認し、あれば該当項目にデータを代入
    let runPAN=true;
    if(sessionStorage.getItem('copy_prjdata')){
      let ssRecord=JSON.parse(sessionStorage.getItem('copy_prjdata'));
      for(let i in ssRecord){
        event.record[ssRecord[i].fcode].value=ssRecord[i].value;
        if(ssRecord[i].fcode=='prjNum' && ssRecord[i].value!==''){
          prjNumValue=ssRecord[i].value;
          runPAN=false;
        }
      }
      event.record.instName.lookup=true;
      event.record.Contractor.lookup=true;
      let deviceListValue=event.record.deviceList.value;
      for(let i in deviceListValue){
        deviceListValue[i].value.mNickname.lookup=true;
      }
      sessionStorage.removeItem('copy_prjdata');
      // キャンセルした時の処理
      let cancel_btn = document.getElementsByClassName('gaia-ui-actionmenu-cancel');
      cancel_btn[0].addEventListener('click', function(){
        window.close();
      }, false);
      console.log(event);
    }
    /** アクション受領時 end */

    /** 条件付き設定 start */
    // 新規導入案件、 案件番号自動採番
    if(runPAN){
      autoNum('PRJ_', 'prjNum');
    }
    // 「新規設置先」ボタン作成
    setButton_newINST();
    // 「新規不特定設置先」ボタン作成
    setButton_unknowINST;
    // 納品リストにカーテンレール部品＆付属品自動追加
    setButton_calBtn();
    /** 条件付き設定 end */
    endLoad();
    return event;
  });

  // レコード編集
  kintone.events.on('app.record.edit.show', function(event){
    startLoad();
    /** 初期設定 start */
    // デフォルトコントロール
    defaultCTL(event);
    // タブメニュー
    setTabmenu();
    /** 初期設定 end */

    /** 条件付き設定 start */
    // ステータスが「納品準備中」の場合項目を編集不可にする
    if(event.record.ステータス.value == '納品準備中') disableField(event);
    disable_subtable_field(event, 'deviceList', ['shipRemarks']);
    // 請求書番号有無による「請求書発行状況」表示コントロール
    vCTL_invoiceStatus(event);
    // 「新規設置先」ボタン作成
    setButton_newINST();
    // 「新規不特定設置先」ボタン作成
    setButton_unknowINST;
    // 納品リストにカーテンレール部品＆付属品自動追加
    setButton_calBtn();
    /** 条件付き設定 end */
    endLoad();
    return event;
  });

  // レコード詳細閲覧
  kintone.events.on('app.record.detail.show', function(event){
    startLoad();
    /** 初期設定 start */
    // デフォルトコントロール
    defaultCTL(event);
    // タブメニュー
    setTabmenu();
    /** 初期設定 end */

    /** 条件付き設定 */
    // 請求書番号有無による「請求書発行状況」表示コントロール
    vCTL_invoiceStatus(event);
    // Request Delete 「新規設置先」ボタン作成
    setButton_newINST();
    // Request Delete 「新規不特定設置先」ボタン作成
    setButton_unknowINST;
    // 請求月が過去でないか確認
    check_invoiceDate(event);

    /**
     * 「データ複製」機能
     * @author Jay
     */
    setBtn_header('copy_shipdata', 'データ複製');
    $('#copy_shipdata').on('click', function () {
      kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {'app': kintone.app.getId(),'id': kintone.app.record.getId()}).then(function(resp){
        var newRecord=[];
        
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
          newRecord=[];
          if($("#selt_address").prop("checked") || $("#selt_device").prop("checked")){
            seltCopySelection();
            sessionStorage.setItem('copy_prjdata', JSON.stringify(newRecord));
            window.open('https://accel-lab.cybozu.com/k/' + kintone.app.getId() + '/edit'); //該当アプリのレコード詳細画面を開く
          }else{
            alert('新規案件にデータを複製する場合は、何か選択してください。');
          }
        };
        copy_btnArea.appendChild(copy_newPrj);
        let copy_copyPrj=document.createElement('button');
        copy_copyPrj.innerText='既存案件複製';
        copy_copyPrj.onclick=function(){
          newRecord=[];
          // 既存案件情報代入
          seltExistProject();
          seltCopySelection();

          sessionStorage.setItem('copy_prjdata', JSON.stringify(newRecord));
          window.open('https://accel-lab.cybozu.com/k/' + kintone.app.getId() + '/edit'); //該当アプリのレコード詳細画面を開く
        };
        copy_btnArea.appendChild(copy_copyPrj);
        mw.contents.appendChild(copy_btnArea);

        $('#mwFrame').fadeIn();
        function seltExistProject(){
          newRecord.push({fcode:'Exist_Project', 'value':['既存案件']});
          newRecord.push({fcode:'prjNum', 'value':resp.record.prjNum.value});
          newRecord.push({fcode:'invoiceYears', 'value':resp.record.invoiceYears.value});
          newRecord.push({fcode:'invoiceMonth', 'value':resp.record.invoiceMonth.value});
          newRecord.push({fcode:'predictDate', 'value':resp.record.predictDate.value});
          newRecord.push({fcode:'salesType', 'value':resp.record.salesType.value});
          newRecord.push({fcode:'cSales', 'value':resp.record.cSales.value});
          newRecord.push({fcode:'orgName', 'value':resp.record.orgName.value});
          newRecord.push({fcode:'cName', 'value':resp.record.cName.value});
          newRecord.push({fcode:'instName', 'value':resp.record.instName.value});
          newRecord.push({fcode:'roomName', 'value':resp.record.roomName.value});
          newRecord.push({fcode:'instDate', 'value':resp.record.instDate.value});
          newRecord.push({fcode:'instDDday', 'value':resp.record.instDDday.value});
          newRecord.push({fcode:'prjMemo', 'value':resp.record.prjMemo.value});
        }
        function seltCopySelection(){
          if($("#selt_address").prop("checked")){

            newRecord.push({fcode:'tarDate', 'value':resp.record.tarDate.value});
            newRecord.push({fcode:'aboutDelivery', 'value':resp.record.aboutDelivery.value});
            newRecord.push({fcode:'dstSelection', 'value':resp.record.dstSelection.value});
            newRecord.push({fcode:'receiver', 'value':resp.record.receiver.value});
            newRecord.push({fcode:'phoneNum', 'value':resp.record.phoneNum.value});
            newRecord.push({fcode:'zipcode', 'value':resp.record.zipcode.value});
            newRecord.push({fcode:'prefectures', 'value':resp.record.prefectures.value});
            newRecord.push({fcode:'city', 'value':resp.record.city.value});
            newRecord.push({fcode:'address', 'value':resp.record.address.value});
            newRecord.push({fcode:'buildingName', 'value':resp.record.buildingName.value});
            newRecord.push({fcode:'corpName', 'value':resp.record.corpName.value});
            newRecord.push({fcode:'Contractor', 'value':resp.record.Contractor.value});
            newRecord.push({fcode:'returnDate', 'value':resp.record.returnDate.value});
            newRecord.push({fcode:'returnCompDate', 'value':resp.record.returnCompDate.value});
            // newRecord.push({fcode:'sys_instAddress', 'value':resp.record.sys_instAddress.value});
            // newRecord.push({fcode:'sys_unitAddress', 'value':resp.record.sys_unitAddress.value});
          }
          if($("#selt_device").prop("checked")){
            newRecord.push({fcode:'deviceList', 'value':resp.record.deviceList.value});
          }
        }
      });
    });
    // 「入出荷管理を開く」機能
    let shipid=event.record.sys_shipment_ID.value;
    if(shipid!=''){
      setBtn_header('newTab_ship', '入出荷管理を開く');
      $('#newTab_ship').on('click', function () {
        window.open('https://accel-lab.cybozu.com/k/' + sysid.INV.app_id.shipment + '/show#record=' + shipid, '_blank'); //該当アプリのレコード詳細画面を開く
      });
    }
    /** 条件付き設定 end */
    endLoad();
    return event;
  });

  // レコード保存
  kintone.events.on(['app.record.create.submit','app.record.edit.submit'], async function(event){
    startLoad();
    // 請求月が過去でないか確認
    check_invoiceDate(event);
    /*
    // 月末処理開始した対象月のレコードエラー処理
    let result_reportDate=await check_reportDeadline('project', event.record.sys_invoiceDate.value);
    if(result_reportDate.isRestrictedUserGroup){
      event.error = '作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みのため、作成できません。';
      endLoad();
      return event;
    }else{
      if(!confirm('作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みです\nそれでも作業を続けますか？')){
        event.error = '作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みのため、作成できません。';
        endLoad();
        return event;
      }
    }
    */
    // 変更前
    // 対応したレポートが締め切り済の場合保存不可
    let getReportBody = {
      'app': sysid.INV.app_id.report,
      'query': 'sys_invoiceDate = "' + event.record.sys_invoiceDate.value + '"'
    };
    let getReportResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReportBody)
      .then(function(resp){ return resp; }).catch(function(error){ return ['error', error]; });
    if(Array.isArray(getReportResult)){
      event.error = 'ASS情報取得を取得する際にエラーが発生しました';
      endLoad();
      return event;
    }
    if (getReportResult.records != 0) {
      if (getReportResult.records[0].EoMcheck.value == '締切') {
        event.error = '対応した日付のレポートは月末処理締切済みです';
        return event;
      }
    }
    endLoad();
    return event;
  });

  // レコード保存成功
  kintone.events.on(['app.record.create.submit.success','app.record.edit.submit.success'], async function(event){
    startLoad();
    // WFPチェック,添付書類チェック
    let putCheckData={
      app: kintone.app.getId(),
      id: event.record.$id.value,
      record: {}
    }
    // 納品リストに「WFP」がないかチェック
    if(event.record.deviceList.value.some(item => item.value.shipRemarks.value.match(/WFP/))) {
      putCheckData.record.sys_isReady = {'value': 'false'}
    } else {
      putCheckData.record.sys_isReady = {'value': 'true'}
    }
    // 添付書類に書類が添付されてるかチェック
    if (event.record.purchaseOrder.value.length >= 1) {
      putCheckData.record.sys_purchaseOrder = {'value': ['POI']}
    } else {
      putCheckData.record.sys_purchaseOrder = {'value': []}
    }
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', putCheckData);
    endLoad();
    return event;
  });

  /** イベント 項目変更 */
  // 「納品先選択」を「担当手渡し」に変更した場合の処理
  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection'], function(event){
    if (event.record.dstSelection.value == '担当手渡し') {
      event.record.receiver.value = event.record.cSales.value;
    } else {
      event.record.receiver.value = '';
    }
    return event;
  });

  // 「提供形態」を「貸与」に変更した場合の処理
  kintone.events.on(['app.record.create.change.salesType', 'app.record.edit.change.salesType'], function(event){
    salesTypeValue=event.record.salesType.value;
    if(salesTypeValue == '貸与'){
      setFieldShown('returnDate', true);
      setFieldShown('returnCompDate', true);
    }else{
      setFieldShown('returnDate', false);
      setFieldShown('returnCompDate', false);
    }
    return event;
  });
  
  // 請求書番号有無による「請求書発行状況」表示コントロール
  kintone.events.on(['app.record.edit.change.invoiceNum', 'app.record.create.change.invoiceNum'], function(event){
    vCTL_invoiceStatus(event);
    return event;
  });

  // デバイスリストを変更してもサブテーブルの編集不可が解除されないようにする
  kintone.events.on(['app.record.create.change.deviceList', 'app.record.edit.change.deviceList'], function(event){
    disable_subtable_field(event, 'deviceList', ['shipRemarks']);
    return event;
  });

  // 「新規設置先」、「新規不特定設置先」ボタン表示設定
  kintone.events.on(['app.record.edit.change.sys_instAddress', 'app.record.create.change.sys_instAddress'], function (event) {
    instNameValue=event.record.instName.value;
    vCTL_newINST(instNameValue);
    return event;
  });

  // 「納品先選択」を変更した場合
  kintone.events.on(['app.record.create.change.dstSelection', 'app.record.edit.change.dstSelection', 'app.record.create.change.sys_instAddress', 'app.record.edit.change.sys_instAddress', 'app.record.create.change.sys_unitAddress', 'app.record.edit.change.sys_unitAddress'], function (event) {
    switch_dstSelection(event, event.record.dstSelection.value);
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
            eRecord.record.deviceList.value[i].value.shipRemarks.value = `WFP\nカーテンレール全長(mm)：${krtLength}\n開き勝手：${krtOpenType}\n取り付け方法：${krtMethodType}\n開き方向：${krtOpenDetail}`;
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

  /** 実行関数 */
  /**
   * 初期設定
   * @param {*} event (json)
   * @author Jay
   */
  function defaultCTL(event){
    setFieldShown('mVendor', false);
    setFieldShown('mName', false);
    event.record.cSales.disabled = false;
    setFieldShown('sys_suptitle', true);
    salesTypeValue=event.record.salesType.value;
    event.record.prjNum.disabled = true;
    event.record.Exist_Project.disabled = true;
  }

  /**
   * 指定項目以外、編集不可にする
   * @param {*} event (json)
   * @author Jay
   */
  function disableField(event){
    disableAllField(event, true);
    disable_subtable_field(event, 'deviceList', ['mNickname','shipNum','subBtn']);
    event.record.sys_invoiceDate.disabled = false;
    event.record.invoiceNum.disabled = false;
    event.record.invoiceStatus.disabled = false;
  }

  /**
   * 請求書番号有無による「請求書発行状況」表示コントロール
   * @param {*} event (json)
   * @author Jay
   */
  function vCTL_invoiceStatus(event){
    if (event.record.invoiceNum.value == '' || event.record.invoiceNum.value == undefined) setFieldShown('invoiceStatus', false);
    else setFieldShown('invoiceStatus', true);
  }
  
  /**
   * 請求月が過去でないか確認
   * @param {*} event (json)
   * @author Jay
   */
  function check_invoiceDate(event){
    var currentDate = getServerDate();
    var nowDateFormat = String(currentDate.getFullYear()) + String(("0" + (currentDate.getMonth() + 1)).slice(-2));
    if (parseInt(nowDateFormat) > parseInt(event.record.sys_invoiceDate.value)) {
      alert('過去の請求月になっています。請求月をご確認ください。');
    }
  }
  
  /**
   * 「新規設置先」ボタン作成
   * @author Jay
   * 
   * 「新規不特定設置先」ボタン作成
   * @author Jay
   * 
   * ボタン表示設定
   * @param {*} instNameValue (string) 「instName」値
   * @author Jay
   */
  // 「新規設置先」ボタン作成
  function setButton_newINST(){
    let newINST = setBtn('btn_newINST', '新規設置先');
    $('#' + newINST.id).on('click', function () {
      // createNewREC(sysid.PM.app_id.installation, ['prjNum', 'btn_newORG_shown'], [prjNumValue, 'none']);
      createNewREC(sysid.PM.app_id.installation, ['prjNum', 'unknowINST', 'setShown'], [prjNumValue, '', '']);
    });
  }
  // 「新規不特定設置先」ボタン作成
  function setButton_unknowINST(){
    let unknowINST = setBtn('btn_unknowINST', '新規不特定設置先');
    $('#' + unknowINST.id).on('click', function () {
      kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        'app': sysid.PM.app_id.installation,
        'query':'limit 1'
      }).then(function(resp){
        let unknowINSTnum=Number(resp.records[0].$id.value);
        createNewREC(sysid.PM.app_id.installation, ['prjNum', 'unknowINST', 'setShown'], [prjNumValue, '不特定設置先'+unknowINSTnum, 'disable']);
      });
    });
  }
  // ボタン表示設定
  function vCTL_newINST(instNameValue){
    if (instNameValue == '' || instNameValue == undefined) {
      setSpaceShown('btn_newINST', 'individual', 'inline-block');
      setSpaceShown('btn_unknowINST', 'individual', 'inline-block');
    } else {
      setSpaceShown('btn_newINST', 'individual', 'none');
      setSpaceShown('btn_unknowINST', 'individual', 'none');
    }
  }

  /**
   * 納品リストにカーテンレール部品＆付属品自動追加
   * @author Jay
   */
  function setButton_calBtn(){
    setBtn('calBtn', '計算');
    $('#calBtn').on('click', function () {
      calBtnFunc(kintone.app.record.get(), kintone.app.getId());
    });
  }

  /**
   * 「納品先選択」による表示内容変更＆入力制御
   * @param {*} onSelect 「dstSelection」の値
   * @author Jay
   */
  function switch_dstSelection(event, onSelect){
    switch(onSelect){
      case '施工業者/拠点へ納品':
        event.record.receiver.disabled = true;
        event.record.phoneNum.disabled = true;
        event.record.zipcode.disabled = true;
        event.record.prefectures.disabled = true;
        event.record.city.disabled = true;
        event.record.address.disabled = true;
        event.record.buildingName.disabled = true;
        event.record.corpName.disabled = true;
        if (event.record.sys_unitAddress.value !== undefined) {
          var unitAddress = event.record.sys_unitAddress.value.split(',');
          event.record.receiver.value = unitAddress[0];
          event.record.phoneNum.value = unitAddress[1];
          event.record.zipcode.value = unitAddress[2];
          event.record.prefectures.value = unitAddress[3];
          event.record.city.value = unitAddress[4];
          event.record.address.value = unitAddress[5];
          event.record.buildingName.value = unitAddress[6];
          event.record.corpName.value = unitAddress[7];
        }
        break;
      case '設置先と同じ':
        event.record.receiver.disabled = false;
        event.record.phoneNum.disabled = false;
        event.record.zipcode.disabled = false;
        event.record.prefectures.disabled = false;
        event.record.city.disabled = false;
        event.record.address.disabled = false;
        event.record.buildingName.disabled = false;
        event.record.corpName.disabled = false;
        if (event.record.sys_instAddress.value !== undefined) {
          var instAddress = event.record.sys_instAddress.value.split(',');
          event.record.receiver.value = instAddress[0];
          event.record.phoneNum.value = instAddress[1];
          event.record.zipcode.value = instAddress[2];
          event.record.prefectures.value = instAddress[3];
          event.record.city.value = instAddress[4];
          event.record.address.value = instAddress[5];
          event.record.buildingName.value = instAddress[6];
          event.record.corpName.value = instAddress[7];
        }
        break;
      case '担当手渡し':
        event.record.receiver.disabled = false;
        event.record.phoneNum.disabled = false;
        event.record.zipcode.disabled = true;
        event.record.prefectures.disabled = true;
        event.record.city.disabled = true;
        event.record.address.disabled = true;
        event.record.buildingName.disabled = true;
        event.record.corpName.disabled = true;
        event.record.zipcode.value = '';
        event.record.prefectures.value = '';
        event.record.city.value = '';
        event.record.address.value = '';
        event.record.buildingName.value = '';
        event.record.corpName.value = '';
        break;
      case '':
        event.record.receiver.disabled = false;
        event.record.phoneNum.disabled = false;
        event.record.zipcode.disabled = false;
        event.record.prefectures.disabled = false;
        event.record.city.disabled = false;
        event.record.address.disabled = false;
        event.record.buildingName.disabled = false;
        event.record.corpName.disabled = false;
        break;
    }
  }
  /**
   * タブメニュー作成
   * @author Jay
   * 
   * タブ表示切り替え
   * @param {*} onSelect (string) 選択したタブID
   * @author Jay
   */
  // タブメニュー作成
  function setTabmenu(){
    let tab_menu=[
      {id:'prjInfo', name:'案件情報'},
      {id:'dstInfo', name:'宛先情報'},
      {id:'deliveryDetail', name:'納品明細'},
      {id:'shipInfo', name:'輸送情報'}
    ];
    let setTab = tabMenu_new('tab_project', tab_menu);
    let get_ssiId=kintone.app.getId()+'_'+kintone.app.record.getId();
    if(sessionStorage.getItem('ts_idName'+get_ssiId)){
      $('#'+setTab.idi+' li').removeClass("active");
      switch_tab(sessionStorage.getItem('ts_idName'+get_ssiId));
      $('#'+setTab.id+' li:nth-child(' + (parseInt(sessionStorage.getItem('ts_actIndex'+get_ssiId)) + 1) + ')').addClass('active');
      // セッションストレージ設定後該当セッションストレージ初期化
      // sessionStorage.removeItem('ts_idName'+get_ssiId);
      // sessionStorage.removeItem('ts_actIndex'+get_ssiId);
    }else{
      switch_tab('#prjInfo');
    }
    $('#'+setTab.id+' a').on('click', function () {
      let idName = $(this).attr('href'); //タブ内のリンク名を取得
      switch_tab(idName); //tabをクリックした時の表示設定
      let actIndex = $('#'+setTab.id+' li.active').index();
      let set_ssiId=kintone.app.getId()+'_'+kintone.app.record.getId();
      sessionStorage.setItem('ts_idName'+set_ssiId, idName);
      sessionStorage.setItem('ts_actIndex'+set_ssiId, actIndex);
      return false; //aタグを無効にする
    });
  }
  // タブ表示切り替え
  function switch_tab(onSelect) {
    switch (onSelect) {
      case '#prjInfo':
        setFieldShown('prjNum', true);
        setFieldShown('Exist_Project', true);
        setFieldShown('salesType', true);
        setFieldShown('predictDate', true);
        setFieldShown('purchaseOrder', true);
        setFieldShown('purchaseOrder_status', true);
        setFieldShown('prjMemo', true);
        // 再定義　表示トリガー再定義する必要あり
        setFieldShown('samePRJ', false);
        // 以下、元の文書
        // if (event.record.Exist_Project.value.length > 0) {
        //   setFieldShown('samePRJ', true);
        // } else {
        //   setFieldShown('samePRJ', false);
        // }

        setFieldShown('cName', true);
        setFieldShown('orgName', true);
        setFieldShown('instName', true);
        setFieldShown('Contractor', true);
        vCTL_newINST(instNameValue);
        if (salesTypeValue == '貸与') {
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
      case '#dstInfo':
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
      case '#deliveryDetail':
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
      case '#shipInfo':
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
})();