(function () {
  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show', 'app.record.create.change.currencyType', 'app.record.edit.change.currencyType'], function (event) {
    if (event.record.currencyType.value == undefined) {
      alert('通貨種類を選択してください。');
      setSpaceShown('btn_calculation', 'line', 'none');
    } else if (event.record.currencyType.value.match('日本円')) {
      setFieldShown('remittanceList', false);
      setFieldShown('averageRate', false);
      setFieldShown('devCost_foreign', false);
      setFieldShown('unitPrice_foreign', false);
      setFieldShown('unitPriceSubtotal_foreign', false);
      setFieldShown('addiCost_foreign', false);
      setFieldShown('addiCost', false);
      setFieldShown('addiUnitCost', false);
    } else {
      setFieldShown('remittanceList', true);
      setFieldShown('averageRate', true);
      setFieldShown('devCost_foreign', true);
      setFieldShown('unitPrice_foreign', true);
      setFieldShown('unitPriceSubtotal_foreign', true);
      setFieldShown('addiCost_foreign', true);
      setFieldShown('addiCost', true);
      setFieldShown('addiUnitCost', true);
    }
    return event;
  });

  //プロセスエラー処理
  kintone.events.on('app.record.detail.show', async function (event) {
    var processECheck = await processError(event);
    if (processECheck[0] == 'error') {
      alert(processECheck[1]);
    }
    return event;
  });

  // 原価算出
  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    setSpaceShown('btn_calculation', 'line', 'block');
    var calculation = setBtn('btn_calculation', '原価算出');
    calculation.onclick = function () {
      startLoad();
      var eRecord = kintone.app.record.get();
      /**レート計算
       * 通貨種類：日本円以外
       */
      if (!eRecord.record.currencyType.value.match('日本円')) {
        // 平均レート計算
        var remittanceListValue = eRecord.record.remittanceList.value;
        var rateTotal = 0;
        for (let i in remittanceListValue) {
          rateTotal = Number(rateTotal) + Number(remittanceListValue[i].value.late.value)
        }
        // 桁数設定
        eRecord.record.averageRate.value = orgRound(rateTotal / remittanceListValue.length, 100);
      }
      console.log(eRecord.record.averageRate.value);

      /**単価＆単価合計＆仕入総額算出
       * 
       * 通貨種類：日本円以外、日本円に換算してから原価算出
       * 単価計（外貨）＝単価（外貨）x仕入数
       * 単価（￥）＝単価（外貨）x平均レート
       * 
       * 
       * 通貨種類：日本円
       * 単価計（￥）＝単価（￥）x仕入数
       * 
       * 仕入総額
       * 仕入総額＝それぞれ品目の単価計（￥）を足したもの
       */
      // 外貨から日本円単価計算＆単価計の合計
      let arrivalListValue = eRecord.record.arrivalList.value;
      // 仕入総額初期化
      let unitpricetotal = 0;
      for (let i in arrivalListValue) {
        // 通貨種類が日本円でない場合、外貨から日本円単価算出
        if (!eRecord.record.currencyType.value.match('日本円')) {
          if (eRecord.record.averageRate.value == 'NaN') {
            eRecord.record.devCost_foreign.error = 'レートを入れてください。';
          } else {
            let unitprice = arrivalListValue[i].value.unitPrice_foreign.value * eRecord.record.averageRate.value
            arrivalListValue[i].value.unitPrice.value = unitprice;
          }
        }
        console.log(arrivalListValue[i].value.unitPrice.value);
        // 単価計（￥）
        let unitpricesubtotal = arrivalListValue[i].value.unitPrice.value * arrivalListValue[i].value.arrivalNum.value
        arrivalListValue[i].value.unitPriceSubtotal.value = unitpricesubtotal;
        // 仕入総額作成（sys_unitPricetotal）
        unitpricetotal = Number(unitpricetotal) + Number(unitpricesubtotal);
      }
      eRecord.record.sys_unitPricetotal.value = unitpricetotal;
      console.log(eRecord.record.sys_unitPricetotal.value);

      /**原価内訳算出
       * 構成比=単価計/入荷総額*100
       */
      for (let i in arrivalListValue) {
        // 単価計（￥）取得
        let unitpricesubtotal = arrivalListValue[i].value.unitPriceSubtotal.value;
        console.log('単価計（￥）取得: '+unitpricesubtotal);
        // 入荷数取得
        var arrivalnum = arrivalListValue[i].value.arrivalNum.value;
        console.log('入荷数取得: '+arrivalnum);

        // 単価計（外貨）算出
        var unitpricebubtotal_foreign = arrivalListValue[i].value.unitPrice_foreign.value * arrivalnum;
        arrivalListValue[i].value.unitPriceSubtotal_foreign.value = unitpricebubtotal_foreign;
        console.log('単価計（外貨）算出: '+arrivalListValue[i].value.unitPriceSubtotal_foreign.value);
        
        // 構成比算出
        var compratio = orgRound(unitpricesubtotal / eRecord.record.sys_unitPricetotal.value * 100, 10);
        arrivalListValue[i].value.compRatio.value = compratio;
        console.log('構成比算出: '+arrivalListValue[i].value.compRatio.value)

        /**追加原価
         * 通貨種類：日本円以外
         */
        if(!eRecord.record.currencyType.value.match('日本円')){
          // 追加原価（外貨）＆追加原価（￥）
          if (eRecord.record.devCost_foreign.value == undefined) {
            eRecord.record.devCost_foreign.error = '開発費（外貨）を入れてください。開発費がない場合は「0」を入れてください。';
          } else {
            // 追加原価（外貨）
            if (eRecord.record.currencyType.value.match('日本円')) {
              arrivalListValue[i].value.addiCost_foreign.value = 0;
            } else {
              var addicost_foreign = eRecord.record.devCost_foreign.value * compratio / 100;
              arrivalListValue[i].value.addiCost_foreign.value = addicost_foreign;
            }
            // 追加原価（￥）
            var addicost = eRecord.record.averageRate.value * addicost_foreign;
            arrivalListValue[i].value.addiCost.value = addicost;
            // 追加単価（￥）
            var addiunitcost = addicost / arrivalnum;
            arrivalListValue[i].value.addiUnitCost.value = addiunitcost;
          }
        }
        /**追加原価
         * 通貨種類：日本円
         */
        else if(eRecord.record.currencyType.value.match('日本円')){
          // 追加原価（経費）
          if (eRecord.record.totalExpenses.value == undefined) {
            eRecord.record.totalExpenses.error = '経費を入れてください。経費がない場合は「0」を入れてください。';
          } else {
            var addiexpenses = eRecord.record.totalExpenses.value * compratio / 100;
            arrivalListValue[i].value.addiExpenses.value = addiexpenses;
            // 按分原価（経費）単価
            var addiUnitexpenses = addiexpenses / arrivalnum;
            arrivalListValue[i].value.addiUnitExpenses.value = addiUnitexpenses;
          }
        }
        // 原価計
        var totalunitcost = orgRound(Number(arrivalListValue[i].value.unitPrice.value) + Number(addiunitcost) + Number(addiUnitexpenses), 1);
        arrivalListValue[i].value.totalUnitCost.value = totalunitcost;
        console.log('原価計: '+arrivalListValue[i].value.totalUnitCost.value);
        // 原価合計
        var totalcost = totalunitcost * arrivalnum;
        arrivalListValue[i].value.totalCost.value = totalcost;
        console.log('原価合計: '+arrivalListValue[i].value.totalCost.value);
      }
      kintone.app.record.set(eRecord);
      endLoad();
    };
    return event;
  });
  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.create.change.mCode', 'app.record.edit.change.mCode', 'app.record.create.change.currencyType', 'app.record.edit.change.currencyType'], function (event) {
    var arrivalListValue = event.record.arrivalList.value;
    for (let i in arrivalListValue) {
      arrivalListValue[i].value.unitPriceSubtotal_foreign.disabled = true;
      arrivalListValue[i].value.unitPriceSubtotal.disabled = true;
      arrivalListValue[i].value.addiCost_foreign.disabled = true;
      arrivalListValue[i].value.addiCost.disabled = true;
      arrivalListValue[i].value.addiUnitCost.disabled = true;
      arrivalListValue[i].value.compRatio.disabled = true;
      arrivalListValue[i].value.addiExpenses.disabled = true;
      arrivalListValue[i].value.addiUnitExpenses.disabled = true;
      arrivalListValue[i].value.totalUnitCost.disabled = true;
      arrivalListValue[i].value.totalCost.disabled = true;
      arrivalListValue[i].value.addiCost.disabled = true;
      arrivalListValue[i].value.addiCost.disabled = true;
      arrivalListValue[i].value.addiCost.disabled = true;
      arrivalListValue[i].value.addiCost.disabled = true;
      if (event.record.currencyType.value.match('日本円')) {
        arrivalListValue[i].value.unitPrice.disabled = false;
      } else {
        arrivalListValue[i].value.unitPrice.disabled = true;
      }
    }
    return event;
  });
})();