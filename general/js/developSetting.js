(function () {
  'use strict';

  var events_ced = [
    'app.record.index.show',
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.print.show',
    'app.report.show'
  ];
  //編集を表示するユーザー
  var ignoreUser = ['kintone_mng@accel-lab.com', 'sysdev', 'prjmgt'];
  // var ignoreUser = ['kintone_mng@accel-lab.com'];
  // indexページでの新規、編集、複製ボタン非表示
  kintone.events.on(events_ced, function (event) {
    //一覧編集、編集、追加、複製を表示しないページ
    var deletePage = [sysid.INV.app_id.report];
    //一覧編集、複製を表示しないページ
    var noIndexEditPage = [sysid.PM.app_id.project];

    if (!ignoreUser.includes(kintone.getLoginUser().code)) {
      if (deletePage.includes(kintone.app.getId())) {
        $('.gaia-argoui-app-menu-add').remove();
        $('.recordlist-edit-gaia').remove();
        $('.recordlist-remove-gaia').remove();
        $('.gaia-argoui-app-menu-edit').remove();
        $('.gaia-argoui-app-menu-copy').remove();
      } else if (noIndexEditPage.includes(kintone.app.getId())) {
        $('.recordlist-edit-gaia').remove();
        $('.recordlist-remove-gaia').remove();
        $('.gaia-argoui-app-menu-copy').remove();
      }
    }
    return event;
  });

  kintone.events.on('app.record.index.show', function (event) {
    if (ignoreUser.includes(kintone.getLoginUser().code)) {
      if (kintone.app.getId() == sysid.INV.app_id.device) {
        var deployBtn = setBtn_index('device_deply_btn', '商品情報強制更新');
        //商品情報強制デプロイ
        $('#' + deployBtn.id).on('click', async function () {
          if (confirm('在庫管理と品目マスタの商品情報を強制的に更新します。\nよろしいですか？')) {
            /* 商品管理情報取得 */
            var getDeviceQuery = {
              'app': sysid.INV.app_id.device,
              'query': ''
            };
            var deviceData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getDeviceQuery)
              .then(function (resp) {
                return resp;
              }).catch(function (error) {
                return error;
              });
            /* 在庫管理情報取得 */
            var getUnitQuery = {
              'app': sysid.INV.app_id.unit,
              'query': ''
            };
            var unitData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getUnitQuery)
              .then(function (resp) {
                return resp;
              }).catch(function (error) {
                return error;
              });
            var newDeviceList = [];
            // 商品情報を配列に格納
            for (var i in deviceData.records) {
              var newDeviceListBody = {
                'value': {
                  'mCode': {
                    'value': deviceData.records[i].mCode.value
                  },
                  'mName': {
                    'value': deviceData.records[i].mName.value
                  }
                }
              }
              newDeviceList.push(newDeviceListBody);
            }
            // 拠点管理アプリの品目リストに上書きするデータ作成
            var putUnitData = {
              'app': sysid.INV.app_id.unit,
              'records': []
            };
            for (var i in unitData.records) {
              var putUnitBody = {
                'id': unitData.records[i].$id.value,
                'record': {
                  'mStockList': {
                    'value': newDeviceList
                  }
                }
              };
              putUnitData.records.push(putUnitBody);
            }

            // 拠点管理更新
            await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', putUnitData)
              .then(function (resp) {
                console.log(resp);
                return resp;
              }).catch(function (error) {
                console.log(error);
                return error;
              });

            // 品目マスター(PRJ)情報削除
            var getPrjItemQuery = {
              'app': sysid.PM.app_id.item,
              'query': ''
            };
            var prjItemData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getPrjItemQuery)
              .then(function (resp) {
                return resp;
              }).catch(function (error) {
                return error;
              });

            var prjItemdeleteData = [];
            for (var i in prjItemData.records) {
              prjItemdeleteData.push(prjItemData.records[i].$id.value);
            }

            // 品目マスター(SUP)情報削除
            var getSupItemQuery = {
              'app': sysid.SUP.app_id.item,
              'query': ''
            };
            var supItemData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getSupItemQuery)
              .then(function (resp) {
                return resp;
              }).catch(function (error) {
                return error;
              });

            var supItemdeleteData = [];
            for (var i in supItemData.records) {
              supItemdeleteData.push(supItemData.records[i].$id.value);
            }

            // 品目マスター(ASS)情報削除
            var getAssItemQuery = {
              'app': sysid.ASS.app_id.item,
              'query': ''
            };
            var assItemData = await kintone.api(kintone.api.url('/k/v1/records.json', true), "GET", getAssItemQuery)
              .then(function (resp) {
                return resp;
              }).catch(function (error) {
                return error;
              });

            var assItemdeleteData = [];
            for (var i in assItemData.records) {
              assItemdeleteData.push(assItemData.records[i].$id.value);
            }
            await deleteRecords(sysid.PM.app_id.item, prjItemdeleteData)
              .catch(function (error) {
                console.log('prjItem delete error');
              });
            await deleteRecords(sysid.SUP.app_id.item, supItemdeleteData)
              .catch(function (error) {
                console.log('supItem delete error');
              });
            await deleteRecords(sysid.ASS.app_id.item, assItemdeleteData)
              .catch(function (error) {
                console.log('assItem delete error');
              });
            /* 新規データ転送 */
            // 転送データ作成
            var postItemData = {
              'app': '',
              'records': []
            };
            for (var i in deviceData.records) {
              var postItemBody = {
                'mName': deviceData.records[i].mName,
                'mCode': deviceData.records[i].mCode,
                'mNickname': deviceData.records[i].mNickname,
                'mType': deviceData.records[i].mType,
                'mVendor': deviceData.records[i].mVendor,
                'mClassification': deviceData.records[i].mClassification,
                'packageComp': deviceData.records[i].packageComp
              };
              postItemData.records.push(postItemBody);
            }
            // 転送先指定
            var tarAPP = [
              sysid.PM.app_id.item,
              sysid.SUP.app_id.item,
              sysid.ASS.app_id.item
            ];
            // 品目マスターに転送実行
            for (var i in tarAPP) {
              postItemData.app = tarAPP[i];
              await kintone.api(kintone.api.url('/k/v1/records', true), 'POST', postItemData);
            }
            return event;
          }
        });
      }
    }
    return event;
  });

  kintone.events.on('app.record.detail.show', function (event) {
    if (kintone.app.getId() == sysid.PM.app_id.project) {
      var deployBtn = setBtn_header('device_deply_btn', '案件情報強制更新');
      $('#' + deployBtn.id).on('click', async function () {
        if (confirm('入出荷管理に案件情報を強制的に更新します。\nよろしいですか？')) {
          var putShipBody = {
            'app': sysid.INV.app_id.shipment,
            'updateKey': {
              'field': 'prjId',
              'value': event.record.$id.value
            },
            'record': {
              'shipType': {
                'value': '社内利用'
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
          for (var i in event.record.deviceList.value) {
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
          await kintone.api(kintone.api.url('/k/v1/record', true), "PUT", putShipBody)
            .then(function (resp) {
              console.log(resp);
            }).catch(function (error) {
              console.log(error);
            });
        }
      });
    }
    return event;
  });



})();