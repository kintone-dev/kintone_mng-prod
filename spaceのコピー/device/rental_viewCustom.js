(function () {
  //プロセスエラー処理
  kintone.events.on('app.record.detail.show', async function (event) {
    var processECheck = await processError(event);
    if (processECheck[0] == 'error') {
      alert(processECheck[1]);
    }
    return event;
  });

  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show'], function (event) {
    //tabメニューの選択肢による表示設定
    function tabSwitch(onSelect) {
      switch (onSelect) {
        case '#出荷情報':
          setFieldShown('tmp_backlogID', true);
          setFieldShown('shipment', true);
          setFieldShown('pocType', true);
          setFieldShown('shipment', true);
          setFieldShown('aboutDelivery', true);
          setFieldShown('tarDate', true);
          setFieldShown('shipNote', true);
          setFieldShown('deviceInputOrg', true);
          setFieldShown('returnDate', true);
          setFieldShown('returnCompDate', true);

          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('buildingName', false);
          setFieldShown('corpName', false);

          setFieldShown('deviceList', false);

          setFieldShown('deliveryCorp', false);
          setFieldShown('trckNum', false);
          setFieldShown('sendDate', false);
          setFieldShown('expArrivalDate', false);
          break;
        case '#宛先情報':
          setFieldShown('tmp_backlogID', false);
          setFieldShown('shipment', false);
          setFieldShown('pocType', false);
          setFieldShown('shipment', false);
          setFieldShown('aboutDelivery', false);
          setFieldShown('tarDate', false);
          setFieldShown('shipNote', false);
          setFieldShown('deviceInputOrg', false);
          setFieldShown('returnDate', false);
          setFieldShown('returnCompDate', false);

          setFieldShown('receiver', true);
          setFieldShown('phoneNum', true);
          setFieldShown('zipcode', true);
          setFieldShown('prefectures', true);
          setFieldShown('city', true);
          setFieldShown('address', true);
          setFieldShown('buildingName', true);
          setFieldShown('corpName', true);

          setFieldShown('deviceList', false);

          setFieldShown('deliveryCorp', false);
          setFieldShown('trckNum', false);
          setFieldShown('sendDate', false);
          setFieldShown('expArrivalDate', false);
          break;
        case '#品目情報':
          setFieldShown('tmp_backlogID', false);
          setFieldShown('shipment', false);
          setFieldShown('pocType', false);
          setFieldShown('shipment', false);
          setFieldShown('aboutDelivery', false);
          setFieldShown('tarDate', false);
          setFieldShown('shipNote', false);
          setFieldShown('deviceInputOrg', false);
          setFieldShown('returnDate', false);
          setFieldShown('returnCompDate', false);

          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('buildingName', false);
          setFieldShown('corpName', false);

          setFieldShown('deviceList', true);

          setFieldShown('deliveryCorp', false);
          setFieldShown('trckNum', false);
          setFieldShown('sendDate', false);
          setFieldShown('expArrivalDate', false);
          break;
        case '#輸送情報':
          setFieldShown('tmp_backlogID', false);
          setFieldShown('shipment', false);
          setFieldShown('pocType', false);
          setFieldShown('shipment', false);
          setFieldShown('aboutDelivery', false);
          setFieldShown('tarDate', false);
          setFieldShown('shipNote', false);
          setFieldShown('deviceInputOrg', false);
          setFieldShown('returnDate', false);
          setFieldShown('returnCompDate', false);

          setFieldShown('receiver', false);
          setFieldShown('phoneNum', false);
          setFieldShown('zipcode', false);
          setFieldShown('prefectures', false);
          setFieldShown('city', false);
          setFieldShown('address', false);
          setFieldShown('buildingName', false);
          setFieldShown('corpName', false);

          setFieldShown('deviceList', false);

          setFieldShown('deliveryCorp', true);
          setFieldShown('trckNum', true);
          setFieldShown('sendDate', true);
          setFieldShown('expArrivalDate', true);
          break;
      }
    }

    //タブメニュー作成
    tabMenu('tab_rent', ['出荷情報', '宛先情報', '品目情報', '輸送情報']);
    //タブ切り替え表示設定
    $('.tabMenu a').on('click', function () {
      var idName = $(this).attr('href'); //タブ内のリンク名を取得
      tabSwitch(idName); //tabをクリックした時の表示設定
      var actIndex = $('.tabMenu li.active').index();
      sessionStorage.setItem('tabSelect', idName);
      sessionStorage.setItem('actSelect', actIndex);
      return false; //aタグを無効にする
    });

    //tab初期表示設定
    if (sessionStorage.getItem('tabSelect')) {
      $('.tabMenu li').removeClass("active");
      tabSwitch(sessionStorage.getItem('tabSelect'), event);
      $('.tabMenu li:nth-child(' + (parseInt(sessionStorage.getItem('actSelect')) + 1) + ')').addClass('active');
      sessionStorage.removeItem('tabSelect');
      sessionStorage.removeItem('actSelect');
    } else {
      tabSwitch('#出荷情報', event);
    }

    return event;
  });

})();