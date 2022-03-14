(function(){
  'use strict';
  /** イベント　通常イベント発生時 */
  // 一覧表示
  kintone.events.on('app.record.index.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */
    endLoad();
    return event;
  });
  // 新規レコード作成
  kintone.events.on('app.record.create.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** アクション受領時 start */
    /** アクション受領時 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    endLoad();
    return event;
  });
  // レコード編集
  kintone.events.on('app.record.edit.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */
    endLoad();
    return event;
  });
  // レコード詳細閲覧
  kintone.events.on('app.record.detail.show', function(event){
    startLoad();
    /** 初期設定 start */
    /** 初期設定 end */

    /** 条件付き設定 start */
    /** 条件付き設定 end */


    /** 前バージョン */
    let prjid=event.record.prjId.value;
    if(prjid!=''){
      setBtn_header('newTab_prj', '案件管理を開く');
      $('#newTab_prj').on('click', function () {
        window.open('https://accel-lab.cybozu.com/k/' + sysid.PM.app_id.project + '/show#record=' + prjid, '_blank'); //該当アプリのレコード詳細画面を開く
      });
    }
    // 新規レコード作成画面を開き、既存のレコードをコピーする
    setBtn_header('copy_shipdata', 'データ複製');
    $('#copy_shipdata').on('click', function () {
      kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {'app': kintone.app.getId(),'id': kintone.app.record.getId()}).then(function(resp){
        var newRecord=[];
        newRecord.push({fcode:'prjId', 'value':resp.record.prjId.value+'-sub'});
        newRecord.push({fcode:'shipType', 'value':resp.record.shipType.value});
        newRecord.push({fcode:'phoneNum', 'value':resp.record.phoneNum.value});
        newRecord.push({fcode:'prefectures', 'value':resp.record.prefectures.value});
        newRecord.push({fcode:'buildingName', 'value':resp.record.buildingName.value});
        newRecord.push({fcode:'corpName', 'value':resp.record.corpName.value});
        newRecord.push({fcode:'receiver', 'value':resp.record.receiver.value});
        newRecord.push({fcode:'tarDate', 'value':resp.record.tarDate.value});
        // newRecord.push({fcode:'deliveryCorp', 'value':resp.record.deliveryCorp.value});
        // newRecord.push({fcode:'trckNum', 'value':resp.record.trckNum.value});
        // newRecord.push({fcode:'sendDate', 'value':resp.record.sendDate.value});
        newRecord.push({fcode:'prjNum', 'value':resp.record.prjNum.value});
        newRecord.push({fcode:'instName', 'value':resp.record.instName.value});
        newRecord.push({fcode:'instID', 'value':resp.record.instID.value});
        newRecord.push({fcode:'aboutDelivery', 'value':resp.record.aboutDelivery.value});
        newRecord.push({fcode:'shipNote', 'value':resp.record.shipNote.value});
        // newRecord.push({fcode:'expArrivalDate', 'value':resp.record.expArrivalDate.value});
        newRecord.push({fcode:'zipcode', 'value':resp.record.zipcode.value});
        newRecord.push({fcode:'instFile', 'value':resp.record.instFile.value});
        newRecord.push({fcode:'city', 'value':resp.record.city.value});
        newRecord.push({fcode:'address', 'value':resp.record.address.value});
        newRecord.push({fcode:'Contractor', 'value':resp.record.Contractor.value});
        newRecord.push({fcode:'dstSelection', 'value':resp.record.dstSelection.value});
        newRecord.push({fcode:'shipment', 'value':resp.record.shipment.value});
        newRecord.push({fcode:'tmp_backlogID', 'value':resp.record.tmp_backlogID.value});
        newRecord.push({fcode:'sys_prjId', 'value':resp.record.sys_prjId.value});
        newRecord.push({fcode:'deviceList', 'value':resp.record.deviceList.value});

        sessionStorage.setItem('copy_shipdata', JSON.stringify(newRecord));
        sessionStorage.setItem('is_copy_shipdata', true);
        window.open('https://accel-lab.cybozu.com/k/' + kintone.app.getId() + '/edit'); //該当アプリのレコード詳細画面を開く
        console.log(newRecord);
      });
    });
    endLoad();
    return event;
  });

  /** イベント　プロセス進行 */
  kintone.events.on('app.record.detail.process.proceed', function (event) {
    startLoad();
    // 
    endLoad();
    return event;
  });

  /** イベント 項目変更 */
  // 
  kintone.events.on('app.record.create.chante.', function(event){
    startLoad();
    // 
    endLoad();
    return event;
  });

  /** 実行関数 */
})();