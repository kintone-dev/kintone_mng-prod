(function () {
  'use strict';

  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    var forecastList = event.record.forecastList.value;
    /**
     * 製品別在庫残数リストに全商品追加
     */
    return api_getRecords(sysid.INV.app_id.device)
      .then(function (resp) {
        for (var i in resp.records) {
          if (!forecastList.some(item => item.value.forecast_mCode.value === resp.records[i].mCode.value)) {
            var newForecastListBody = {
              'value': {
                'forecast_mCode': {
                  'type': "SINGLE_LINE_TEXT",
                  'value': resp.records[i].mCode.value
                },
                'forecast_mName': {
                  'type': "SINGLE_LINE_TEXT",
                  'value': ''
                },
                'forecast_mStock': {
                  'type': "NUMBER",
                  'value': ''
                },
                'mOrderingPoint': {
                  'type': "NUMBER",
                  'value': ''
                },
                'mLeadTime': {
                  'type': "NUMBER",
                  'value': ''
                },
                'forecast_shipNum': {
                  'type': "NUMBER",
                  'value': ''
                },
                'forecast_arrival': {
                  'type': "NUMBER",
                  'value': ''
                },
                'afterLeadTimeStock': {
                  'type': "NUMBER",
                  'value': '2'
                },
                'remainingNum': {
                  'type': "NUMBER",
                  'value': '2'
                }
              }
            };
            forecastList.push(newForecastListBody);
          }
        }
        for (var i in forecastList) {
          forecastList[i].value.forecast_mCode.lookup = true;
        }
        return event;
      });
  });

  kintone.events.on(['app.record.edit.submit', 'app.record.create.submit'], function (event) {
    if (event.record.EoMcheck.value == '一時確認') {
      /**
       * 製品別在庫残数処理
       */
      return (async function forecastListFunc() {
        startLoad();
        for (var i in event.record.forecastList.value) {
          var reportDate = new Date(event.record.invoiceYears.value, event.record.invoiceMonth.value);
          var reportDate_current = new Date(event.record.invoiceYears.value, event.record.invoiceMonth.value);
          var mLeadTime = event.record.forecastList.value[i].value.mLeadTime.value;
          reportDate.setMonth(reportDate.getMonth() + parseInt(mLeadTime) - 1);

          var queryYears = String(reportDate.getFullYear());
          var queryMonth = String(("0" + (reportDate.getMonth() + 1)).slice(-2));
          reportDate.setMonth(reportDate.getMonth() + 1);
          reportDate.setDate(0);
          var queryDay = String(("0" + (reportDate.getDate())).slice(-2));

          var queryYears_current = String(reportDate_current.getFullYear());
          var queryMonth_current = String(("0" + (reportDate_current.getMonth() + 1)).slice(-2));
          reportDate_current.setDate(1);
          var queryDay_current = String(("0" + (reportDate_current.getDate())).slice(-2));

          var queryDate = queryYears + '-' + queryMonth + '-' + queryDay;
          var queryDate_current = queryYears_current + '-' + queryMonth_current + '-' + queryDay_current;
          // 仕入管理情報取得
          var getPurchasingBody = {
            'app': sysid.INV.app_id.purchasing,
            'query': 'ステータス not in ("仕入完了") and arrivalDate >= "' + queryDate_current + '" and arrivalDate <= "' + queryDate + '"'
          };
          var purchasing = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getPurchasingBody)
            .then(function (resp) {
              return resp;
            }).catch(function (error) {
              return error;
            });
          console.log(purchasing);

          var forecast_mCode = event.record.forecastList.value[i].value.forecast_mCode.value;
          var totalArrivalNum = 0;

          for (var j in purchasing.records) {
            for (var k in purchasing.records[j].arrivalList.value) {
              if (forecast_mCode == purchasing.records[j].arrivalList.value[k].value.mCode.value) {
                totalArrivalNum = parseInt(totalArrivalNum) + parseInt(purchasing.records[j].arrivalList.value[k].value.arrivalNum.value);
              }
            }
          }
          // 仕入予定数挿入
          event.record.forecastList.value[i].value.forecast_arrival.value = totalArrivalNum;

          // 案件導入管理取得
          var getProjectBody = {
            'app': sysid.PM.app_id.project,
            'query': 'predictDate >= "' + queryDate_current + '" and predictDate <= "' + queryDate + '"'
          };
          var project = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getProjectBody)
            .then(function (resp) {
              return resp;
            }).catch(function (error) {
              return error;
            });
          console.log(project);

          var totalShipNum = 0;
          for (var j in project.records) {
            for (var k in project.records[j].deviceList.value) {
              if (forecast_mCode == project.records[j].deviceList.value[k].value.mCode.value) {
                totalShipNum = parseInt(totalShipNum) + parseInt(project.records[j].deviceList.value[k].value.shipNum.value);
              }
            }
          }
          // 出荷予定数挿入
          event.record.forecastList.value[i].value.forecast_shipNum.value = totalShipNum;
          //リードタイム後残数
          event.record.forecastList.value[i].value.afterLeadTimeStock.value = (parseInt(event.record.forecastList.value[i].value.forecast_mStock.value) || 0) - (parseInt(totalArrivalNum) || 0) + (parseInt(totalShipNum) || 0);
          //差引残数
          event.record.forecastList.value[i].value.remainingNum.value = (parseInt(event.record.forecastList.value[i].value.afterLeadTimeStock.value) || 0) - (parseInt(event.record.forecastList.value[i].value.mOrderingPoint.value) || 0);
        }
        endLoad();
        return event;
      }());
    }
  });

  kintone.events.on(['app.record.edit.submit.success', 'app.record.create.submit.success'], function (event) {
    if (event.record.EoMcheck.value == '締切') {
      /**
       * 次月のレポート作成処理
       */
      const REPORT_KEY_YEAR = event.record.invoiceYears.value;
      const REPORT_KEY_MONTH = event.record.invoiceMonth.value;
      var reportDate = new Date(REPORT_KEY_YEAR, REPORT_KEY_MONTH);
      const NEXT_DATE = String(reportDate.getFullYear()) + String(("0" + (reportDate.getMonth() + 1)).slice(-2));
      // 次月のレポートを取得
      var getNextMonthReportBody = {
        'app': sysid.INV.app_id.report,
        'query': 'sys_invoiceDate = "' + NEXT_DATE + '"'
      };
      return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNextMonthReportBody)
        .then(function (resp) {
          const NEXTREPORT_RECORD = resp.records[0];
          if (resp.records.length == 0) {
            //次月のレポートがない場合
            var postNewReportData = [];
            var postNewReport_listArray = [];
            var postNewReport_body = {
              'invoiceYears': {
                'value': String(reportDate.getFullYear())
              },
              'invoiceMonth': {
                'value': String(("0" + (reportDate.getMonth() + 1)).slice(-2))
              },
              'inventoryList': {
                'value': postNewReport_listArray
              }
            };
            for (var pil in event.record.inventoryList.value) {
              //差引数量が0以下のものは次月に載せない
              if (parseInt(event.record.inventoryList.value[pil].value.deductionNum.value) > 0) {
                var postNewReport_listArray_body = {
                  'value': {
                    'sys_code': {
                      'value': event.record.inventoryList.value[pil].value.sys_code.value
                    },
                    'mCode': {
                      'value': event.record.inventoryList.value[pil].value.mCode.value
                    },
                    'stockLocation': {
                      'value': event.record.inventoryList.value[pil].value.stockLocation.value
                    },
                    'memo': {
                      'value': event.record.inventoryList.value[pil].value.memo.value
                    },
                    'mLastStock': {
                      'value': event.record.inventoryList.value[pil].value.deductionNum.value
                    }
                  }
                };
                postNewReport_listArray.push(postNewReport_listArray_body);
              }
            }
            postNewReportData.push(postNewReport_body);
            //次月のレポートを作成
            postRecords(sysid.INV.app_id.report, postNewReportData);
          } else {
            //次月のレポートがある場合
            var putNewReportData = [];
            var putNewReport_body = {
              'id': NEXTREPORT_RECORD.$id.value,
              'record': {
                'inventoryList': {
                  'value': NEXTREPORT_RECORD.inventoryList.value
                }
              }
            };
            var nowMonthSyscode = [];
            var nextMonthSyscode = [];
            for (var i in putNewReport_body.record.inventoryList.value) {
              nextMonthSyscode.push(putNewReport_body.record.inventoryList.value[i].value.sys_code.value);
            }
            for (var i in event.record.inventoryList.value) {
              var nowMonthData = {
                'sysCode': event.record.inventoryList.value[i].value.sys_code.value,
                'location': event.record.inventoryList.value[i].value.stockLocation.value,
                'memo': event.record.inventoryList.value[i].value.memo.value,
                'mCode': event.record.inventoryList.value[i].value.mCode.value,
                'deductionNum': event.record.inventoryList.value[i].value.deductionNum.value,
              };
              nowMonthSyscode.push(nowMonthData);
            }

            for (var ril in event.record.inventoryList.value) {
              if (nextMonthSyscode.includes(nowMonthSyscode[ril].sysCode)) {
                for (var nil in putNewReport_body.record.inventoryList.value) {
                  if (putNewReport_body.record.inventoryList.value[nil].value.sys_code.value == event.record.inventoryList.value[ril].value.sys_code.value) {
                    putNewReport_body.record.inventoryList.value[nil].value.mLastStock.value = event.record.inventoryList.value[ril].value.deductionNum.value;
                    putNewReport_body.record.inventoryList.value[nil].value.mCode.value = event.record.inventoryList.value[ril].value.mCode.value;
                    putNewReport_body.record.inventoryList.value[nil].value.stockLocation.value = event.record.inventoryList.value[ril].value.stockLocation.value;
                    putNewReport_body.record.inventoryList.value[nil].value.memo.value = event.record.inventoryList.value[ril].value.memo.value;
                  }
                }
              } else {
                //差引数量が0以下のものは次月に載せない
                if (parseInt(event.record.inventoryList.value[ril].value.deductionNum.value) > 0) {
                  var putNewInventoryBody = {
                    'value': {
                      'sys_code': nowMonthSyscode[ril].sysCode,
                      'stockLocation': nowMonthSyscode[ril].location,
                      'memo': nowMonthSyscode[ril].memo,
                      'mCode': nowMonthSyscode[ril].mCode,
                      'mLastStock': nowMonthSyscode[ril].deductionNum,
                    }
                  };
                  putNewReport_body.record.inventoryList.value.push(putNewInventoryBody);
                }
              }
            }
            putNewReportData.push(putNewReport_body);
            //次月のレポートを更新
            putRecords(sysid.INV.app_id.report, putNewReportData);
          }
          return event;
        });
    } else {
      return event;
    }
  });
})();