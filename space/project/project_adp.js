(function () {
  'use strict';
  //プロセス変更時
  kintone.events.on('app.record.detail.process.proceed', async function (event) {
    startLoad();
    var nStatus = event.nextStatus.value;
    var reportData = await checkEoMReport(event.record.sys_invoiceDate.value, kintone.getLoginUser());
    if (Array.isArray(reportData)) {
      if (reportData[0] == 'false') {
        event.error = '対応した日付のレポートは' + reportData[1] + '済みです。';
        endLoad();
        return event;
      } else if (reportData[0] == 'true') {
        if (!confirm('対応した日付のレポートは' + reportData[1] + '済みです。\n作業を続けますか？')) {
          endLoad();
          return event;
        }
      }
    }

    if (nStatus == '入力内容確認中') { //ステータスが入力内容確認中の場合
      if (event.record.sys_shipment_ID.value == '' || event.record.sys_rent_ID.value == '') {
        // ステータスを進めるための条件を満たしたが確認
        var sResult = false;
        // var deliveryArrangements=['aboutDelivery','tarDate','deviceList'];//dstSelection  担当手渡し
        var deliveryArrangements = ['receiver', 'phoneNum', 'zipcode', 'prefectures', 'city', 'address', 'aboutDelivery', 'tarDate', 'deviceList'];
        for (let i in deliveryArrangements) {
          if (event.record.dstSelection.value == '担当手渡し') {
            i = 6;
          }
          if (event.record[deliveryArrangements[i]].value == undefined || event.record[deliveryArrangements[i]].value == '') {
            // event.record[deliveryArrangements[i]].error='ステータスを進めるに必要な項目です。';
            sResult = false;
            break;
          } else {
            sResult = true;
          }
        }
        if (event.record.aboutDelivery.value == '確認中') {
          // event.record.aboutDelivery.error='この項目が確認中のままではステータスを進められません。'
          sResult = false;
        }
        console.log('aboutDelivery: ' + event.record.aboutDelivery.value);
        // ステータスを進めるための条件判定結果により処理実行
        if (sResult) {
          // 入出荷管理post用配列
          var postShipData = {
            'app': sysid.INV.app_id.shipment,
            'records': []
          };
          var postRentData = {
            'app': sysid.DEV.app_id.rental,
            'records': []
          };
          if (event.record.salesType.value == '無償提供' || event.record.salesType.value == '貸与') {
            // 貸与管理post内容
            var postRentBody = {
              'tmp_backlogID': {
                'value': event.record.tmp_backlogID.value
              },
              'pocType': {
                'value': event.record.salesType.value
              },
              'aboutDelivery': {
                'value': event.record.aboutDelivery.value
              },
              'tarDate': {
                'value': event.record.tarDate.value
              },
              'returnDate': {
                'value': event.record.returnDate.value
              },
              'returnCompDate': {
                'value': event.record.returnCompDate.value
              },
              'receiver': {
                'value': event.record.receiver.value
              },
              'phoneNum': {
                'value': event.record.phoneNum.value
              },
              'zipcode': {
                'value': event.record.zipcode.value
              },
              'prefectures': {
                'value': event.record.prefectures.value
              },
              'city': {
                'value': event.record.city.value
              },
              'address': {
                'value': event.record.address.value
              },
              'buildingName': {
                'value': event.record.buildingName.value
              },
              'corpName': {
                'value': event.record.corpName.value
              },
              'deviceList': {
                'value': []
              },
              'sys_prjNum': {
                'value': event.record.prjNum.value
              },
              'sys_prjId': {
                'value': event.record.$id.value
              }
            };
            for (let i in event.record.deviceList.value) {
              var devListBody = {
                'value': {
                  'mNickname': {
                    'value': event.record.deviceList.value[i].value.mNickname.value
                  },
                  'shipNum': {
                    'value': event.record.deviceList.value[i].value.shipNum.value
                  }
                }
              };
              postRentBody.deviceList.value.push(devListBody);
            }
            postRentData.records.push(postRentBody);
            // 貸与管理に情報連携
            console.log('postRentData:');
            console.log(postRentData);
            var postRentResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postRentData)
              .then(function (resp) {
                console.log(resp);
                return resp;
              }).catch(function (error) {
                console.log(error);
                return ['error', error];
              });
            if (Array.isArray(postRentResult)) {
              event.error = '貸与管理に情報連携する際にエラーが発生しました';
              endLoad();
              return event;
            } else {
              var sys_rent_ID = '';
              for (let i in postRentResult.ids) {
                if (i < postRentResult.ids.length - 1) {
                  sys_rent_ID += postRentResult.ids[i] + ',';
                } else {
                  sys_rent_ID += postRentResult.ids[i];
                }
              }
              event.record.sys_rent_ID.value = sys_rent_ID;
            }
          } else {
            // 入出荷管理post内容
            var postShipBody = {
              'tmp_backlogID': {
                'value': event.record.tmp_backlogID.value
              },
              'aboutDelivery': {
                'value': event.record.aboutDelivery.value
              },
              'tarDate': {
                'value': event.record.tarDate.value
              },
              'dstSelection': {
                'value': event.record.dstSelection.value
              },
              'Contractor': {
                'value': event.record.Contractor.value
              },
              'instName': {
                'value': event.record.instName.value
              },
              'receiver': {
                'value': event.record.receiver.value
              },
              'phoneNum': {
                'value': event.record.phoneNum.value
              },
              'zipcode': {
                'value': event.record.zipcode.value
              },
              'prefectures': {
                'value': event.record.prefectures.value
              },
              'city': {
                'value': event.record.city.value
              },
              'address': {
                'value': event.record.address.value
              },
              'buildingName': {
                'value': event.record.buildingName.value
              },
              'corpName': {
                'value': event.record.corpName.value
              },
              'sys_instAddress': {
                'value': event.record.sys_instAddress.value
              },
              'sys_unitAddress': {
                'value': event.record.sys_unitAddress.value
              },
              'deviceList': {
                'value': []
              },
              'prjId': {
                'value': event.record.$id.value
              },
              'prjNum': {
                'value': event.record.prjNum.value
              }
            };
            for (let i in event.record.deviceList.value) {
              if (event.record.deviceList.value[i].value.subBtn.value == '通常') {
                var devListBody = {
                  'value': {
                    'mNickname': {
                      'value': event.record.deviceList.value[i].value.mNickname.value
                    },
                    'shipNum': {
                      'value': event.record.deviceList.value[i].value.shipNum.value
                    }
                  }
                };
                postShipBody.deviceList.value.push(devListBody);
              }
            }
            // 社内・社員予備機用post用サブデータ
            var postShipSubBody = {
              'tmp_backlogID': {
                'value': event.record.tmp_backlogID.value
              },
              'shipType': {
                'value': '移動-拠点間'
              },
              'aboutDelivery': {
                'value': event.record.aboutDelivery.value
              },
              'tarDate': {
                'value': event.record.tarDate.value
              },
              'dstSelection': {
                'value': event.record.dstSelection.value
              },
              'Contractor': {
                'value': '社員予備'
              },
              'instName': {
                'value': event.record.instName.value
              },
              'receiver': {
                'value': event.record.receiver.value
              },
              'phoneNum': {
                'value': event.record.phoneNum.value
              },
              'zipcode': {
                'value': event.record.zipcode.value
              },
              'prefectures': {
                'value': event.record.prefectures.value
              },
              'city': {
                'value': event.record.city.value
              },
              'address': {
                'value': event.record.address.value
              },
              'buildingName': {
                'value': event.record.buildingName.value
              },
              'corpName': {
                'value': event.record.corpName.value
              },
              'sys_instAddress': {
                'value': event.record.sys_instAddress.value
              },
              'sys_unitAddress': {
                'value': event.record.sys_unitAddress.value
              },
              'deviceList': {
                'value': []
              },
              'prjId': {
                'value': event.record.$id.value + '-sub'
              },
              'prjNum': {
                'value': event.record.prjNum.value
              }
            };
            for (let i in event.record.deviceList.value) {
              if (event.record.deviceList.value[i].value.subBtn.value == '予備') {
                var devListBody = {
                  'value': {
                    'mNickname': {
                      'value': event.record.deviceList.value[i].value.mNickname.value
                    },
                    'shipNum': {
                      'value': event.record.deviceList.value[i].value.shipNum.value
                    },
                    'shipRemarks': {
                      'value': '社員予備'
                    }
                  }
                };
                postShipSubBody.deviceList.value.push(devListBody);
              }
            }
            //post用データを格納（予備機がある場合は予備データも）
            postShipData.records.push(postShipBody);
            if (postShipSubBody.deviceList.value.length != 0) {
              postShipData.records.push(postShipSubBody);
            }
            // 入出荷管理に情報連携
            console.log('postShipData:');
            console.log(postShipData);
            var postShipResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postShipData)
              .then(function (resp) {
                console.log(resp);
                return resp;
              }).catch(function (error) {
                console.log(error);
                return ['error', error];
              });
            if (Array.isArray(postShipResult)) {
              event.error = '入出荷管理に情報連携する際にエラーが発生しました';
              endLoad();
              return event;
            } else {
              var sys_shipment_id = '';
              for (let i in postShipResult.ids) {
                if (i < postShipResult.ids.length - 1) {
                  sys_shipment_id += postShipResult.ids[i] + ',';
                } else {
                  sys_shipment_id += postShipResult.ids[i];
                }
              }
              event.record.sys_shipment_ID.value = sys_shipment_id;
            }
          }
        } else {
          event.error = 'ステータスを進めるに必要な項目が未入力です';
        }
      }
    } else if (nStatus == '納品準備中') {
      // 入出荷管理put用配列
      var putShipData = {
        'app': sysid.INV.app_id.shipment,
        'records': []
      };
      var putRentData = {
        'app': sysid.DEV.app_id.rental,
        'records': []
      };
      if (event.record.salesType.value == '無償提供' || event.record.salesType.value == '貸与') {
        // 貸与管理put用配列
        var putRentBody = {
          'updateKey': {
            'field': 'sys_prjId',
            'value': event.record.$id.value
          },
          'record': {
            'tmp_backlogID': {
              'value': event.record.tmp_backlogID.value
            },
            'pocType': {
              'value': event.record.salesType.value
            },
            'aboutDelivery': {
              'value': event.record.aboutDelivery.value
            },
            'tarDate': {
              'value': event.record.tarDate.value
            },
            'returnDate': {
              'value': event.record.returnDate.value
            },
            'returnCompDate': {
              'value': event.record.returnCompDate.value
            },
            'receiver': {
              'value': event.record.receiver.value
            },
            'phoneNum': {
              'value': event.record.phoneNum.value
            },
            'zipcode': {
              'value': event.record.zipcode.value
            },
            'prefectures': {
              'value': event.record.prefectures.value
            },
            'city': {
              'value': event.record.city.value
            },
            'address': {
              'value': event.record.address.value
            },
            'buildingName': {
              'value': event.record.buildingName.value
            },
            'corpName': {
              'value': event.record.corpName.value
            },
            'deviceList': {
              'value': []
            },
            'sys_prjNum': {
              'value': event.record.prjNum.value
            }
          }
        };
        for (let i in event.record.deviceList.value) {
          var devListBody = {
            'value': {
              'mNickname': {
                'value': event.record.deviceList.value[i].value.mNickname.value
              },
              'shipNum': {
                'value': event.record.deviceList.value[i].value.shipNum.value
              }
            }
          };
          putRentBody.record.deviceList.value.push(devListBody);
        }
        putRentData.records.push(putRentBody);
        // 貸与管理に情報連携
        console.log('putRentData:');
        console.log(putRentData);
        var putRentResult = await kintone.api(kintone.api.url('/k/v1/records', true), "PUT", putRentData)
          .then(function (resp) {
            console.log(resp);
            return resp;
          }).catch(function (error) {
            console.log(error);
            return ['error', error];
          });
        if (Array.isArray(putRentResult)) {
          event.error = '貸与管理に情報連携する際にエラーが発生しました';
          endLoad();
          return event;
        }

        // ステータス更新
        var getRentBody = {
          'app': sysid.DEV.app_id.rental,
          'query': 'sys_prjId in ("' + event.record.$id.value + '")'
        };
        var rentRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getRentBody)
          .then(function (resp) {
            return resp;
          }).catch(function (error) {
            console.log(error);
            return ['error', error];
          });
        if (Array.isArray(rentRecord)) {
          event.error = 'ステータス変更時にエラーが発生しました';
          endLoad();
          return event;
        }
        var putStatusData = {
          'app': sysid.DEV.app_id.rental,
          'records': []
        };
        for (let i in rentRecord.records) {
          if (rentRecord.records[i].ステータス.value == '納品情報未確定') {
            var putStatusBody = {
              'id': rentRecord.records[i].$id.value,
              'action': '処理開始',
              'assignee': 'm.logi'
            };
            putStatusData.records.push(putStatusBody);
          }
        }
        console.log(putStatusData.records.length);
        if (putStatusData.records.length > 0) {
          var putStatusResult = await kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusData)
            .then(function (resp) {
              return resp;
            }).catch(function (error) {
              console.log(error);
              return ['error', error];
            });
        }
        if (Array.isArray(putStatusResult)) {
          event.error = 'ステータス変更時にエラーが発生しました';
          endLoad();
          return event;
        }
      } else {
        // 入出荷管理put用配列
        var putShipBody = {
          'updateKey': {
            'field': 'prjId',
            'value': event.record.$id.value
          },
          'record': {
            'tmp_backlogID': {
              'value': event.record.tmp_backlogID.value
            },
            'aboutDelivery': {
              'value': event.record.aboutDelivery.value
            },
            'tarDate': {
              'value': event.record.tarDate.value
            },
            'dstSelection': {
              'value': event.record.dstSelection.value
            },
            'Contractor': {
              'value': event.record.Contractor.value
            },
            'instName': {
              'value': event.record.instName.value
            },
            'receiver': {
              'value': event.record.receiver.value
            },
            'phoneNum': {
              'value': event.record.phoneNum.value
            },
            'zipcode': {
              'value': event.record.zipcode.value
            },
            'prefectures': {
              'value': event.record.prefectures.value
            },
            'city': {
              'value': event.record.city.value
            },
            'address': {
              'value': event.record.address.value
            },
            'buildingName': {
              'value': event.record.buildingName.value
            },
            'corpName': {
              'value': event.record.corpName.value
            },
            'sys_instAddress': {
              'value': event.record.sys_instAddress.value
            },
            'sys_unitAddress': {
              'value': event.record.sys_unitAddress.value
            },
            'deviceList': {
              'value': []
            },
            'prjNum': {
              'value': event.record.prjNum.value
            }
          }
        };
        for (let i in event.record.deviceList.value) {
          if (event.record.deviceList.value[i].value.subBtn.value == '通常') {
            var devListBody = {
              'value': {
                'mNickname': {
                  'value': event.record.deviceList.value[i].value.mNickname.value
                },
                'shipNum': {
                  'value': event.record.deviceList.value[i].value.shipNum.value
                }
              }
            };
            putShipBody.record.deviceList.value.push(devListBody);
          }
        }
        // 社内・社員予備機用put用サブデータ
        var putShipSubBody = {
          'updateKey': {
            'field': 'prjId',
            'value': event.record.$id.value + '-sub'
          },
          'record': {
            'tmp_backlogID': {
              'value': event.record.tmp_backlogID.value
            },
            'shipType': {
              'value': '移動-拠点間'
            },
            'aboutDelivery': {
              'value': event.record.aboutDelivery.value
            },
            'tarDate': {
              'value': event.record.tarDate.value
            },
            'dstSelection': {
              'value': event.record.dstSelection.value
            },
            'Contractor': {
              'value': '社員予備'
            },
            'instName': {
              'value': event.record.instName.value
            },
            'receiver': {
              'value': event.record.receiver.value
            },
            'phoneNum': {
              'value': event.record.phoneNum.value
            },
            'zipcode': {
              'value': event.record.zipcode.value
            },
            'prefectures': {
              'value': event.record.prefectures.value
            },
            'city': {
              'value': event.record.city.value
            },
            'address': {
              'value': event.record.address.value
            },
            'buildingName': {
              'value': event.record.buildingName.value
            },
            'corpName': {
              'value': event.record.corpName.value
            },
            'sys_instAddress': {
              'value': event.record.sys_instAddress.value
            },
            'sys_unitAddress': {
              'value': event.record.sys_unitAddress.value
            },
            'deviceList': {
              'value': []
            },
            'prjNum': {
              'value': event.record.prjNum.value
            }
          }
        };
        for (let i in event.record.deviceList.value) {
          if (event.record.deviceList.value[i].value.subBtn.value == '予備') {
            var devListBody = {
              'value': {
                'mNickname': {
                  'value': event.record.deviceList.value[i].value.mNickname.value
                },
                'shipNum': {
                  'value': event.record.deviceList.value[i].value.shipNum.value
                },
                'shipRemarks': {
                  'value': '社員予備'
                }
              }
            };
            putShipSubBody.record.deviceList.value.push(devListBody);
          }
        }
        //put用データを格納（予備機がある場合は予備データも）
        putShipData.records.push(putShipBody);
        if (putShipSubBody.record.deviceList.value.length != 0) {
          putShipData.records.push(putShipSubBody);
        }
        // 入出荷管理に情報連携
        console.log('putShipData:');
        console.log(postShipData);
        var putShipResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), "PUT", putShipData)
          .then(function (resp) {
            console.log(resp);
            return resp;
          }).catch(function (error) {
            console.log(error);
            return ['error', error];
          });
        if (Array.isArray(putShipResult)) {
          event.error = '入出荷管理に情報連携する際にエラーが発生しました';
          endLoad();
          return event;
        }

        // ステータス更新
        var prjIdArray = ['"' + event.record.$id.value + '"', '"' + event.record.$id.value + '-sub"'];
        var getShipBody = {
          'app': sysid.INV.app_id.shipment,
          'query': 'prjId in (' + prjIdArray.join() + ')'
        };
        var prjIdRecord = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getShipBody)
          .then(function (resp) {
            return resp;
          }).catch(function (error) {
            console.log(error);
            return ['error', error];
          });
        var putStatusData = {
          'app': sysid.INV.app_id.shipment,
          'records': []
        };
        for (let i in prjIdRecord.records) {
          if (prjIdRecord.records[i].ステータス.value == '納品情報未確定') {
            var putStatusBody = {
              'id': prjIdRecord.records[i].$id.value,
              'action': '処理開始',
              'assignee': 'm.logi'
            };
            putStatusData.records.push(putStatusBody);
          }
        }
        if (putStatusData.records.length > 0) {
          var putStatusResult = await kintone.api(kintone.api.url('/k/v1/records/status.json', true), "PUT", putStatusData)
            .then(function (resp) {
              return resp;
            }).catch(function (error) {
              console.log(error);
              return ['error', error];
            });
        }
        if (Array.isArray(putStatusResult)) {
          event.error = 'ステータス変更時にエラーが発生しました';
          endLoad();
          return event;
        }
      }
    } else if (nStatus == '完了') { //ステータスが完了の場合
      if (event.record.salesType.value == '販売' || event.record.salesType.value == 'サブスク') {
        // 在庫処理
        await stockCtrl(event, kintone.app.getId());
        // レポート処理
        await reportCtrl(event, kintone.app.getId());
      }
    }
    endLoad();
    return event;
  });

  //保存ボタン押下時、請求月が今より過去の場合アラートを&対応したレポートが締め切り済の場合保存できないように
  kintone.events.on(['app.record.edit.submit', 'app.record.create.submit'], async function (event) {
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
      alert('過去の請求月になっています。請求月をご確認ください');
      return event;
    }

    //対応レポート取得
    var getReportBody = {
      'app': sysid.INV.app_id.report,
      'query': 'sys_invoiceDate = "' + event.record.sys_invoiceDate.value + '"'
    };
    var getReportResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReportBody)
      .then(function (resp) {
        console.log(resp);
        return resp;
      }).catch(function (error) {
        console.log(error);
        return ['error', error];
      });
    if (Array.isArray(getReportResult)) {
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

    return event;
  });

})();