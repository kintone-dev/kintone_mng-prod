(function () {
  kintone.events.on(['app.record.create.show','app.record.edit.show','app.record.detail.show','app.record.create.change.currencyType','app.record.edit.change.currencyType'], function(event){
    if(event.record.currencyType.value==undefined){
      alert('通貨種類を選択してください。');
      setSpaceShown('btn_calculation','line','none');
    }
    else if(event.record.currencyType.value.match('日本円')){
      setFieldShown('remittanceList', false);
      setFieldShown('averageRate', false);
      setFieldShown('devCost_foreign', false);
      setFieldShown('unitPrice_foreign', false);
      setFieldShown('unitPriceSubtotal_foreign', false);
      setFieldShown('addiCost_foreign', false);
      setFieldShown('addiCost', false);
      setFieldShown('addiUnitCost', false);
    }else{
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
  kintone.events.on(['app.record.edit.show','app.record.create.show'], function(event){
    setSpaceShown('btn_calculation','line','block');
    var calculation=setBtn('btn_calculation','原価算出');
    calculation.onclick=function(){
      // if(!event.record.currencyType.value.match('日本円')){}
      var eRecord=kintone.app.record.get();
      var arrivalListValue=eRecord.record.arrivalList.value;
      if(!eRecord.record.currencyType.value.match('日本円')){
        // 平均レート計算
        var remittanceListValue=eRecord.record.remittanceList.value;
        var rateTotal=0;
        for(var x in remittanceListValue){
          rateTotal=Number(rateTotal)+Number(remittanceListValue[x].value.late.value)
        }
        eRecord.record.averageRate.value=orgRound(rateTotal/remittanceListValue.length,100);
      }
      // 外貨から単価割り出し＆単価計の合計
      var unitpricetotal=0;
      for(var y in arrivalListValue){
        // 単価（￥）外貨から換算した場合
        if(!eRecord.record.currencyType.value.match('日本円')){
          if(eRecord.record.averageRate.value=='NaN'){
            eRecord.record.devCost_foreign.error='レートを入れてください。';
          }else{
            var unitprice=arrivalListValue[y].value.unitPrice_foreign.value*eRecord.record.averageRate.value
            arrivalListValue[y].value.unitPrice.value=unitprice;
          }
        }
        // 単価計（￥）
        var unitpricesubtotal=arrivalListValue[y].value.unitPrice.value*arrivalListValue[y].value.arrivalNum.value
        arrivalListValue[y].value.unitPriceSubtotal.value=unitpricesubtotal;
        // 単価計（￥）の合計（sys_unitPricetotal）
        unitpricetotal=Number(unitpricetotal)+Number(unitpricesubtotal);
      }
      eRecord.record.sys_unitPricetotal.value=unitpricetotal;
      for(var i in arrivalListValue){
        // 単価計（￥）取得
        var unitpricesubtotal=arrivalListValue[i].value.unitPriceSubtotal.value;
        // 入荷数取得
        var arrivalnum=arrivalListValue[i].value.arrivalNum.value;
        // 単価計（外貨）
        var unitpricebubtotal_foreign=arrivalListValue[i].value.unitPrice_foreign.value*arrivalnum;
        arrivalListValue[i].value.unitPriceSubtotal_foreign.value=unitpricebubtotal_foreign;
        // 構成比
        var compratio=orgRound(unitpricesubtotal/eRecord.record.sys_unitPricetotal.value*100,10);
        arrivalListValue[i].value.compRatio.value=compratio;
        if(eRecord.record.devCost_foreign.value==undefined){
          eRecord.record.devCost_foreign.error='開発費を入れてください。開発費がない場合は「0」を入れてください。';
        }else{
          // 追加原価（外貨）
          if(eRecord.record.currencyType.value.match('日本円')){
            arrivalListValue[i].value.addiCost_foreign.value=0;
          }else{
            var addicost_foreign=eRecord.record.devCost_foreign.value*compratio/100;
            arrivalListValue[i].value.addiCost_foreign.value=addicost_foreign;
          }
          // 追加原価（￥）
          var addicost=eRecord.record.averageRate.value*addicost_foreign;
          arrivalListValue[i].value.addiCost.value=addicost;
          // 追加単価（￥）
          var addiunitcost=addicost/arrivalnum;
          arrivalListValue[i].value.addiUnitCost.value=addiunitcost;
        }
        // 追加原価（経費）
        if(eRecord.record.totalExpenses.value==undefined){
          eRecord.record.totalExpenses.error='経費を入れてください。経費がない場合は「0」を入れてください。';
        }else{
          var addiexpenses=eRecord.record.totalExpenses.value*compratio/100;
          arrivalListValue[i].value.addiExpenses.value=addiexpenses;
          // 按分原価（経費）単価
          var addiUnitexpenses=addiexpenses/arrivalnum;
          arrivalListValue[i].value.addiUnitExpenses.value=addiUnitexpenses;
        }
        // 原価計
        var totalunitcost=orgRound(Number(arrivalListValue[i].value.unitPrice.value)+Number(addiunitcost)+Number(addiUnitexpenses),1);
        arrivalListValue[i].value.totalUnitCost.value=totalunitcost;
        // 原価合計
        var totalcost=totalunitcost*arrivalnum;
        arrivalListValue[i].value.totalCost.value=totalcost;
      }
      kintone.app.record.set(eRecord);
    };
    return event;
  });
  kintone.events.on(['app.record.create.show','app.record.edit.show','app.record.create.change.mCode','app.record.edit.change.mCode','app.record.create.change.currencyType','app.record.edit.change.currencyType'], function(event){
    var arrivalListValue=event.record.arrivalList.value;
    for(var i in arrivalListValue){
      arrivalListValue[i].value.unitPriceSubtotal_foreign.disabled=true;
      arrivalListValue[i].value.unitPriceSubtotal.disabled=true;
      arrivalListValue[i].value.addiCost_foreign.disabled=true;
      arrivalListValue[i].value.addiCost.disabled=true;
      arrivalListValue[i].value.addiUnitCost.disabled=true;
      arrivalListValue[i].value.compRatio.disabled=true;
      arrivalListValue[i].value.addiExpenses.disabled=true;
      arrivalListValue[i].value.addiUnitExpenses.disabled=true;
      arrivalListValue[i].value.totalUnitCost.disabled=true;
      arrivalListValue[i].value.totalCost.disabled=true;
      arrivalListValue[i].value.addiCost.disabled=true;
      arrivalListValue[i].value.addiCost.disabled=true;
      arrivalListValue[i].value.addiCost.disabled=true;
      arrivalListValue[i].value.addiCost.disabled=true;
      if(event.record.currencyType.value.match('日本円')){
        arrivalListValue[i].value.unitPrice.disabled=false;
      }else{
        arrivalListValue[i].value.unitPrice.disabled=true;
      }
    }
    return event;
  });
})();
