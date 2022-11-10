(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    var supNum = event.record.$id.value;
    var bName = event.record.bName.value;
    var rDetail = event.record.ReportingDetail.value;
    //訪問 btn_onSite
    var new_onSite = setBtn('btn_onSite', '現地対応追加');
    $('#' + new_onSite.id).on('click', function () {
      createNewREC(sysid.SUP.app.onsite, ['supNum', 'bName', 'ReportingDetail'], [supNum, bName, rDetail]);
    });
    //配送 btn_onShip
    var new_onShip = setBtn('btn_onShip', '配送対応追加');
    $('#' + new_onShip.id).on('click', function () {
      createNewREC(sysid.SUP.app.ship, ['supNum', 'bName'], [supNum, bName]);
    });
  });

  var events_ced = [
    'app.record.edit.show',
    'app.record.create.show',
    'app.record.detail.show'
  ];
  kintone.events.on(events_ced, function (event) {
    setFieldShown('tarDevice', false);
    setFieldShown('tarSeries', false);
    setFieldShown('hwIssue', false);

    // setFieldShown('serviceType', false);
    // setFieldShown('swIssue', false);
    // setFieldShown('aboutDevice', false);
    // setFieldShown('scadminIssue', false);

    // setFieldShown('nonService', false);

    setFieldShown('sup_mean', true);
    setFieldShown('device_status', true);
    setFieldShown('sup_logInfo', true);
    setFieldShown('sup_logDetail', true);
    setFieldShown('ReportingIssue', false);
    setFieldShown('ReportingDetail', false);
    setFieldShown('ReportingResult', false);

    //setSpaceShown('btn_onSite', 'none');
    //setSpaceShown('btn_onShip', 'none');

    switch (event.record.issueType.value) {

      default:
        //
        setFieldShown('tarDevice', false);
        setFieldShown('tarSeries', false);
        setFieldShown('hwIssue', false);

        setFieldShown('serviceType', false);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', false);
        break;

        //デバイストラブル
      case "デバイストラブル":
        setFieldShown('tarDevice', true);
        setFieldShown('tarSeries', true);
        setFieldShown('hwIssue', true);

        setFieldShown('serviceType', false);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', false);
        break;

        //サービストラブル
      case "サービストラブル":
        setFieldShown('tarDevice', false);
        setFieldShown('tarSeries', false);
        setFieldShown('hwIssue', false);

        setFieldShown('serviceType', true);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', false);
        break;


      case "サポート対象外":
        setFieldShown('tarDevice', false);
        setFieldShown('tarSeries', false);
        setFieldShown('hwIssue', false);

        setFieldShown('serviceType', false);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', true);
        break;
    }
    function tabSwitch(onSelect) {
      switch (onSelect) {
        case '#お問い合わせ詳細':
          setFieldShown('sup_mean', true);
          setFieldShown('device_status', true);
          setFieldShown('sup_logInfo', true);
          setFieldShown('sup_logDetail', true);
          setFieldShown('ReportingIssue', false);
          setFieldShown('ReportingDetail', false);
          setFieldShown('ReportingResult', false);
          setSpaceShown('btn_onSite', 'block');
          setSpaceShown('btn_onShip', 'block');
          break;
        case '#レポート':
          setFieldShown('sup_mean', false);
          setFieldShown('device_status', false);
          setFieldShown('sup_logInfo', false);
          setFieldShown('sup_logDetail', false);
          setFieldShown('ReportingIssue', true);
          setFieldShown('ReportingDetail', true);
          setFieldShown('ReportingResult', true);
          setSpaceShown('btn_onSite', 'none');
          setSpaceShown('btn_onShip', 'none');
          break;
      }
    }
    //タブメニュー作成
    tabMenu('tab_sup', ['お問い合わせ詳細', 'レポート']);
    if (sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'));
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
    } else {
      tabSwitch('#お問い合わせ詳細');
    }
    //タブ切り替え表示設定
    $('.tab_sup a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false; //aタグを無効にする
    });
    return event;
  });

  var events_issueType = [
    'app.record.edit.change.issueType',
    'app.record.create.change.issueType'
  ];
  kintone.events.on(events_issueType, function (event) {
    //選択肢初期化
    event.record.tarDevice.value = [];
    event.record.tarSeries.value = [];
    event.record.hwIssue.value = [];
    event.record.serviceType.value = [];
    event.record.swIssue.value = [];
    event.record.aboutDevice.value = [];
    event.record.scadminIssue.value = [];
    event.record.nonService.value = [];
    //問題種別による表示切り替え
    switch (event.record.issueType.value) {

      default:
        //
        setFieldShown('tarDevice', false);
        setFieldShown('tarSeries', false);
        setFieldShown('hwIssue', false);

        setFieldShown('serviceType', false);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', false);
        break;

        //デバイストラブル
      case "デバイストラブル":
        setFieldShown('tarDevice', true);
        setFieldShown('tarSeries', true);
        setFieldShown('hwIssue', true);

        setFieldShown('serviceType', false);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', false);
        break;

        //サービストラブル
      case "サービストラブル":
        setFieldShown('tarDevice', false);
        setFieldShown('tarSeries', false);
        setFieldShown('hwIssue', false);

        setFieldShown('serviceType', true);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', false);
        break;


      case "サポート対象外":
        setFieldShown('tarDevice', false);
        setFieldShown('tarSeries', false);
        setFieldShown('hwIssue', false);

        setFieldShown('serviceType', false);
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);

        setFieldShown('nonService', true);
        break;
    }
    return event;
  });

  var events_serviceType = [
    'app.record.edit.change.serviceType',
    'app.record.create.change.serviceType'
  ];
  kintone.events.on(events_serviceType, function (event) {
    //選択肢初期化
    event.record.swIssue.value = [];
    event.record.aboutDevice.value = [];
    event.record.scadminIssue.value = [];
    //サービス区分
    switch (event.record.serviceType.value) {
      default:
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);
        break;
      case "サービスについて":
        setFieldShown('swIssue', true);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', false);
        break;
      case "IoTデバイスについて":
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', true);
        setFieldShown('scadminIssue', false);
        break;
      case "管理画面について":
        setFieldShown('swIssue', false);
        setFieldShown('aboutDevice', false);
        setFieldShown('scadminIssue', true);
        break;
    }
    return event;
  });
  kintone.events.on('app.record.create.submit.success', async function(event){
    let thisRecordId = kintone.app.record.getId();
    console.log('thisRecordId:'+thisRecordId);
    // 案件作成時「AI案件管理評価」アプリにもレコード追加
    let postBody = {
      app: 356,
      record: {
        supNum: {value: thisRecordId}
      }
    };
    // let postResult = await kintone.api(kintone.api.url('/k/v1/records', true), 'POST', postBody);
    let postResult = await useBackdoor('POST', postBody, 'J7RICWguEki39P2E7THpbicpwP1NPdgkhVeBxXFS');
    console.log(postResult[1]);
    console.log(JSON.parse(postResult[0]));

    // 「AI案件管理評価」アプリに追加したレコード番号を書き込む
    if(postResult[1] == '200'){
      let postResultId = JSON.parse(postResult[0]).id;
      console.log('postResultId:'+postResultId);
      let returnBody = {
        app: kintone.app.getId(),
        id: thisRecordId,
        record: {
          sys_caseEvaluation_al: {value: postResultId}
        }
      };
      kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', returnBody);
    }
  });
/*
  kintone.events.on('app.record.edit.submit.success', async function(event){
    let thisRecordId = kintone.app.record.getId();
    console.log('thisRecordId:'+thisRecordId);

    let caseEvaluation_al = event.record.sys_caseEvaluation_al.value;
    if(caseEvaluation_al){
      // 案件保存時「AI案件管理評価」アプリにもレコード更新
      // 先に「AI案件管理評価」のレコードを取得し、問い合わせ番号が一致するか確認する、一致しない場合は「データー改竄されたと記録する」
      // infoError
      // ErrorMessage
      let getResult = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
        app: 356,
        id: caseEvaluation_al,
      });
      let supNumResult = getResult.record.supNum.value;
      // 両アプリの問い合わせ番号が一致する場合
      if(supNumResult == event.record.supNum.value){
        let putBody = {
          app: 356,
          id: caseEvaluation_al,
          record: {
            supNum: {value: thisRecordId}
          }
        };
        kintone.api(kintone.api.url('/k/v1/record', true), ' PUT', putBody);
      }
      // 両アプリの問い合わせ番号が一致しない場合
      else{
        let putBody = {
          app: 356,
          id: caseEvaluation_al,
          record: {
            infoError: {value: ['InformationError']},
            ErrorMessage: {value: '問い合わせ番号が「' + supNumResult + '」から「' + event.record.supNum.value + '」に変更されようとしています。'}
          }
        };
        kintone.api(kintone.api.url('/k/v1/record', true), ' PUT', putBody);
      }
    }else{
      // 案件保存時「AI案件管理評価」アプリにもレコード追加
      let postBody = {
        app: 356,
        record: {
          supNum: {value: thisRecordId}
        }
      };
      let postResult = await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', postBody);
  
      // 「AI案件管理評価」アプリに追加したレコード番号を書き込む
      console.log('postResultId:'+postResult.id);
      let returnBody = {
        app: kintone.app.getId(),
        id: thisRecordId,
        record: {
          sys_caseEvaluation_al: {value: postResult.id}
        }
      };
      kintone.api(kintone.api.url('/k/v1/record', true), ' PUT', returnBody);
    }
  });
  */
})();