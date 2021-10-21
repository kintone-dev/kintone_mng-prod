(function () {
  'use strict';

  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    startLoad();
    var forecastList = event.record.forecastList.value;
    /**
     * 製品別在庫残数リストに全商品追加
     */
    return api_getRecords(sysid.INV.app_id.device)
      .then(function (resp) {
        for (let i in resp.records) {
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
        for (let i in forecastList) {
          forecastList[i].value.forecast_mCode.lookup = true;
        }
        endLoad();
        return event;
      });
  });

  kintone.events.on(['app.record.edit.submit', 'app.record.create.submit'], async function (event) {
    startLoad();
    if (event.record.EoMcheck.value == '一時確認') {
      /**
       * 製品別在庫残数処理
       */
      for (let i in event.record.forecastList.value) {
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
            console.log(error);
            return ['error', error];
          });
        if (purchasing[0] == 'error') {
          event.error = '仕入管理情報を取得する際にエラーが発生しました。';
          endLoad();
          return event;
        }
        console.log(purchasing);

        var forecast_mCode = event.record.forecastList.value[i].value.forecast_mCode.value;
        var totalArrivalNum = 0;

        for (let j in purchasing.records) {
          for (let k in purchasing.records[j].arrivalList.value) {
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
            console.log(error);
            return ['error', error];
          });
        if (project[0] == 'error') {
          event.error = '案件導入管理情報を取得する際にエラーが発生しました。';
          endLoad();
          return event;
        }
        console.log(project);

        var totalShipNum = 0;
        for (let j in project.records) {
          for (let k in project.records[j].deviceList.value) {
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

      /**
       * ASS在庫残数処理
       */
      var reportDate_start = new Date(event.record.invoiceYears.value, parseInt(event.record.invoiceMonth.value) - 1, 2);
      var reportDate_end = new Date(event.record.invoiceYears.value, event.record.invoiceMonth.value);
      reportDate_start = reportDate_start.toISOString();
      reportDate_end = reportDate_end.toISOString();
      // レポート月のASS情報取得
      var getAssShipBody = {
        'app': sysid.ASS.app_id.shipment,
        'query': 'shipping_datetime >= "' + reportDate_start + '" and shipping_datetime <= "' + reportDate_end + '"'
      };
      var assShipList = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getAssShipBody)
        .then(function (resp) {
          return resp;
        }).catch(function (error) {
          console.log(error);
          return ['error', error];
        });
      if (assShipList[0] == 'error') {
        event.error = 'ASS情報取得を取得する際にエラーが発生しました。';
        endLoad();
        return event;
      }
      var assItems = [];
      for (let i in assShipList.records) {
        for (let j in assShipList.records[i].deviceList.value) {
          if (assItems.some(_ => _.mCode === assShipList.records[i].deviceList.value[j].value.mCode.value)) {
            for (var k in assItems) {
              if (assItems[k].mCode == assShipList.records[i].deviceList.value[j].value.mCode.value) {
                assItems[k].shipNum = parseInt(assItems[k].shipNum || 0) + parseInt(assShipList.records[i].deviceList.value[j].value.shipNum.value || 0);
              }
            }
          } else {
            var assItemBody = {
              'mCode': assShipList.records[i].deviceList.value[j].value.mCode.value,
              'mName': assShipList.records[i].deviceList.value[j].value.mName.value,
              'shipNum': assShipList.records[i].deviceList.value[j].value.shipNum.value
            }
            assItems.push(assItemBody);
          }
        }
      }
      event.record.AssStockList.value = [];
      for (let i in assItems) {
        var newAssShipListBody = {
          'value': {
            'ASS_mCode': {
              'type': "SINGLE_LINE_TEXT",
              'value': assItems[i].mCode
            },
            'ASS_mName': {
              'type': "SINGLE_LINE_TEXT",
              'value': assItems[i].mName
            },
            'ASS_shipNum': {
              'type': "NUMBER",
              'value': assItems[i].shipNum
            },
            'ASS_returnNum': {
              'type': "NUMBER",
              'value': '0'
            },
            'ASS_remainingNum': {
              'type': "CALC",
              'value': ''
            }
          }
        };
        event.record.AssStockList.value.push(newAssShipListBody);
      }
      for (let i in event.record.AssStockList.value) {
        event.record.AssStockList.value[i].value.ASS_mCode.lookup = true;
      }
      console.log(event.record);
    }
    endLoad();
    return event;
  });

  kintone.events.on(['app.record.edit.submit.success', 'app.record.create.submit.success'], async function (event) {
    startLoad();
    if (event.record.EoMcheck.value == '一時確認') {
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
      var nextMonthReportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNextMonthReportBody)
        .then(function (resp) {
          return resp;
        });
      const NEXTREPORT_RECORD = nextMonthReportData.records[0];
      if (nextMonthReportData.records.length == 0) {
        //次月のレポートがない場合
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
        for (let i in event.record.inventoryList.value) {
          //差引数量が0以下のものは次月に載せない
          if (parseInt(event.record.inventoryList.value[i].value.deductionNum.value) > 0) {
            var postNewReport_listArray_body = {
              'value': {
                'sys_code': {
                  'value': event.record.inventoryList.value[i].value.sys_code.value
                },
                'mCode': {
                  'value': event.record.inventoryList.value[i].value.mCode.value
                },
                'stockLocation': {
                  'value': event.record.inventoryList.value[i].value.stockLocation.value
                },
                'memo': {
                  'value': event.record.inventoryList.value[i].value.memo.value
                },
                'mLastStock': {
                  'value': event.record.inventoryList.value[i].value.deductionNum.value
                }
              }
            };
            postNewReport_listArray.push(postNewReport_listArray_body);
          }
        }
        var postNewReportData = {
          'app': sysid.INV.app_id.report,
          'record': postNewReport_body
        }
        var postNewReport = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', postNewReportData)
          .then(function (resp) {
            console.log(resp);
            return resp;
          }).catch(function (error) {
            console.log(error);
            event.error = '次月レポート作成の際にエラーが発生しました。';
            return error;
          });
      } else {
        //次月のレポートがある場合
        var putNewReportData = {
          'app': sysid.INV.app_id.report,
          'id': NEXTREPORT_RECORD.$id.value,
          'record': {
            'inventoryList': {
              'value': NEXTREPORT_RECORD.inventoryList.value
            }
          }
        };
        var nowMonthSyscode = [];
        var nextMonthSyscode = [];
        for (let i in putNewReportData.record.inventoryList.value) {
          nextMonthSyscode.push(putNewReportData.record.inventoryList.value[i].value.sys_code.value);
        }
        for (let i in event.record.inventoryList.value) {
          var nowMonthData = {
            'sysCode': event.record.inventoryList.value[i].value.sys_code.value,
            'location': event.record.inventoryList.value[i].value.stockLocation.value,
            'memo': event.record.inventoryList.value[i].value.memo.value,
            'mCode': event.record.inventoryList.value[i].value.mCode.value,
            'deductionNum': event.record.inventoryList.value[i].value.deductionNum.value,
          };
          nowMonthSyscode.push(nowMonthData);
        }

        for (let i in event.record.inventoryList.value) {
          if (nextMonthSyscode.includes(nowMonthSyscode[i].sysCode)) {
            for (let y in putNewReportData.record.inventoryList.value) {
              if (putNewReportData.record.inventoryList.value[y].value.sys_code.value == event.record.inventoryList.value[i].value.sys_code.value) {
                putNewReportData.record.inventoryList.value[y].value.mLastStock.value = event.record.inventoryList.value[i].value.deductionNum.value;
                putNewReportData.record.inventoryList.value[y].value.mCode.value = event.record.inventoryList.value[i].value.mCode.value;
                putNewReportData.record.inventoryList.value[y].value.stockLocation.value = event.record.inventoryList.value[i].value.stockLocation.value;
                putNewReportData.record.inventoryList.value[y].value.memo.value = event.record.inventoryList.value[i].value.memo.value;
              }
            }
          } else {
            //差引数量が0以下のものは次月に載せない
            if (parseInt(event.record.inventoryList.value[i].value.deductionNum.value) > 0) {
              var putNewInventoryBody = {
                'value': {
                  'sys_code': nowMonthSyscode[i].sysCode,
                  'stockLocation': nowMonthSyscode[i].location,
                  'memo': nowMonthSyscode[i].memo,
                  'mCode': nowMonthSyscode[i].mCode,
                  'mLastStock': nowMonthSyscode[i].deductionNum,
                }
              };
              putNewReportData.record.inventoryList.value.push(putNewInventoryBody);
            }
          }
        }
        //次月のレポートを更新
        var putNewReport = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', putNewReportData)
          .then(function (resp) {
            console.log(resp);
            return resp;
          }).catch(function (error) {
            console.log(error);
            event.error = '次月レポート更新の際にエラーが発生しました。';
            return error;
          });
      }

      endLoad();
      return event;
    } else if(event.record.EoMcheck.value == '二時確認' || event.record.EoMcheck.value == '締切'){
      /**
       * 次月のレポートの先月残数更新
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
      var nextMonthReportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getNextMonthReportBody)
        .then(function (resp) {
          return resp;
        });
      const NEXTREPORT_RECORD = nextMonthReportData.records[0];
      //次月のレポートがある場合
      var putNewReportData = {
        'app': sysid.INV.app_id.report,
        'id': NEXTREPORT_RECORD.$id.value,
        'record': {
          'inventoryList': {
            'value': NEXTREPORT_RECORD.inventoryList.value
          }
        }
      };


    } else {
      endLoad();
      return event;
    }
  });
})();