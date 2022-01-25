(function(){
  'use strict';
  /** データ連携 */
  // プロセス実行
  kintone.events.on('app.record.detail.process.proceed',　async function (event) {
    startLoad();
    let nStatus = event.nextStatus.value;
    // 月末処理開始した対象月のレコードエラー処理
    let result_reportDate=await check_reportDeadline('project', event.record.sys_invoiceDate.value);
    if(result_reportDate.isRestrictedUserGroup){
      event.error = '作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みのため、作成できません。';
      endLoad();
      return event;
    }else{
      if(!confirm('作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みです\nそれでも作業を続けますか？')){
        event.error = '作成しようとしている案件の予定請求月は' + result_reportDate.EoMcheckValue + '済みのため、作成できません。';
        endLoad();
        return event;
      }
    }
    // ステータスが「入力内容確認中」になった時の動作
    if(nStatus == '入力内容確認中'){
      /** ステータス進行条件確認 */
      // 注文書なし承認条件？
      return kintone.api(kintone.api.url('/v1/user/groups', true), 'GET', {code: kintone.getLoginUser().code}).then(function (resp) {
        // 注文書有無確認
        if (event.record.purchaseOrder.value.length < 1) {
          let inGroup = false;
          for (let i in resp.groups) {
            if (resp.groups[i].name == '営業責任者' || resp.groups[i].name == 'sysAdmin') {
              inGroup = true;
              break;
            }
          }
          if (inGroup) {
            let isConfirm = window.confirm('注文書なしで納品を先行してもよろしいですか?');
            if (!isConfirm) {
              event.error = '注文書を添付するか営業責任者に承認を求めてください！';
            }
          } else {
            event.error = '注文書を添付するか営業責任者に承認を求めてください！';
          }
        }
        // プロセス実行確認
        let confTxt = '';
        for (let i in confirmSetting) {
          confTxt = confTxt + confirmSetting[i].fName + '：' + event.record[confirmSetting[i].fCode].value + '\n';
        }
        if (confirm(confTxt)) {
          return event;
        } else {
          endLoad();
          return false;
        }
      });
    }
    endLoad();
    return event;
  });

  /** 実行関数 */
})();