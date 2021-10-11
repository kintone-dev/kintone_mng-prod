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

    setFieldShown('serviceType', false);
    setFieldShown('swIssue', false);
    setFieldShown('aboutDevice', false);
    setFieldShown('scadminIssue', false);

    setFieldShown('nonService', false);

    setFieldShown('sup_mean', true);
    setFieldShown('device_status', true);
    setFieldShown('sup_logInfo', true);
    setFieldShown('sup_logDetail', true);
    setFieldShown('ReportingIssue', false);
    setFieldShown('ReportingDetail', false);
    setFieldShown('ReportingResult', false);

    //setSpaceShown('btn_onSite', 'none');
    //setSpaceShown('btn_onShip', 'none');

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
    //タブ切り替え表示設定
    $('.tab_sup a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      return false; //aタグを無効にする
    });
    tabSwitch('#お問い合わせ詳細'); //tab初期表示設定
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
})();