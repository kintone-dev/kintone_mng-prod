// NEW
/**
 * フィールド所得
 * @returns (json)
 * @author Jay
 */
function getFields(){
	return Object.values(cybozu.data.page.FORM_DATA.schema.table.fieldList);
}
/**
 * サーバー時間取得
 * @returns (date)
 * @author Jay
 */
function getServerDate() {
  let serverDate = $.ajax({
    type: 'GET',
    async: false
  }).done(function (data, status, xhr) {
    return xhr;
  });
  return new Date(serverDate.getResponseHeader('Date'));
}

/**
 * formatDate
 * @param {*} date
 * @param {*} format
 * @returns response
 * @author
 */
function formatDate(date, format){
  format = format.replace(/YYYY/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  return format;
};

/**
 * 現在の時刻を以下の形にフォーマット
 * YYYY-MM-DDThh:mm:00Z
 * @returns
 * @author
 */
function forListDate(){
  return formatDate(getServerDate(), 'YYYY')+'-'+formatDate(getServerDate(), 'MM')+'-'+formatDate(getServerDate(), 'DD')+'T'+formatDate(getServerDate(), 'hh')+':'+formatDate(getServerDate(), 'mm')+':00Z';
};

/**
 * サブテーブルの指定項目を編集不可にする
 * @param {*} event (json)
 * @param {*} tfCode (string) 編集不可対象サブテーブルのフィールドコード
 * @param {*} fCodes (array) 編集不可にするフィールドコード
 * @author Jay
 */
function disable_subtable_field(event, tfCode, fCodes){
	for(let i in event.record[tfCode].value) {
		fCodes.forEach(function(fCode){
			event.record[tfCode].value[i].value[fCode].disabled = true;
		});
	}
}

/**
 * システムフィールドとサブテーブル以外、全フィールド編集不可
 * @param {*} event (json)
 * @param {*} eBoolean (boolean) 編集不可にする場合は「true」
 * @author Jay
 */
function disableAllField(event, eBoolean){
	let types = ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'RICH_TEXT', 'NUMBER', 'DATE', 'DATETIME', 'TIME', 'DROP_DOWN', 'RADIO_BUTTON', 'CHECK_BOX', 'MULTI_SELECT', 'USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT', 'LINK', 'FILE'];
	let arr = Object.keys(event.record);
	arr.forEach(function (fcode) {
		if (types.indexOf(event.record[fcode].type) >= 0) {
			event.record[fcode].disabled = eBoolean;
		}
	});
}
function tabMenu_new(tabID, tabList) {
	// タブメニュー作成
	let result_tabMenu = document.createElement('ul');
	result_tabMenu.id = tabID;
	result_tabMenu.classList.add(tabID);
	result_tabMenu.classList.add('tabMenu');
	tabList.forEach(function(tablist){
		let tList = document.createElement('li');
		let aLink = document.createElement('a');
		aLink.setAttribute('href', '#' + tablist.id);
		aLink.innerText = tablist.name;
		tList.appendChild(aLink);
		result_tabMenu.appendChild(tList);
	});
	kintone.app.record.getSpaceElement(tabID).appendChild(result_tabMenu);
	// ハイライト初期設定
	$('.' + tabID + ' li:first-of-type').addClass("active");
	$('.' + tabID + ' a').on('click', function () {
		let parentElm = $(this).parent();
		$('.' + tabID + ' li').removeClass("active");
		$(parentElm).addClass("active");
		return false; // aタグを無効にする
	});
	return result_tabMenu;
}

/**
 * レポート締切確認
 * @param {*} invoiceDate  (date) 「sys_invoiceDate」の値
 * @returns (json)
 * @author Jay
 */
async function check_reportDeadline(checkApp, invoiceDate){
	let result_reportDeadline={'EoMcheckValue': null, 'isRestrictedUserGroup': true};
	let getReportStatus = {
		app: sysid.INV.app_id.report,
		query: 'sys_invoiceDate = "' + invoiceDate + '"',
		fields: ['EoMcheck']
	};
	let resultReportStatus = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', getReportStatus);
	if(resultReportStatus.records.length>0 && resultReportStatus.records[0].EoMcheck.value){
		// 設定済み制限除外グループを呼び込む
		let deadlineExceptionGroup = deadlineException(checkApp);
		// ログインユーザの所属グループ取得
		let getLoginUserGroup = await kintone.api(kintone.api.url('/v1/user/groups', true), 'GET', {code: kintone.getLoginUser().code});
		// 設定したフィールドの値を取得
		let getAppSetting = await kintone.api(kintone.api.url('/k/v1/app/form/fields.json', true), 'GET', {app:sysid.INV.app_id.report});
		let getEoMcheckOptions = Object.values(getAppSetting.properties.EoMcheck.options);
		// 設定したオプションに該当する処理
		for(let i in getEoMcheckOptions){
			if(getEoMcheckOptions[i].label==resultReportStatus.records[0].EoMcheck.value){
				for(let y in getLoginUserGroup.groups){
					if(deadlineExceptionGroup[getEoMcheckOptions[i].index].groupName.includes(getLoginUserGroup.groups[y].code)){
						result_reportDeadline= {'EoMcheckValue': getEoMcheckOptions[i].label, 'isRestrictedUserGroup': false};
						break;
					}else{
						result_reportDeadline= {'EoMcheckValue': getEoMcheckOptions[i].label, 'isRestrictedUserGroup': true};
					}
				}
				break;
			}
		}
	}
	return result_reportDeadline;
}

/**
 * レコードから出荷するシリアル番号とその詳細をjsonで再作成
 * @param {*} shipRecord [event.record]
 * @param {*} snTableName
 * @returns response
 * @author Jay
 * レスポンス例
 *  - {
 *  -   serial:{
 *  -     tests01: {sNum: 'tests01', sInfo: 0},
 *  -     tests02: {sNum: 'tests02', sInfo: 0},
 *  -     tests04: {sNum: 'tests04', sInfo: 1},
 *  -     tests05: {sNum: 'tests05', sInfo: 1}
 *  -   },
 *  -   shipInfo: {
 *  -     fCode: {value: ''},
 *  -     deviceInfo:[
 *  -       {mCode: {value: 'code1'}, memo:{ value: 'text'}},
 *  -       {mCode: {value: 'code2'}, memo:{ value: 'texttt'}}
 *  -       ]
 *  -   }
 *  - }
 */
function renew_sNumsInfo_alship(shipRecord, snTableName){
	console.log('start construction Serial Number Data');
	console.log(shipRecord[snTableName].value);
	if(!shipRecord[snTableName].value) return {result: false, error:  {target: 'renewsn', code: 'renewsn_nodata'}};
  // 共通出荷情報を取得
  let snumsInfo = {
    serial: {},
    shipInfo: {
			sendApp: kintone.app.getId(),
			sendRecordId: kintone.app.record.getId(),
      sendDate: {value: shipRecord.sendDate.value},
      shipType: {value: shipRecord.shipType.value},
      shipment: {value: shipRecord.shipment.value},
      // orgName: {value: ''},
      instName: {value: shipRecord.instName.value},
      receiver: {value: shipRecord.instName.value},
      warranty_startDate: {value: shipRecord.sendDate.value},
      // warranty_period: {value: ''},
      // warranty_endDate: {value: ''},
      // toastcam_bizUserId: {value: ''},
      // churn_type: {value: ''},
      // use_stopDate: {value: ''},
      // use_endDate: {value: ''},
      pkgid: {value: kintone.app.getId()+'-'+kintone.app.record.getId()},
      deviceInfo: []
    }
  };
  // シリアル情報取得＆再作成
  let snTableValue = shipRecord[snTableName].value;
  for(let i in snTableValue){
    // 製品情報処理
		if(snTableValue[i].value.mType.value == '完成品' && snTableValue[i].value.mCode.value !== 'KRT-DY'){
			// snumsInfo.shipInfo.deviceInfo.push({
			// 	mCode: {value: snTableValue[i].value.mCode.value},
			// 	shipNum: {value: snTableValue[i].value.shipNum.value},
			// 	shipRemarks: {value: snTableValue[i].value.shipRemarks.value},
			// });
			// シリアル情報処理
			let snArray = (snTableValue[i].value.sNum.value).split(/\r\n|\n/);
			snArray.forEach(function(snum){
				if(snum) snumsInfo.serial[snum]={sNum: snum, sInfo: i};
			});
			// for(let y in snArray){
			//   snumsInfo.serial[snArray[y]]={sNum: snArray[y], sInfo: i};
			// }
		}
		snumsInfo.shipInfo.deviceInfo.push({
			mCode: {value: snTableValue[i].value.mCode.value},
			shipNum: {value: snTableValue[i].value.shipNum.value},
			shipRemarks: {value: snTableValue[i].value.shipRemarks.value},
		});
  }
  console.log(snumsInfo);
  console.log('end construction Serial Number Data');
	return snumsInfo;
}

function renew_sNumsInfo_alship_forShippingv2(shipRecord, snTableName){
	console.log('start construction Serial Number Data');
	console.log(shipRecord[snTableName].value);
	if(!shipRecord[snTableName].value) return {result: false, error:  {target: 'renewsn', code: 'renewsn_nodata'}};
	let receiverTemp = shipRecord.zipcode.value+shipRecord.prefectures.value+shipRecord.city.value+shipRecord.address.value+shipRecord.buildingName.value+shipRecord.corpName.value+shipRecord.receiver.value
  // 共通出荷情報を取得
  let snumsInfo = {
    serial:{},
    shipInfo: {
			sendApp: kintone.app.getId(),
			sendRecordId: kintone.app.record.getId(),
      sendDate: {value: shipRecord.sendDate.value},
      shipType: {value: shipRecord.shipType.value},
      shipment: {value: shipRecord.shipment.value},
      // orgName: {value: ''},
      instName: {value: shipRecord.instName.value},
      receiver: {value: receiverTemp},
      warranty_startDate: {value: shipRecord.sendDate.value},
      storageLocation: {value: shipRecord.destination.value},
      // warranty_period: {value: ''},
      // warranty_endDate: {value: ''},
      // toastcam_bizUserId: {value: ''},
      // churn_type: {value: ''},
      // use_stopDate: {value: ''},
      // use_endDate: {value: ''},
      pkgid: {value: kintone.app.getId()+'-'+kintone.app.record.getId()},
      deviceInfo: []
    }
  };
  // シリアル情報取得＆再作成
  let snTableValue = shipRecord[snTableName].value;
  for(let i in snTableValue){
		if(!(shipRecord.recordSplitType.value == 'メイン' && snTableValue[i].value.sys_recordSplitStatus.value.length > 0)){
			// 製品情報処理
			if(snTableValue[i].value.mType.value == '完成品' || snTableValue[i].value.mType.value == 'パッケージ品'){
				if(snTableValue[i].value.mCode.value !== 'KRT-DY') {
					// シリアル情報処理
					let snArray = (snTableValue[i].value.sNum.value).split(/\r\n|\n/);
					console.log(snArray);
					snArray.forEach(function(snum){
						if(snum) snumsInfo.serial[snum]={sNum: snum, sInfo: i};
					});
				}
			}
		}
		snumsInfo.shipInfo.deviceInfo.push({
			mCode: {value: snTableValue[i].value.mCode.value},
			shipNum: {value: snTableValue[i].value.shipNum.value},
			shipRemarks: {value: snTableValue[i].value.shipRemarks.value},
			cmsID: {value: snTableValue[i].value.cmsID.value},
			sys_mId: {value: snTableValue[i].value.sys_mId.value},
		});
  }
  console.log(snumsInfo);
  console.log('end construction Serial Number Data');
	return snumsInfo;
}

function renew_sNumsInfo_alship_forDelivery(shipRecord, snTableName){
	console.log('start construction Serial Number Data');
	console.log(shipRecord[snTableName].value);
	if(!shipRecord[snTableName].value) return {result: false, error:  {target: 'renewsn', code: 'renewsn_nodata'}};
  // 共通出荷情報を取得
	let dateFormat1 = new Date(shipRecord.shipping_datetime.value)
  let snumsInfo = {
    serial: {},
    shipInfo: {
			sendApp: kintone.app.getId(),
			sendRecordId: kintone.app.record.getId(),
      sendDate: {value: dateFormat1.getFullYear()+'-'+(dateFormat1.getMonth() + 1)+'-'+dateFormat1.getDate()},
      shipType: {value: 'ASS-'+shipRecord.application_type.value},
      shipment: {value: 'For Needs'},
      storageLocation: {value: '積送（ASS）'},
      // orgName: {value: ''},
      instName: {value: 'ASS'},
      receiver: {value: 'ASS-'+shipRecord.member_id.value},
      warranty_startDate: {value: dateFormat1.getFullYear()+'-'+(dateFormat1.getMonth() + 1)+'-'+dateFormat1.getDate()},
      // warranty_period: {value: ''},
      // warranty_endDate: {value: ''},
      // toastcam_bizUserId: {value: ''},
      // churn_type: {value: ''},
      // use_stopDate: {value: ''},
      // use_endDate: {value: ''},
      pkgid: {value: shipRecord.member_id.value},
      deviceInfo: []
    }
  };
  // シリアル情報取得＆再作成
  let snTableValue = shipRecord[snTableName].value;
  for(let i in snTableValue){
		snumsInfo.shipInfo.deviceInfo.push({
			sys_mId: {value: snTableValue[i].value.sys_mId.value},
			mCode: {value: snTableValue[i].value.mCode.value},
			shipNum: {value: snTableValue[i].value.shipNum.value},
			cmsID: {value: ""},
		});
		// シリアル情報処理
		snumsInfo.serial[snTableValue[i].value.sNum.value]={sNum: snTableValue[i].value.sNum.value, sInfo: i};
  }
  console.log(snumsInfo);
  console.log('end construction Serial Number Data');
	return snumsInfo;
}

/**
 * シリアル番号状態に基づく情報記録
 * @param {string} checkType
 *  - newship			新品のみ出荷可能
 *  - recycle			再生品のみ出荷可能
 *  - auto				新品＆再生品出荷可能
 *  - internal		「auto」＋社内用出荷可能
 *  - between		  「internal」＋故障品、判定不可出荷可能
 *  - all					全部出荷可能
 * @param {object} sNums
 * @returns response
 * @author Jay
 * 入力例
 *  - {
 *  -   serial:{
 *  -     tests01: {sNum: 'tests01', sInfo: 0},
 *  -     tests02: {sNum: 'tests02', sInfo: 0},
 *  -     tests04: {sNum: 'tests04', sInfo: 1},
 *  -     tests05: {sNum: 'tests05', sInfo: 1}
 *  -   },
 *  -   shipInfo: {
 *  -     fCode: {value: ''},
 *  -     deviceInfo:[
 *  -       {mCode: {value: 'code1'}, memo:{ value: 'text'}},
 *  -       {mCode: {value: 'code2'}, memo:{ value: 'texttt'}}
 *  -       ]
 *  -   }
 *  - }
 * レスポンス例
 *  - {
 *  - 	result: true,
 *  - 	apiData:{
 *  - 		create: {requestBody: createBody, response: response_POST},
 *  - 		update: {requestBody: updateBody, response: response_PUT}
 *  - 	},
 *  - 	shipData:{
 *  - 		newship:{
 *  - 			品目コード: {mcode: 品目コード, num: 出荷数},
 *  - 			品目コード: {mcode: 品目コード, num: 出荷数},
 *  - 		},
 *  - 		recycle:{
 *  - 			品目コード: {mcode: 品目コード, num: 出荷数},
 *  - 			品目コード: {mcode: 品目コード, num: 出荷数},
 *  - 		}
 *  - 	}
 *  - }
 */
async function ctl_sNum(checkType, sNums){
	console.log('start Serial control');
  // シリアル番号Jsonを配列に変更
  let sNumsSerial = Object.values(sNums.serial);
	// パラメータエラー確認
	if(sNumsSerial.length==0){
		console.log('stop Serial control');
		return {result: false, error: {target: '', code: 'sn_nosnum'}};
	}
	if(!checkType.match(/newship|recycle|auto|internal|all/)){
		console.log('stop Serial control');
		return {result: false, error: {target: '', code: 'sn_wrongchecktype'}};
	}
	if(!sNums.shipInfo){
		console.log('stop Serial control');
		return {result: false, error: {target: '', code: 'sn_noshininfo'}};
	}
	// リクエストしたシリアル数と処理ずみシリアル数を比較するためのパラメータ
	let processedNum=0;
  // シリアル配列からquery用テキスト作成
  let sNum_queryText=null;
  for(let i in sNumsSerial){
    if(sNum_queryText==null) sNum_queryText = '"'+sNumsSerial[i].sNum+'"';
    else sNum_queryText += ',"' + sNumsSerial[i].sNum + '"';
  }
	// 入力シリアル番号のレコード情報取得
  let snRecords = (await getRecords({app: sysid.DEV.app_id.sNum, filterCond: 'sNum in (' + sNum_queryText + ')'})).records;
	console.log(snRecords);
	// シリアル管理更新データ、シリアル管理新規データ、製品状態別各品目の出荷数
	let updateBody={app:sysid.DEV.app_id.sNum, records:[]}
	let createBody={app:sysid.DEV.app_id.sNum, records:[]}
	let shipData={newship:{}, recycle:{}};
	// 既存のシリアル番号で出荷可能可否を確認し、更新用bodyを作成する
	let set_updateRecord
	for(let i in snRecords){
		let snRecord=snRecords[i];
		// 製品状態が出荷可能かチェック
		// let checkSNstatus = {booblean: new Boolean(), checkType: null};
		let checkSNstatus = null;
		if(checkType == 'newship' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'recycle' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'auto' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'auto' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'internal' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'internal' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'internal' && snRecord.sState.value == '社内用') checkSNstatus = 'recycle';
		else if(checkType == 'all' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'all' && snRecord.sState.value != '新品') checkSNstatus = 'recycle';
		else{
			console.log('stop Serial control');
			return {result: false,  error: {target: snRecord.sNum.value, code: 'sn_cannotuse'}};
		}
		// 出荷ロケーションチェック
		let checkSNshipment = new Boolean();
		// if(snRecord.sys_shipment_ID.value == sNums.shipInfo.shipment.value) checkSNshipment = true;
		// // 出荷ロケーションが空の場合処理続行 一時的
		// else if(snRecord.sys_shipment_ID.value == '') checkSNshipment = true;
		// else{
		// 	console.log('stop Serial control');
		// 	return {result: false,  error: {target: snRecord.sNum.value, code: 'sn_wrongshipment'}};
		// }
		// 出荷ロケーションをチェックしない 一時的
		checkSNshipment = true;
		// putBodyにレコードデータを格納
		set_updateRecord={
			id: snRecord.$id.value,
			record: {
				// sState: {value: '使用中'},
				// shipinfo: 'Ship Information Data',//tmp
				sendDate: sNums.shipInfo.sendDate,
				shipType: sNums.shipInfo.shipType,
				shipment: sNums.shipInfo.shipment,
				storageLocation: sNums.shipInfo.storageLocation,
				instName: sNums.shipInfo.instName,
				pkgid: sNums.shipInfo.pkgid,
				receiver: sNums.shipInfo.receiver,
				warranty_startDate: sNums.shipInfo.warranty_startDate,
				sys_history: snRecord.sys_history
			}
		};
		if(!sNums.shipInfo.shipType.value.match('移動')) set_updateRecord.record.sState = {value: '使用中'};
		set_updateRecord.record.sys_history.value.push({
			value:{
				sys_infoFrom: {
					value: kintone.app.getId()+'-'+kintone.app.record.getId()
				},
				sys_history_obj: {
					value: JSON.stringify({fromAppId: sNums.shipInfo.sendApp, checkType: checkType, checkSNstatus: checkSNstatus, lastState: snRecord.sState.value})
				}
			}
		});

		updateBody.records.push(set_updateRecord);
		// 新規＆リサイクル分類し品目コード別出荷数を計算
		let snCode=snRecord.mCode.value;
		let index_deviceInfo = sNums.serial[snRecord.sNum.value].sInfo;
		console.log(sNums);
		if(!shipData[checkSNstatus][snCode]) shipData[checkSNstatus][snCode] = {mCode: snCode, sys_mId: sNums.shipInfo.deviceInfo[index_deviceInfo].sys_mId.value, num: 0};
		shipData[checkSNstatus][snCode].num += 1;
		// sNumsから既存シリアル削除
		// sNums.splice(sNums.indexOf(snRecord.sNum.value), 1);
    delete sNums.serial[snRecord.sNum.value]
		// 処理済みシリアル数をカウント
		processedNum += 1;
	}
	// sNumsに未処理データがあるか否か
  let sNumsSerial_remaining = Object.values(sNums.serial);
	if(sNumsSerial_remaining.length>0){
		if(checkType == 'recycle'){
			console.log('stop Serial control');
			return {result: false,  error: {target: sNumsSerial_remaining[0].sNum, code: 'sn_cannotuse'}};
		}
		for(let i in sNumsSerial_remaining){
			let sinfo = sNums.serial[sNumsSerial_remaining[i].sNum].sInfo;
			let sNum_mCode = sNums.shipInfo.deviceInfo[sinfo].mCode;
			// postBodyにレコードデータを格納
			if(sNumsSerial[i].sNum){
				let push_record = {
					sNum: {value: sNumsSerial[i].sNum},
					// sState: {value: '使用中'},
					accessorieSerial: {value: ''},
					macaddress: {value: ''},
					mCode: sNum_mCode,
					sendDate: sNums.shipInfo.sendDate,
					shipType: sNums.shipInfo.shipType,
					shipment: sNums.shipInfo.shipment,
					storageLocation: sNums.shipInfo.storageLocation,
					instName: sNums.shipInfo.instName,
					pkgid: sNums.shipInfo.pkgid,
					receiver: sNums.shipInfo.receiver,
					warranty_startDate: sNums.shipInfo.warranty_startDate,
					use_stopDate: {value: ''},
					use_endDate: {value: ''},
					sys_history: {
						value: [
							{value: {sys_history_obj: {value: JSON.stringify({fromAppId: sNums.shipInfo.sendApp, checkType: checkType, checkSNstatus: 'newship', lastState: 'none'})}}}
						]
					}
				}
				if(sNums.shipInfo.shipType.value.match('移動')) set_updateRecord.record.sState = {value: '新品'};
				else set_updateRecord.record.sState = {value: '使用中'};
				createBody.records.push(push_record);
			}
				// 新規品目コード別出荷数を計算
				if(!shipData.newship[sNum_mCode.value]) shipData.newship[sNum_mCode.value] = {mCode: sNum_mCode.value, sys_mId: sNums.shipInfo.deviceInfo[sinfo].sys_mId.value, num: 0};
				shipData.newship[sNum_mCode.value].num += 1;
				// 処理済みシリアル数をカウント
				processedNum += 1;
		}
	}
	let checkSNfinal = new Boolean();
	checkSNfinal = sNumsSerial.length == processedNum;
	if(checkSNfinal){
		// 処理結果書き込み
		let response_PUT={};
		let response_POST={};
		console.log(updateBody);
		console.log(createBody);
		if(updateBody.records.length>0) response_PUT = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody);
		if(createBody.records.length>0) response_POST = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'POST', createBody);
		console.log('end Serial control');
		return {
			result: true,
			apiData:{
				create: {requestBody: createBody, response: response_POST},
				update: {requestBody: updateBody, response: response_PUT}
			},
			shipData: shipData
		};
	}
	console.log('unknow error, Serial control');
	return {result: false, error:  {target: '', code: 'sn_unknow'}};
}

async function ctl_sNumv2(checkType, sNums){
	console.log('start Serial control');
	console.log(sNums);
  // シリアル番号Jsonを配列に変更
  let sNumsSerial = Object.values(sNums.serial);
	console.log(sNumsSerial);
	// パラメータエラー確認
	if(sNumsSerial.length==0){
		console.log('stop Serial control');
		return {result: false, error: {target: '', code: 'sn_nosnum'}};
	}
	if(!checkType.match(/newship|recycle|auto|internal|all|between/)){
		console.log('stop Serial control');
		return {result: false, error: {target: '', code: 'sn_wrongchecktype'}};
	}
	if(!sNums.shipInfo){
		console.log('stop Serial control');
		return {result: false, error: {target: '', code: 'sn_noshininfo'}};
	}
	// リクエストしたシリアル数と処理ずみシリアル数を比較するためのパラメータ
	let processedNum=0;
  // シリアル配列からquery用テキスト作成
  let sNum_queryText=null;
  for(let i in sNumsSerial){
    if(sNum_queryText==null) sNum_queryText = '"'+sNumsSerial[i].sNum+'"';
    else sNum_queryText += ',"' + sNumsSerial[i].sNum + '"';
  }
	// 入力シリアル番号のレコード情報取得
  let snRecords = (await getRecords({app: sysid.DEV.app_id.sNum, filterCond: 'sNum in (' + sNum_queryText + ')'})).records;
	console.log(snRecords);
	// シリアル管理更新データ、シリアル管理新規データ、製品状態別各品目の出荷数
	let updateBody={app:sysid.DEV.app_id.sNum, records:[]}
	let createBody={app:sysid.DEV.app_id.sNum, records:[]}
	let shipData={newship:{}, recycle:{}};
	// 既存のシリアル番号で出荷可能可否を確認し、更新用bodyを作成する
	for(let i in snRecords){
		let snRecord=snRecords[i];
		// 製品状態が出荷可能かチェック
		// let checkSNstatus = {booblean: new Boolean(), checkType: null};
		let checkSNstatus = null;
		if(checkType == 'newship' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'recycle' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'auto' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'auto' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'internal' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'internal' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'internal' && snRecord.sState.value == '社内用') checkSNstatus = 'recycle';
		else if(checkType == 'between' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'between' && snRecord.sState.value == '再生品') checkSNstatus = 'recycle';
		else if(checkType == 'between' && snRecord.sState.value == '社内用') checkSNstatus = 'recycle';
		else if(checkType == 'between' && snRecord.sState.value == '故障品') checkSNstatus = 'recycle';
		else if(checkType == 'between' && snRecord.sState.value == '判定不可') checkSNstatus = 'recycle';
		else if(checkType == 'all' && snRecord.sState.value == '新品') checkSNstatus = 'newship';
		else if(checkType == 'all' && snRecord.sState.value != '新品') checkSNstatus = 'recycle';
		else{
			console.log('stop Serial control');
			return {result: false,  error: {target: snRecord.sNum.value, code: 'sn_cannotuse'}};
		}
		// 出荷ロケーションチェック
		let checkSNshipment = new Boolean();
		// if(snRecord.sys_shipment_ID.value == sNums.shipInfo.shipment.value) checkSNshipment = true;
		// // 出荷ロケーションが空の場合処理続行 一時的
		// else if(snRecord.sys_shipment_ID.value == '') checkSNshipment = true;
		// else{
		// 	console.log('stop Serial control');
		// 	return {result: false,  error: {target: snRecord.sNum.value, code: 'sn_wrongshipment'}};
		// }
		// 出荷ロケーションをチェックしない 一時的
		checkSNshipment = true;
		// putBodyにレコードデータを格納
		let set_updateRecord={
			id: snRecord.$id.value,
			record: {
				// sState: {value: '使用中'},
				// shipinfo: 'Ship Information Data',//tmp
				sendDate: sNums.shipInfo.sendDate,
				shipType: sNums.shipInfo.shipType,
				shipment: sNums.shipInfo.shipment,
				storageLocation: sNums.shipInfo.storageLocation,
				instName: sNums.shipInfo.instName,
				pkgid: sNums.shipInfo.pkgid,
				receiver: sNums.shipInfo.receiver,
				warranty_startDate: sNums.shipInfo.warranty_startDate,
				sys_history: snRecord.sys_history
			}
		};
		if(!sNums.shipInfo.shipType.value.match('移動')) set_updateRecord.record.sState = {value: '使用中'};
		// cmsSetup
		for(const snum of sNumsSerial){
			if(snRecord.sNum.value == snum.sNum){
				set_updateRecord.record.cmsID = sNums.shipInfo.deviceInfo[snum.sInfo].cmsID
			}
		}
		set_updateRecord.record.sys_history.value.push({
			value:{
				sys_infoFrom: {
					value: kintone.app.getId()+'-'+kintone.app.record.getId()
				},
				sys_history_obj: {
					value: JSON.stringify({fromAppId: sNums.shipInfo.sendApp, checkType: checkType, checkSNstatus: checkSNstatus, lastState: snRecord.sState.value})
				}
			}
		});

		updateBody.records.push(set_updateRecord);
		// 新規＆リサイクル分類し品目コード別出荷数を計算
		let snCode=snRecord.mCode.value;
		let index_deviceInfo = sNums.serial[snRecord.sNum.value].sInfo;
		if(!shipData[checkSNstatus][snCode]) shipData[checkSNstatus][snCode] = {mCode: snCode, sys_mId: sNums.shipInfo.deviceInfo[index_deviceInfo].sys_mId.value, num: 0};
		shipData[checkSNstatus][snCode].num += 1;
		// sNumsから既存シリアル削除
		// sNums.splice(sNums.indexOf(snRecord.sNum.value), 1);
    delete sNums.serial[snRecord.sNum.value]
		// 処理済みシリアル数をカウント
		processedNum += 1;
	}
	console.log(sNums);
	// sNumsに未処理データがあるか否か
  let sNumsSerial_remaining = Object.values(sNums.serial);
	if(sNumsSerial_remaining.length>0){
		if(checkType == 'recycle'){
			console.log('stop Serial control');
			return {result: false,  error: {target: sNumsSerial_remaining[0].sNum, code: 'sn_cannotuse'}};
		}
		for(let i in sNumsSerial_remaining){
			let sinfo = sNums.serial[sNumsSerial_remaining[i].sNum].sInfo;
			console.log(sNums.shipInfo.deviceInfo[sinfo]);
			let sNum_mCode = sNums.shipInfo.deviceInfo[sinfo].mCode;
			let sNum_cmsCode = sNums.shipInfo.deviceInfo[sinfo].cmsID;
			// let sNum_sys_mId = sNums.shipInfo.deviceInfo[sinfo].sys_mId;
			// postBodyにレコードデータを格納
			if(sNumsSerial_remaining[i].sNum){
				let push_record = {
					sNum: {value: sNumsSerial_remaining[i].sNum},
					// sState: {value: '使用中'},
					accessorieSerial: {value: ''},
					macaddress: {value: ''},
					mCode: sNum_mCode,
					sendDate: sNums.shipInfo.sendDate,
					shipType: sNums.shipInfo.shipType,
					shipment: sNums.shipInfo.shipment,
					storageLocation: sNums.shipInfo.storageLocation,
					instName: sNums.shipInfo.instName,
					pkgid: sNums.shipInfo.pkgid,
					receiver: sNums.shipInfo.receiver,
					warranty_startDate: sNums.shipInfo.warranty_startDate,
					cmsID: sNum_cmsCode,
					use_stopDate: {value: ''},
					use_endDate: {value: ''},
					sys_history: {
						value: [
							{value: {sys_history_obj: {value: JSON.stringify({fromAppId: sNums.shipInfo.sendApp, checkType: checkType, checkSNstatus: 'newship', lastState: 'none'})}}}
						]
					}
					// sys_obj_sn: {fromApp: 9999, checkType: checkType, checkSNstatus: 'newship', lastState: 'none'}
				};
				if(sNums.shipInfo.shipType.value.match('移動')) push_record.sState = {value: '新品'};
				else push_record.sState = {value: '使用中'};
				createBody.records.push(push_record);
			}
				// 新規品目コード別出荷数を計算
				if(!shipData.newship[sNum_mCode.value]) shipData.newship[sNum_mCode.value] = {mCode: sNum_mCode.value, sys_mId: sNums.shipInfo.deviceInfo[sinfo].sys_mId.value, num: 0};
				shipData.newship[sNum_mCode.value].num += 1;
				// 処理済みシリアル数をカウント
				processedNum += 1;
		}
	}
	let checkSNfinal = new Boolean();
	checkSNfinal = sNumsSerial.length == processedNum;
	if(checkSNfinal){
		// 処理結果書き込み
		let response_PUT=[];
		let response_POST=[];
		console.log(updateBody);
		console.log(createBody);
		if(updateBody.records.length > 0){
			let x = 0
			while(x < updateBody.records.length){
				let updateBody_slice100 = {app:sysid.DEV.app_id.sNum, records:[]}
				if(x > updateBody.records.length-100){
					updateBody_slice100.records = updateBody.records.slice(x, x + updateBody.records.length%100);
				}else{
					updateBody_slice100.records = updateBody.records.slice(x, x + 100);
				}
				console.log(updateBody_slice100);
				response_PUT.push(await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', updateBody_slice100));
				x += 100;
			}
		}
		if(createBody.records.length > 0){
			let x = 0
			while(x < createBody.records.length){
				let createBody_slice100 = {app:sysid.DEV.app_id.sNum, records:[]}
				if(x > createBody.records.length-100){
					createBody_slice100.records = createBody.records.slice(x, x + createBody.records.length%100);
				}else{
					createBody_slice100.records = createBody.records.slice(x, x + 100);
				}
				console.log(createBody_slice100);
				response_POST.push(await kintone.api(kintone.api.url('/k/v1/records.json', true), 'POST', createBody_slice100));
				x += 100;
			}
		}
		console.log('end Serial control');
		return {
			result: true,
			apiData:{
				create: {requestBody: createBody, response: response_POST},
				update: {requestBody: updateBody, response: response_PUT}
			},
			shipData: shipData
		};
	}
	console.log('unknow error, Serial control');
	return {result: false, error:  {target: '', code: 'sn_unknow'}};
}

/**
 * 在庫処理
 * @param {*} params ctl_sNum(returns).shipData
 * @returns
 * @author Jay
 * 入力例
 * ctl_stock(event.record, snCTL_result.shipData);
 */
/*
async function ctl_stock(eRecord, params){
	const shipmentInfo = doAcction_stockMGR(eRecord);
	// エラー処理
	if(!shipmentInfo.result) return shipmentInfo;
	// 返却値代入
	const shipLoction = shipmentInfo.value.ship;
	const destLoction = shipmentInfo.value.dest;
	const type = shipmentInfo.value.type;
	// 在庫処理
	// 出荷情報再作成
	const shipdata_newship = Object.values(params.newship);
	const shipdata_recycle = Object.values(params.recycle);
	const unitStock_shipInfo = shipdata_newship.concat(shipdata_recycle);
	const allship = Object.assign(params.newship,params.recycle);


	console.log('shipdata_newship: ');
	console.log(shipdata_newship);
	console.log('shipdata_recycle: ');
	console.log(shipdata_recycle);
	console.log('unitStock_shipInfo: ');
	console.log(unitStock_shipInfo);
	console.log('allship: ');
	console.log(allship);

	// 拠点レコード取得
	let getUnitQuery_uCode = null;
	if(shipLoction) getUnitQuery_uCode = '"'+shipLoction+'"';
	if(destLoction) getUnitQuery_uCode += ', "'+destLoction+'"';

	console.log('getUnitQuery_uCode: ');
	console.log(getUnitQuery_uCode);
	console.log('uCode in (' + getUnitQuery_uCode + ')');

	const unitRecords = (await getRecords({
		app: sysid.INV.app_id.unit,
		filterCond: 'uCode in (' + getUnitQuery_uCode + ')'
	})).records;

	console.log('unitRecords: ');
	console.log(unitRecords);

	// 出荷拠点と入荷拠点のレコード情報を取得する
	const uRecord_ship = (unitRecords.filter(r => r.uCode.value == shipLoction))[0];
	const uRecord_dest = (unitRecords.filter(r => r.uCode.value == destLoction))[0];


	console.log('uRecord_ship: ');
	console.log(uRecord_ship);
	console.log('uRecord_dest: ');
	console.log(uRecord_dest);

	// エラー処理
	if(!uRecord_ship) return {result: false, error:  {target: 'unitStock', code: 'unit_failgetshipunit'}};
	if(type == 'out' && !uRecord_dest) return {result: false, error:  {target: 'unitStock', code: 'unit_filegetdestunit'}};


	// 拠点アップデート用Body初期化
	let unitBody = {app: sysid.INV.app_id.unit, records: []};
	// 拠点出荷処理
	let unitBody_ship = {
		id: uRecord_ship.$id.value,
		record: {
			mStockList: {
				value: []
			}
		}
	}
	// サブテーブル内品目情報取得
	// 取得した品目情報から処理用データ作成
	let tableValue_ship = getTableIndex(uRecord_ship.mStockList.value);
	// 出荷した品目数と拠点を確認し計算
	unitStock_shipInfo.forEach(function(shipList){
		// 出荷品目コード
		let ship_mcode = shipList.mCode;
		if(ship_mcode){
			console.log(shipList);
			console.log(ship_mcode);
			// テーブルindex
			let tableList_index = tableValue_ship[ship_mcode].index;

			let tableList_value = tableValue_ship[ship_mcode].value;
			unitBody_ship.record.mStockList.value[tableList_index] = {
				value: {
					mStock: {value: tableList_value.mStock.value - allship[ship_mcode].num}
				}
			};
		}
	});


	console.log('unitBody_ship: ');
	console.log(unitBody_ship);

	// エラー処理　処理結果
	if(unitBody_ship.record.mStockList.value.length != unitStock_shipInfo.length) return {result: false, error:  {target: 'unitStock', code: 'unit_unmachshipnum'}};
	unitBody.records.push(unitBody_ship);

	// 拠点入荷処理（入荷拠点がある場合のみ実行）
	if(uRecord_dest){
		let unitBody_dest = {
			id: uRecord_dest.$id.value,
			record: {
				mStockList: {
					value: []
				}
			}
		}
		// サブテーブル内品目情報取得
		let tableValue_ship = getTableIndex(uRecord_ship.mStockList.value);
		// 出荷した品目数と拠点を確認し計算
		// unitStock_shipInfo.forEach(function(shipList){
		// 	let tableList_value = tableValue_ship[shipList.mCode].value;
		// 	let tableList_index = tableValue_ship[shipList.mCode].index;
		// 	unitBody_ship.record.mStockList.value[tableList_index] = {
		// 		value: {
		// 			mStock: {value: tableList_value.mStock.value - allship[shipList.mCode].num}
		// 		}
		// 	};
		// });
		// 取得した品目情報から処理用データ作成
		let mstocklist_dest=uRecord_dest.mStockList.value;
		// テーブル行を比較しマッチするものがあれば更新処理用データを作成
		mstocklist_dest.forEach(function(list){
			let mcode = list.value.mCode.value;
			if(mcode.match(new RegExp('/^(' + query_unitStock + ')$/'))){
				unitBody_dest.record.mStockList.value.push({
					id: list.id,
					value: {
						mStock: {
							value: list.value.mStock.value + allship[mcode].num
						}
					}
				});
			}
		});


		console.log('unitBody_dest: ');
		console.log(unitBody_dest);

		// エラー処理 処理結果
		if(unitBody_dest.record.mStockList.value.length != unitStock_shipInfo.length) return {result: false, error:  {target: 'unitStock', code: 'unit_unmachdestnum'}};
		unitBody.records.push(unitBody_dest);
	}


	else console.log('入荷ロケが指定されてないため入荷処理は実行しません。');


	console.log('unitBody: ');
	console.log(unitBody);

	let unitResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', unitBody);
	return {result: true, unitResult};

}
*/
// ctl_stock({
// 	shipType: '',
// 	shipmentId: '',
// 	destinationId: '',
// 	shipData: shipData
// })
async function ctl_stock(parms){
	// 情報確認
	// if(!parms.shipType) return {result: false, error: {target: 'Unit CTL', code: ''}};
	if(!parms.shipmentId) return {result: false, error: {target: 'Unit CTL', code: 'needshipmentId'}};
	if(!parms.destinationId) return {result: false, error: {target: 'Unit CTL', code: 'needdestinationId'}};

	// 拠点出荷用データ初期設定
	let updatteTable_shipmentParm = {
		appid: sysid.INV.app_id.unit,
		recordid: parms.shipmentId,
		tar_tableCode: 'mStockList',
		tar_tableValue: {
			tar_listCode: 'mCode',
			tar_listValue: {

			}
		}
	};

	// 拠点入荷用データ初期設定
	let updatteTable_destinationParm = {
		appid: sysid.INV.app_id.unit,
		recordid: parms.destinationId,
		tar_tableCode: 'mStockList',
		tar_tableValue: {
			tar_listCode: 'mCode',
			tar_listValue: {

			}
		}
	};

	// 拠点入出荷用データ作成
	const newShip = parms.shipData.newship;
	const newShipKeys = Object.keys(newShip);
	newShipKeys.forEach(mcode => {
		updatteTable_shipmentParm.tar_tableValue.tar_listValue[mcode] = {
			mStock: {operator: '-', value: newShip[mcode].num}
		};
		updatteTable_destinationParm.tar_tableValue.tar_listValue[mcode] = {
			mStock: {operator: '+', value: newShip[mcode].num}
		};
	// }
	});

	// 拠点入出荷実行
	console.log(updatteTable_shipmentParm);
	console.log(updatteTable_destinationParm);
	let resultShipment = await updateTable(updatteTable_shipmentParm, true);
	let resultDestination = await updateTable(updatteTable_destinationParm, true);
	if(!(resultShipment.result || resultDestination.result)) return {result: false, shipment: resultShipment, destination: resultDestination}
	return {result: true, shipment: resultShipment, destination: resultDestination}
}

async function ctl_stock_v2(eRecord, params, sys_destinationId, sys_shipmentId){
	try{
		// 在庫処理
		const shipdata_newship = Object.values(params.newship);
		const shipdata_recycle = Object.values(params.recycle);

		console.log('shipdata_newship: ');
		console.log(shipdata_newship);
		console.log('shipdata_recycle: ');
		console.log(shipdata_recycle);

		// 新品がなかった場合処理終了
		if(shipdata_newship.length<1){
			return {result: false, error: {target: 'ctl_stock_v2', code: 'ctl_stock_v2_notNewShip'}};
		}

		// 入荷用処理（新品のみ）
		if(sys_destinationId){
			for(const arrivaldata of shipdata_newship){
				let arrivalJson = {
					app: sysid.INV.app_id.unit,
					id: sys_destinationId,
					sbTableCode: 'mStockList',
					listCode: 'mCode',
					listValue:{}
				}
				arrivalJson.listValue[arrivaldata.mCode]={
					updateKey_listCode: arrivaldata.mCode,
					updateKey_listValue:{
						'mStock':{
							updateKey_cell: 'mStock',
							operator: '+',
							value: arrivaldata.num
						},
					}
				}
				let arrivalResult = await update_sbTable(arrivalJson);
				if(!arrivalResult.result){
					alert('入荷用在庫連携のAPIが失敗しました');
					console.log(arrivalResult);
					return {result: false, error: {target: 'ctl_stock_v2', code: 'ctl_stock_v2_arrival-updateError'}};
				}
			}
		}

		// 出荷用処理（新品のみ）
		if(sys_shipmentId){
			for(const shipdata of shipdata_newship){
				let shippingJson = {
					app: sysid.INV.app_id.unit,
					id: sys_shipmentId,
					sbTableCode: 'mStockList',
					listCode: 'mCode',
					listValue:{}
				}
				shippingJson.listValue[shipdata.mCode]={
					updateKey_listCode: shipdata.mCode,
					updateKey_listValue:{
						'mStock':{
							updateKey_cell: 'mStock',
							operator: '-',
							value: shipdata.num
						},
					}
				}
				let shippingResult = await update_sbTable(shippingJson)
				if(!shippingResult.result){
					console.log(shippingResult);
					alert('出荷用在庫連携のAPIが失敗しました');
					return {result: false, error: {target: 'ctl_stock_v2', code: 'ctl_stock_v2_shipping-updateError'}};
				}
			}
		}

		console.log('ctl_stock_v2成功');
    return {result: true, error: {target: 'ctl_stock_v2', code: 'ctl_stock_v2_success'}};
	} catch(e) {
		alert('在庫連携で不明なエラーが発生しました');
		console.error(e);
    return {result: false, message: e, error: {target: 'ctl_stock_v2', code: 'ctl_stock_v2_unknownError'}};
	}
}

/**
 *
 * @param {*} eRecord
 * @param {*} params
 * @returns
 */
// ctl_report({
// 	shipType: '',
// 	recordId: '',
// 	shipmentId: '',
// 	destinationId: '',
// 	shipData: shipData
// })
async function ctl_report(parms){
	// 情報確認
	// if(!parms.shipType) return {result: false, error: {target: 'report CTL', code: ''}};
	if(!parms.recordId) return {result: false, error: {target: 'report CTL', code: ''}};
	if(!parms.shipmentId) return {result: false, error: {target: 'report CTL', code: ''}};
	if(!parms.destinationId) return {result: false, error: {target: 'report CTL', code: ''}};

	// レポート入出荷用データ初期設定
	let updatteTable_reportParm = {
		appid: sysid.INV.app_id.report,
		recordid: parms.recordId,
		tar_tableCode: 'inventoryList',
		tar_tableValue: {
			tar_listCode: 'sys_rId',
			tar_listValue: {}
		}
	};


	// 拠点入出荷用データ作成
	const newShip = parms.shipData.newship;
	const newShipKeys = Object.keys(newShip);
	newShipKeys.forEach(mcode => {
		let tar_shipValue = newShip[mcode].sys_mId + '_' + parms.shipmentId;
		let tar_destValue = newShip[mcode].sys_mId + '_' + parms.destinationId;
		// 出荷
		updatteTable_reportParm.tar_tableValue.tar_listValue[tar_shipValue] = {
			shipNum: {operator: '+', value: newShip[mcode].num},
			sys_rId: {operator: '$', value: tar_shipValue},
			sys_mId: {operator: '$', value: newShip[mcode].sys_mId},
			sys_uId: {operator: '$', value: parms.shipmentId},
			sys_code: {operator: '$', value: mcode + '-' + parms.shipmentCode}
		};
		// 入荷
		updatteTable_reportParm.tar_tableValue.tar_listValue[tar_destValue] = {
			arrivalNum: {operator: '+', value: newShip[mcode].num},
			sys_rId: {operator: '$', value: tar_destValue},
			sys_mId: {operator: '$', value: newShip[mcode].sys_mId},
			sys_uId: {operator: '$', value: parms.destinationId},
			sys_code: {operator: '$', value: mcode + '-' + parms.destinationCode}
		};
	});
	console.log(updatteTable_reportParm);
	let resultReport = await updateTable(updatteTable_reportParm, true);
	if(!resultReport.result) return {result: false, report: updatteTable_reportParm}
	return {result: true, report: resultReport}

	// const shipmentInfo = doAcction_stockMGR(eRecord);
	// // エラー処理
	// if(!shipmentInfo.result) return shipmentInfo;
	// // 返却値代入
	// const shipLoction = shipmentInfo.value.ship;
	// const destLoction = shipmentInfo.value.dest;
	// const type = shipmentInfo.value.type;

	// // 在庫処理
	// /** */
	// console.log('params: ');
	// console.log(params);


	// // 該当月のレポート詳細を取得
	// let thisYears = formatDate(new Date(eRecord.sendDate.value), 'YYYY');
	// let thisMonth = formatDate(new Date(eRecord.sendDate.value), 'MM');
	// let getReportQuery = {
	// 	app: sysid.INV.app_id.report,
	// 	query: 'sys_invoiceDate = "' + thisYears + thisMonth + '"'
	// };

	// /** */
	// console.log(getReportQuery);

	// const get_reportRecords = (await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReportQuery)).records;
	// // エラー処理、該当月のレポートが複数存在する場合
	// if(get_reportRecords.length>1) return {result: false, error: {target: 'report', code: 'report_multtiple'}};
	// let reportRecord = get_reportRecords[0];

	// // レポート入出荷処理
	// // 該当月のレポートが見つからない場合、レポート新規作成
	// if(!reportRecord) reportRecord = await create_report(thisYears, thisMonth);

	// /** */
	// console.log('reportRecord: ');
	// console.log(reportRecord);

	// let reportBody = {
	// 	app: sysid.INV.app_id.report,
	// 	id: reportRecord.$id.value,
	// 	record: {
	// 		inventoryList: {
	// 			value: []
	// 		}
	// 	}
	// };

	// // サブテーブル情報取得
	// let reportTable = getTableId(reportRecord.inventoryList.value);

	// /** */
	// console.log('reportTable: ');
	// console.log(reportTable);

	// // 新規出荷更新
	// params.forEach(function(list){
	// 	// 出荷処理
	// 	// 在庫一覧システムコード生成
	// 	let sysCode_ship = list.mCode + '-' + shipLoction;
	// 	// 計算処理
	// 	if(reportTable){
	// 		let shipnum = reportTable[sysCode_ship].value.shipNum.value - list.num;
	// 		reportBody.record.inventoryList.value.push({
	// 			id: reportTable[sysCode_ship].id,
	// 			value: {
	// 				shipNum: {value: shipnum}
	// 			}
	// 		});
	// 	}else{
	// 		reportBody.record.inventoryList.value.push({
	// 			value: {
	// 				sys_code: {value: sysCode_ship},
	// 				shipNum: {value: list.num}
	// 			}
	// 		});
	// 	}
	// 	// 入荷処理（入荷処理が必要な場合のみ実行）
	// 	if(!type == 'out'){
	// 		// 在庫一覧システムコード生成
	// 		let sysCode_dest = list.mCode + '-' + destLoction;
	// 		// 計算処理
	// 		if(reportTable[sysCode_dest]){
	// 			let arrivalnum = reportTable[sysCode_dest].value.arrivalNum.value + list.num;
	// 			reportBody.record.inventoryList.value.push({
	// 				id: reportTable[sysCode_dest].id,
	// 				value: {
	// 					arrivalNum: {value: arrivalnum}
	// 				}
	// 			});
	// 		}else{
	// 			reportBody.record.inventoryList.value.push({
	// 				value: {
	// 					sys_code: {value: sysCode_dest},
	// 					arrivalNum: {value: list.num}
	// 				}
	// 			});
	// 		}
	// 	}
	// });

	// /** */
	// console.log('reportBody: ');
	// console.log(reportBody);

	// // let reportResult = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', reportBody);
	// // return レポート処理結果
}

async function ctl_report_v2(eRecord, params, sys_shipmentCode, sys_destinationCode){
	// 在庫処理
	const shipdata_newship = Object.values(params.newship);

	// 該当月のレポート詳細を取得
	let thisYears = formatDate(new Date(eRecord.sendDate.value), 'YYYY');
	let thisMonth = formatDate(new Date(eRecord.sendDate.value), 'MM');
	let getReportQuery = {
		app: sysid.INV.app_id.report,
		query: 'sys_invoiceDate = "' + thisYears + thisMonth + '"'
	};

	console.log(getReportQuery);

	const get_reportRecords = (await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReportQuery)).records;
	// エラー処理、該当月のレポートが複数存在する場合
	if(get_reportRecords.length>1) return {result: false, error: {target: 'report', code: 'report_multtiple'}};
	let reportRecord = get_reportRecords[0];

	// レポート入出荷処理
	// 該当月のレポートが見つからない場合、レポート新規作成
	if(!reportRecord) reportRecord = await create_report(thisYears, thisMonth);

	for(const deviceList of shipdata_newship){
		// レポート在庫連携用json作成
		let reportStockJson = {
			app: sysid.INV.app_id.report,
			id: reportRecord.$id.value,
			sbTableCode: 'inventoryList',
			listCode: 'sys_code',
			listValue:{}
		}
		if(sys_destinationCode){
			// 入荷用データ
			reportStockJson.listValue[deviceList.mCode+'-'+sys_destinationCode]={
				updateKey_listCode: deviceList.mCode+'-'+sys_destinationCode,
				updateKey_listValue:{
					'arrivalNum':{
						updateKey_cell: 'arrivalNum',
						operator: '+',
						value: parseInt(deviceList.num)
					},
				}
			}
		}
		if(sys_shipmentCode){
			// 出荷用データ
			reportStockJson.listValue[deviceList.mCode+'-'+sys_shipmentCode]={
				updateKey_listCode: deviceList.mCode+'-'+sys_shipmentCode,
				updateKey_listValue:{
					'shipNum':{
						updateKey_cell: 'shipNum',
						operator: '+',
						value: parseInt(deviceList.num)
					},
				}
			}
		}
		let reportResult_stock = await update_sbTable(reportStockJson)
		if(!reportResult_stock.result){
			alert('レポートの更新に失敗しました');
			return {result: false, error:  {target: 'ctl_report_v2', code: 'ctl_report_v2_report-updateError'}};
		}
	}
	console.log('レポート処理成功');
	return {result: true, error:  {target: 'ctl_report_v2', code: 'ctl_report_v2_success'}};
}

/**
 * 在庫変動時加減の判断
 * @param {*} eRecord
 * @returns
 * @author Jay
 */
function doAcction_stockMGR(eRecord){
	console.log(eRecord);
	let applicationType;
	if(eRecord.shipType) applicationType = eRecord.shipType.value;
	else if(eRecord.application_type) applicationType = eRecord.application_type.value;
	// エラー処理
	if(applicationType.match(/確認中/)) return {result: false, error:  {target: 'shipType', code: 'ship_unknowtype'}};
	if(eRecord.sys_shipmentCode.value == '') return {result: false, error:  {target: 'shipment', code: 'ship_unknowshipment'}};
	// 仕入
	if(applicationType.match(/仕入｜入荷/)) return {result: true, value: {ship: '', dest: hisRecord.sys_arrivalCode.value, type: 'add'}};
	// 積送に移動、全体在庫変更なし
	if(applicationType.match(/販売|サブスク/)) return {result: true, value: {ship: eRecord.sys_shipmentCode.value, dest: 'distribute', type: 'move'}};
	// 指定拠点へ移動、全体在庫変更なし
	else if(applicationType.match(/拠点間|ベンダー|社内利用|貸与/)) return {result: true, value: {ship: eRecord.sys_shipmentCode.value, dest: eRecord.sys_arrivalCode.value, type: 'move'}};
	// 指定拠点へ移動、出荷ロケからマイナス
	else if(applicationType.match(/修理|交換|返品/)) return {result: true, value: {ship: eRecord.sys_shipmentCode.value, dest: '', type: 'out'}};
	/*
	// return {result: true, value: {ship: , dest: , type: }};
	// atlas
	// 積送に移動、全体在庫変更なし
	else if(applicationType.match(/ass_新規申込|ass_デバイス追加/)) return {result: true, value: {ship: , dest: , type: 'move'}};
	// 故障交換（保証対象）（ASS）
	else if(applicationType.match(/ass_故障交換（保証対象）/)) return {result: true, value: {ship: , dest: , type: }};//指定拠点へ移動(回収)、出荷ロケからマイナス
	// 故障交換（保証対象外）（ASS）
	else if(applicationType.match(/ass_故障交換（保証対象外）/)) return {result: true, value: {ship: , dest: , type: }};//拠点移動なし、出荷ロケからマイナス
	*/
}

/**
 * 新規レポート作成 重複チェックなし
 * @param {*} years
 * @param {*} month
 * @returns number
 * @author Jay
 */
async function create_report(years, month){
	let newReport = {
		app: sysid.INV.app_id.report,
		record: {
			invoiceYears: {value: years},
			invoiceMonth: {value: month}
		}
	};
	console.log(newReport);
	let newReportId = (await kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', newReport)).id;
	console.log(newReportId);
	return (await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {app: sysid.INV.app_id.report, id: newReportId})).record;
}

/**
 * key情報からサブテーブルを更新するためのIDを取得
 * @param {*} tableValue
 * @returns json
 * @author Jay
 * レスポンス例
 *  - {
 *  - 	{ key1:{id: num, value: {table list value} },
 *  - 	{ key2:{id: num, value: {table list value} },
 *  - }
 */
function getTableId(tableValue){
	if(tableValue.length>0){
		let result = {};
		tableValue.forEach(list => result[list.value.sys_code.value] = {id: list.id, value: list.value});
		return result;
	}
	else return undefined;
}
function getTableIndex(tableValue){
	if(tableValue.length>0){
		let result = {};
		for(let i in tableValue){
			result[tableValue[i].value.mCode.value] = {index: i, value: tableValue[i].value}
		}
		return result;
	}
	else return undefined;
}
function setlog_new(event){
	let history = event.record.sys_log.value[0].value;
	history.sys_log_acction.value = 'create record';
	history.sys_log_value.value = JSON.stringify(event.record);
	return event;
}
async function setlog_single(value, setResult){
	let tableValue = (await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {app: kintone.app.getId(), id: kintone.app.record.getId()})).record.sys_log.value;
	console.log('tableValue: ');
	console.log(tableValue);
	let logBody = {
		app: kintone.app.getId(),
		id: kintone.app.record.getId(),
		record: {
			sys_log: {
				value: tableValue
			}
		}
	}
	if(tableValue.length < 2 && tableValue[0].sys_log_acction == '') logBody.record.sys_log.value[0] = value;
	else logBody.record.sys_log.value.push(value);
	if(setResult) logBody.record[setResult.fCode] = {value: setResult.value};
	console.log('setlog success');
	return await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', logBody);
}


/**
 * レポート処理
 * @param {*} event (json)
 * @param {*} appId (string) 変更データ取得するアプリID
 * @returns (json)
 * @author Jay(refactoring)
 */
async function reportCtrl(event, appId) {
	var stockData = createStockJson(event, appId);
	console.log(stockData);

	// ＞＞＞月次レポート情報取得＜＜＜
	// 月次レポートクエリ作成
	var getReportBody = {
		'app': sysid.INV.app_id.report,
		'query': 'sys_invoiceDate = "' + stockData.date + '" order by 更新日時 asc'
	};
	var reportRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReportBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	// 月次レポート情報取得 end＜＜＜

	// ＞＞＞レポート更新用情報作成＜＜＜
	var reportUpdateData = [];
	var getUniNameArray = [];
	var getDevNameArray = [];
	for (let i in stockData.arr) {
		var reportUpdateBody = {
			'arrOrShip': stockData.arr[i].arrOrShip,
			'sysCode': stockData.arr[i].devCode + '-' + stockData.arr[i].uniCode,
			'devCode': stockData.arr[i].devCode,
			'uniCode': stockData.arr[i].uniCode,
			'stockNum': stockData.arr[i].stockNum
		};
		getUniNameArray.push('"' + stockData.arr[i].uniCode + '"');
		getDevNameArray.push('"' + stockData.arr[i].devCode + '"');
		reportUpdateData.push(reportUpdateBody);
	}
	for (let i in stockData.ship) {
		var reportUpdateBody = {
			'arrOrShip': stockData.ship[i].arrOrShip,
			'sysCode': stockData.ship[i].devCode + '-' + stockData.ship[i].uniCode,
			'devCode': stockData.ship[i].devCode,
			'uniCode': stockData.ship[i].uniCode,
			'stockNum': stockData.ship[i].stockNum
		};
		if(typeof stockData.shipType !== "undefined"){
			reportUpdateBody.sysSTCode = stockData.ship[i].devCode + '-' + stockData.shipType
		}
		getUniNameArray.push('"' + stockData.ship[i].uniCode + '"');
		getDevNameArray.push('"' + stockData.ship[i].devCode + '"');
		reportUpdateData.push(reportUpdateBody);
	}
	getUniNameArray = Array.from(new Set(getUniNameArray));
	getDevNameArray = Array.from(new Set(getDevNameArray));

	//拠点名取得
	var getUnitBody = {
		'app': sysid.INV.app_id.unit,
		'query': 'uCode in (' + getUniNameArray.join() + ')'
	};
	var unitRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getUnitBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	for (let i in reportUpdateData) {
		for (let j in unitRecords.records) {
			if (reportUpdateData[i].uniCode == unitRecords.records[j].uCode.value) {
				reportUpdateData[i].uName = unitRecords.records[j].uName.value;
			}
		}
	}

	// 製品名取得
	var getDeviceBody = {
		'app': sysid.INV.app_id.device,
		'query': 'mCode in (' + getDevNameArray.join() + ')'
	};
	var deviceRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getDeviceBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	for (let i in reportUpdateData) {
		for (let j in deviceRecords.records) {
			if (reportUpdateData[i].devCode == deviceRecords.records[j].mCode.value) {
				reportUpdateData[i].mClassification = deviceRecords.records[j].mClassification.value;
				reportUpdateData[i].mType = deviceRecords.records[j].mType.value;
				reportUpdateData[i].mVendor = deviceRecords.records[j].mVendor.value;
				reportUpdateData[i].mName = deviceRecords.records[j].mName.value;
				reportUpdateData[i].mCost = deviceRecords.records[j].mCost.value;
			}
		}
	}
	// ＞＞＞レポート更新用情報作成 end＜＜＜

	if (reportRecords.records.length != 0) { //対応したレポートがある場合
		// 情報更新用配列
		var putReportData = [];
		//更新レポート情報作成
		var putReportBody = {
			'id': reportRecords.records[0].$id.value,
			'record': {
				'inventoryList': {'value': reportRecords.records[0].inventoryList.value},
				'shipTypeList': {'value': reportRecords.records[0].shipTypeList.value}
			}
		};
		for (let i in reportUpdateData) {
			if (putReportBody.record.inventoryList.value.some(item => item.value.sys_code.value === reportUpdateData[i].sysCode)) {
				for (let j in putReportBody.record.inventoryList.value) {
					if (putReportBody.record.inventoryList.value[j].value.sys_code.value == reportUpdateData[i].sysCode) {
						if (reportUpdateData[i].arrOrShip == 'ship') {
							putReportBody.record.inventoryList.value[j].value.shipNum.value = parseInt(putReportBody.record.inventoryList.value[j].value.shipNum.value || 0) + parseInt(reportUpdateData[i].stockNum || 0);
						} else if (reportUpdateData[i].arrOrShip == 'arr') {
							putReportBody.record.inventoryList.value[j].value.arrivalNum.value = parseInt(putReportBody.record.inventoryList.value[j].value.arrivalNum.value || 0) + parseInt(reportUpdateData[i].stockNum || 0);
						}
					}
				}
			} else {
				if (reportUpdateData[i].arrOrShip == 'ship') {
					var newReportListBody = {
						'value': {
							'sys_code': {'value': reportUpdateData[i].sysCode},
							'mClassification':{'value': reportUpdateData[i].mClassification},
							'mType':{'value': reportUpdateData[i].mType},
							'mVendor':{'value': reportUpdateData[i].mVendor},
							'mCode': {'value': reportUpdateData[i].devCode},
							'mName':{'value': reportUpdateData[i].mName},
							'stockLocation': {'value': reportUpdateData[i].uName},
							'shipNum': {'value': reportUpdateData[i].stockNum},
							'mCost': {'value': reportUpdateData[i].mCost}
						}
					};
				} else if (reportUpdateData[i].arrOrShip == 'arr') {
					var newReportListBody = {
						'value': {
							'sys_code': {'value': reportUpdateData[i].sysCode},
							'mClassification':{'value': reportUpdateData[i].mClassification},
							'mType':{'value': reportUpdateData[i].mType},
							'mVendor':{'value': reportUpdateData[i].mVendor},
							'mCode': {'value': reportUpdateData[i].devCode},
							'mName':{'value': reportUpdateData[i].mName},
							'stockLocation': {'value': reportUpdateData[i].uName},
							'arrivalNum': {'value': reportUpdateData[i].stockNum},
							'mCost': {'value': reportUpdateData[i].mCost}
						}
					};
				}
				putReportBody.record.inventoryList.value.push(newReportListBody);
			}

			// 出荷区分別一覧リスト設定
			if(typeof reportUpdateData[i].sysSTCode !== "undefined"){
				if(putReportBody.record.shipTypeList.value.some(item => item.value.sys_shiptypeCode.value === reportUpdateData[i].sysSTCode)){
					for (let j in putReportBody.record.shipTypeList.value) {
						if (putReportBody.record.shipTypeList.value[j].value.sys_shiptypeCode.value == reportUpdateData[i].sysSTCode) {
							putReportBody.record.shipTypeList.value[j].value.ST_shipNum.value = parseInt(putReportBody.record.shipTypeList.value[j].value.ST_shipNum.value || 0) + parseInt(reportUpdateData[i].stockNum || 0);
						}
					}
				} else {
					var newSTListBody = {
						'value': {
							'sys_shiptypeCode': {'value': reportUpdateData[i].sysSTCode,},
							'shipType': {'value': stockData.shipType},
							'ST_mType': {'value': reportUpdateData[i].mType},
							'ST_mVendor': {'value': reportUpdateData[i].mVendor},
							'ST_mCode': {'value': reportUpdateData[i].devCode},
							'ST_mName': {'value': reportUpdateData[i].mName},
							'ST_shipNum': {'value': reportUpdateData[i].stockNum},
							'ST_mCost': {'value': reportUpdateData[i].mCost}
						}
					};
					putReportBody.record.shipTypeList.value.push(newSTListBody);
				}
			}
		}
		putReportData.push(putReportBody);
		//レポート更新
		var putReport = {
			'app': sysid.INV.app_id.report,
			'records': putReportData,
		};
		await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putReport)
			.then(function (resp) {
				return resp;
			}).catch(function (error) {
				console.log(error);
				return error;
			});
	}else{ //対応したレポートがない場合
		//レポート新規作成
		var postReportData = [];
		if(typeof stockData.shipType === "undefined"){
			var postReportBody = {
				'invoiceYears': {'value': stockData.date.slice(0, -2)},
				'invoiceMonth': {'value': stockData.date.slice(4)},
				'inventoryList': {'value': []}
			};
		} else{
			var postReportBody = {
				'invoiceYears': {'value': stockData.date.slice(0, -2)},
				'invoiceMonth': {'value': stockData.date.slice(4)},
				'inventoryList': {'value': []},
				'shipTypeList': {'value': []}
			};
		}
		// レポート更新情報をリストに格納
		for (let i in reportUpdateData) {
			if (reportUpdateData[i].arrOrShip == 'ship') {
				var newReportListBody = {
					'value': {
						'sys_code': {'value': reportUpdateData[i].sysCode},
						'mClassification':{'value': reportUpdateData[i].mClassification},
						'mType':{'value': reportUpdateData[i].mType},
						'mVendor':{'value': reportUpdateData[i].mVendor},
						'mCode': {'value': reportUpdateData[i].devCode},
						'mName':{'value': reportUpdateData[i].mName},
						'stockLocation': {'value': reportUpdateData[i].uName},
						'shipNum': {'value': reportUpdateData[i].stockNum},
						'mCost': {'value': reportUpdateData[i].mCost}
					}
			};
				if(typeof reportUpdateData[i].sysSTCode !== "undefined"){
					var newSTListBody = {
						'value': {
							'sys_shiptypeCode': {'value': reportUpdateData[i].sysSTCode},
							'shipType': {'value': stockData.shipType},
							'ST_mType': {'value': reportUpdateData[i].mType},
							'ST_mVendor': {'value': reportUpdateData[i].mVendor},
							'ST_mCode': {'value': reportUpdateData[i].devCode},
							'ST_mName': {'value': reportUpdateData[i].mName},
							'ST_shipNum': {'value': reportUpdateData[i].stockNum},
							'ST_mCost': {'value': reportUpdateData[i].mCost}
						}
					};
					postReportBody.shipTypeList.value.push(newSTListBody);
				}
			} else if (reportUpdateData[i].arrOrShip == 'arr') {
				var newReportListBody = {
					'value': {
						'sys_code': {'value': reportUpdateData[i].sysCode},
						'mClassification':{'value': reportUpdateData[i].mClassification},
						'mType':{'value': reportUpdateData[i].mType},
						'mVendor':{'value': reportUpdateData[i].mVendor},
						'mCode': {'value': reportUpdateData[i].devCode},
						'mName':{'value': reportUpdateData[i].mName},
						'stockLocation': {'value': reportUpdateData[i].uName},
						'arrivalNum': {'value': reportUpdateData[i].stockNum},
						'mCost': {'value': reportUpdateData[i].mCost}
					}
				};
			}
			postReportBody.inventoryList.value.push(newReportListBody);
		}
		//レポート情報ポスト
		postReportData.push(postReportBody);
		var postReport = {
			'app': sysid.INV.app_id.report,
			'records': postReportData,
		};
		await kintone.api(kintone.api.url('/k/v1/records.json', true), 'POST', postReport)
			.then(function (resp) {
				return resp;
			}).catch(function (error) {
				console.log(error);
				return error;
			});
	}
	return reportUpdateData;
};

/**
 * 在庫処理
 * @param {*} event (json)
 * @param {*} appId (string) 変更データ取得するアプリID
 * @returns (json)
 * @author Jay(refactoring)
 */
async function stockCtrl(event, appId) {
	var stockData = createStockJson(event, appId);
	// console.log(stockData);
	// ＞＞＞商品管理情報取得＜＜＜
	//商品管理クエリ作成
	var devQuery = [];
	for (let i in stockData.arr) {
		devQuery.push('"' + stockData.arr[i].devCode + '"');
	}
	for (let i in stockData.ship) {
		devQuery.push('"' + stockData.ship[i].devCode + '"');
	}
	// 配列内の重複した要素の削除
	devQuery = Array.from(new Set(devQuery));
	var getDeviceBody = {
		'app': sysid.INV.app_id.device,
		'query': 'mCode in (' + devQuery.join() + ')'
	};
	console.log(getDeviceBody);
	var deviceRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getDeviceBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	// ＞＞＞商品管理情報取得 end＜＜＜

	// ＞＞＞拠点管理情報取得＜＜＜
	//拠点管理クエリ作成
	var uniQuery = [];
	for (let i in stockData.arr) {
		uniQuery.push('"' + stockData.arr[i].uniCode + '"');
	}
	for (let i in stockData.ship) {
		uniQuery.push('"' + stockData.ship[i].uniCode + '"');
	}
	// 配列内の重複した要素の削除
	uniQuery = Array.from(new Set(uniQuery));
	var getUnitBody = {
		'app': sysid.INV.app_id.unit,
		'query': 'uCode in (' + uniQuery.join() + ')'
	};
	console.log(getUnitBody);
	var unitRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getUnitBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	// ＞＞＞拠点管理情報取得 end＜＜＜

	// 情報更新用配列
	var deviceStockData = [];
	var unitStockData = [];

	// 商品管理情報作成
	for (let i in deviceRecords.records) {
		var putDevBody = {
			'updateKey': {
				'field': 'mCode',
				'value': deviceRecords.records[i].mCode.value
			},
			'record': {
				'uStockList': {'value': deviceRecords.records[i].uStockList.value}
			}
		};
		deviceStockData.push(putDevBody);
	}

	// 商品管理、入荷情報挿入 (指定数分＋する)
	for (let i in deviceStockData) {
		for (let j in deviceStockData[i].record.uStockList.value) {
			for (let k in stockData.arr) {
				if (stockData.arr[k].devCode == deviceStockData[i].updateKey.value && stockData.arr[k].uniCode == deviceStockData[i].record.uStockList.value[j].value.uCode.value) {
					deviceStockData[i].record.uStockList.value[j].value.uStock.value = parseInt(deviceStockData[i].record.uStockList.value[j].value.uStock.value || 0) + parseInt(stockData.arr[k].stockNum || 0);
				}
			}
		}
	}

	// 商品管理、出荷情報挿入 (指定数分-する)
	for (let i in deviceStockData) {
		for (let j in deviceStockData[i].record.uStockList.value) {
			for (let k in stockData.ship) {
				if (stockData.ship[k].devCode == deviceStockData[i].updateKey.value && stockData.ship[k].uniCode == deviceStockData[i].record.uStockList.value[j].value.uCode.value) {
					deviceStockData[i].record.uStockList.value[j].value.uStock.value = parseInt(deviceStockData[i].record.uStockList.value[j].value.uStock.value || 0) - parseInt(stockData.ship[k].stockNum || 0);
				}
			}
		}
	}

	// 仕入管理の場合のみ商品管理jsonに在庫情報を入れる
	if (stockData.appId == sysid.INV.app_id.purchasing) {
		for (let i in deviceStockData) {
			for (let j in stockData.arr) {
				if (stockData.arr[j].devCode == deviceStockData[i].updateKey.value) {
					deviceStockData[i].record.mCost = {'value': stockData.arr[j].costInfo.mCost};
					deviceStockData[i].record.mCostUpdate = {'value': stockData.arr[j].costInfo.mCostUpdate};
					deviceStockData[i].record.deviceCost = {'value': stockData.arr[j].costInfo.deviceCost};
					deviceStockData[i].record.deviceCost_foreign = {'value': stockData.arr[j].costInfo.deviceCost_foreign};
					deviceStockData[i].record.importExpenses = {'value': stockData.arr[j].costInfo.importExpenses};
					deviceStockData[i].record.developCost = {'value': stockData.arr[j].costInfo.developCost};
				}
			}
		}
	}
	// 拠点管理情報作成
	for (let i in unitRecords.records) {
		var putUniBody = {
			'updateKey': {
				'field': 'uCode',
				'value': unitRecords.records[i].uCode.value
			},
			'record': {
				'mStockList': {'value': unitRecords.records[i].mStockList.value}
			}
		};
		unitStockData.push(putUniBody);
	}
	// 拠点管理、入荷情報挿入 (指定数分＋する)
	for (let i in unitStockData) {
		for (let j in unitStockData[i].record.mStockList.value) {
			for (let k in stockData.arr) {
				if (stockData.arr[k].uniCode == unitStockData[i].updateKey.value && stockData.arr[k].devCode == unitStockData[i].record.mStockList.value[j].value.mCode.value) {
					unitStockData[i].record.mStockList.value[j].value.mStock.value = parseInt(unitStockData[i].record.mStockList.value[j].value.mStock.value || 0) + parseInt(stockData.arr[k].stockNum || 0);
				}
			}
		}
	}
	// 拠点管理、出荷情報挿入 (指定数分-する)
	for (let i in unitStockData) {
		for (let j in unitStockData[i].record.mStockList.value) {
			for (let k in stockData.ship) {
				if (stockData.ship[k].uniCode == unitStockData[i].updateKey.value && stockData.ship[k].devCode == unitStockData[i].record.mStockList.value[j].value.mCode.value) {
					unitStockData[i].record.mStockList.value[j].value.mStock.value = parseInt(unitStockData[i].record.mStockList.value[j].value.mStock.value || 0) - parseInt(stockData.ship[k].stockNum || 0);
				}
			}
		}
	}
	//商品管理、拠点管理を更新
	var putDeviceBody = {
		'app': sysid.INV.app_id.device,
		'records': deviceStockData,
	};
	await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putDeviceBody)
		.then(function (resp) {
			console.log('商品在庫数変更');
			console.log(putDeviceBody);
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	var putUnitBody = {
		'app': sysid.INV.app_id.unit,
		'records': unitStockData,
	};
	await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putUnitBody)
		.then(function (resp) {
			console.log('拠点在庫数変更');
			console.log(putUnitBody);
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});

	// 作成したjsonを配列に格納
	var totalStockdata = {
		'device': deviceStockData,
		'unit': unitStockData
	};
	return totalStockdata;
};

/**
 * レコード一括取得、レコードID
 * @param {Object} _params
 *   - app {String}: アプリID（省略時は表示中アプリ）
 *   - filterCond {String}: 絞り込み条件
 *   - sortConds {Array}: ソート条件の配列
 *   - fields {Array}: 取得対象フィールドの配列
 * @returns {Object} response
 *   - records {Array}: 取得レコードの配列
 * @author MIT
 * @author Jay(refactoring)
 */
function getRecords(_params) {
	var MAX_READ_LIMIT = 500;

  var params = _params || {};
  var app = params.app || kintone.app.getId();
  var filterCond = params.filterCond;
  var sortConds = params.sortConds;
  var limit = params.limit || -1;
  var offset = params.offset || 0;
  var fields = params.fields;
  var data = params.data;

  if (!data) {
    data = {
      records: []
    };
  }

  var willBeDone = false;
  var thisLimit = MAX_READ_LIMIT;
  // getRecords 関数の呼び出し側で、レコードの取得件数を指定された場合は
  // 取得件数を満たせば終了するように willBeDone を true にする
  if (limit > 0) {
    if (thisLimit > limit) {
      thisLimit = limit;
      willBeDone = true;
    }
  }

  var conditions = [];
  if (filterCond) {
    conditions.push(filterCond);
  }

  var sortCondsAndLimit = (sortConds && sortConds.length > 0 ? ' order by ' + sortConds.join(', ') : '')
    + ' limit ' + thisLimit;
  var query = conditions.join(' and ') + sortCondsAndLimit + ' offset ' + offset;
  var body = {
    app: app,
    query: query
  };
  if (fields && fields.length > 0) {
    body.fields = fields;
  }
  return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body).then(function(resp) {
      data.records = data.records.concat(resp.records);
      var _offset = resp.records.length;
      if (limit > 0 && limit < _offset) {
        willBeDone = true;
      }
      // 取得すべきレコードを取得したら終了する
      if (_offset < thisLimit || willBeDone) {
        return data;
      }
      // 取得すべきレコードが残っている場合は、再帰呼び出しで残りのレコードを取得する
      return getRecords({
        app: app,
        filterCond: filterCond,
        sortConds: sortConds,
        limit: limit - _offset,
        offset: offset + _offset,
        fields: fields,
        data: data
      });
    });
};

/**
 * デバイス管理用アカウント作成
 */
async function setAccount(){
	let dmw = mWindow();
	let dmwForm = document.createElement('form');

	// アカウントタイプ取得＆作成
	const get_fieldProperties = (await kintone.api(kintone.api.url('/k/v1/app/form/fields.json', true), 'GET', {app: 341, lang: 'default'})).properties;

	let dmwType = document.createElement('dav');
	let dmwType_input = document.createElement('input');
	dmwType_input.type = 'select';
	dmwType_input.name = 'cmsType';
	dmwType_input.id = 'cmsType';
	let cmsTypeOptions = Object.values(get_fieldProperties.cmsType.options);
	cmsTypeOptions.forEach(function(option){
		let dmwType_input_option = document.createElement('option');
		dmwType_input_option.value = option.label;
		dmwType_input_option.innerText = option.label;
		dmwType_input.appendChild(dmwType_input_option);
	});
	dmwType_input.appendChild(dmwType_input);
	dmwForm.appendChild(dmwType);

	let dmwAccount = document.createElement('div');
	let dmwAccount_label = document.createElement('label');
	dmwAccount_label.htmlFor = 'dAccount';
	dmwAccount_label.innerText = 'アカウント：';
	dmwAccount.appendChild(dmwAccount_label);
	let dmwAccount_input = document.createElement('input');
	dmwAccount_input.type = 'text';
	dmwAccount_input.name = 'dAccount';
	dmwAccount_input.id = 'dAccount';
	// dmwAccount_input.value =
	dmwAccount.appendChild(dmwAccount_input);
	dmwForm.appendChild(dmwAccount);


	let dmwPassword = document.createElement('div');
	let dmwPassword_label = document.createElement('label');
	dmwPassword_label.htmlFor = 'dPassword';
	dmwPassword_label.innerText = 'パスワード：';
	dmwPassword.appendChild(dmwPassword_label);
	let dmwPassword_input = document.createElement('input');
	dmwPassword_input.type = 'text';
	dmwPassword_input.name = 'dPassword';
	dmwPassword_input.id = 'dPassword';
	// dmwPassword_input.value =
	dmwPassword.appendChild(dmwPassword_input);
	dmwForm.appendChild(dmwPassword);


	let dmwCreate = document.createElement('div');
	let dmwCreate_input = document.createElement('input');
	dmwCreate_input.type = 'button';
	dmwCreate_input.name = 'createAccount';
	dmwCreate_input.id = 'createAccount';
	dmwCreate_input.value = 'アカウント情報生成';
	dmwCreate.appendChild(dmwCreate_input);
	let dmwCreatePW_input = document.createElement('input');
	dmwCreatePW_input.type = 'button';
	dmwCreatePW_input.name = 'createPassword';
	dmwCreatePW_input.id = 'createPassword';
	dmwCreatePW_input.value = 'パスワードのみ生成';
	dmwCreate.appendChild(dmwCreatePW_input);
	dmwForm.appendChild(dmwCreate);


	let dmwSubmit = document.createElement('div');
	let dmwSubmit_input = document.createElement('input');
	dmwSubmit_input.type = 'submit';
	dmwSubmit.appendChild(dmwSubmit_input);
	let dmwReset_input = document.createElement('input');
	dmwReset_input.type = 'reset';
	dmwSubmit.appendChild(dmwReset_input);
	dmwForm.appendChild(dmwSubmit);

	dmw.contents.appendChild(dmwForm);
	$('#mwFrame').fadeIn();
}

// OLD
const fields = Object.values(cybozu.data.page.FORM_DATA.schema.table.fieldList);
/* ボタン、タブメニュー */
// スペースフィールドにボタンを設置
function setBtn(btnID, btnValue) {
	var contsBtn = document.createElement('button'); //ボタン作成
	contsBtn.id = btnID; //ボタンにID追加
	contsBtn.classList.add('jsbtn_conts'); //ボタンにCSS追加
	contsBtn.innerText = btnValue; //ボタンの表示名
	contsBtn.addEventListener("mouseover", function (event) {
		contsBtn.classList.add('jsbtn_over');
	}, false); //マウスを乗せた時の処理
	contsBtn.addEventListener("mouseleave", function (event) {
		contsBtn.classList.remove('jsbtn_over');
	}, false); //マウスを離した時の処理
	kintone.app.record.getSpaceElement(btnID).appendChild(contsBtn); //指定スペースフィールドにボタン設置
	return contsBtn;
}
// 詳細画面のヘッダースペースにボタン設置
function setBtn_header(btnID, btnValue) {
	var headerBtn = document.createElement('button');
	headerBtn.id = btnID;
	headerBtn.classList.add('jsbtn_header');
	headerBtn.innerText = btnValue;
	headerBtn.addEventListener("mouseover", function (event) {
		headerBtn.classList.add('jsbtn_over');
	}, false);
	headerBtn.addEventListener("mouseleave", function (event) {
		headerBtn.classList.remove('jsbtn_over');
	}, false);
	kintone.app.record.getHeaderMenuSpaceElement().appendChild(headerBtn);
	return headerBtn;
}
// 一覧画面のヘッダースペースにボタン設置
function setBtn_index(btnID, btnValue) {
	var indexBtn = document.createElement('button');
	indexBtn.id = btnID;
	indexBtn.classList.add('jsbtn_header');
	indexBtn.innerText = btnValue;
	indexBtn.addEventListener("mouseover", function (event) {
		indexBtn.classList.add('jsbtn_over');
	}, false);
	indexBtn.addEventListener("mouseleave", function (event) {
		indexBtn.classList.remove('jsbtn_over');
	}, false);
	kintone.app.getHeaderMenuSpaceElement().appendChild(indexBtn);
	return indexBtn;
}
/**使い方
 * var newORG=setBtn('btn_newORG','新規組織');
 * newORG.onclick=function(){
 * 	createNewREC(sysID.DIPM.app.org, 'prj_aNum', prj_aNumValue); // 実行内容例
 * }
 */
// プルダウンメニュー
function setSelect_header(selectID, selectValue) {
	var headerSelect = document.createElement('select');
	headerSelect.id = selectID;
	headerSelect.classList.add('jsselect_header');
	for (let i in selectValue) {
		var sOption = document.createElement('option');
		sOption.innerText = selectValue[i];
		headerSelect.appendChild(sOption);
	}
	kintone.app.record.getHeaderMenuSpaceElement().appendChild(headerSelect);
	return headerSelect;
}

// tabメニューをULで作成 done
function tabMenu(tabID, tabList) {
	var tMenu = document.createElement('ul'); //ul要素作成
	tMenu.id = tabID; //リストにID追加
	tMenu.classList.add(tabID); //リストにCSS追加
	tMenu.classList.add('tabMenu'); //リストにCSS追加
	for (let i in tabList) { //繰り返しli要素とその中身を作成
		var tList = document.createElement('li'); //li要素作成
		var aLink = document.createElement('a'); //a要素作成
		aLink.setAttribute('href', '#' + tabList[i]); //a要素に詳細を追加
		aLink.innerText = tabList[i]; //a要素の表示名
		tList.appendChild(aLink); //li要素にa要素追加
		tMenu.appendChild(tList); //ul要素にli要素追加
	}
	kintone.app.record.getSpaceElement(tabID).appendChild(tMenu); //指定スペースフィールドにtabメニュー追加
	$('.' + tabID + ' li:first-of-type').addClass("active"); //デフォルトで最初のli要素をアクティブ状態にする
	$('.' + tabID + ' a').on('click', function () { //他のメニュークリック時アクション
		var parentElm = $(this).parent(); //クリックされた要素を取得
		$('.' + tabID + ' li').removeClass("active"); //li要素のCSS設定を削除
		$(parentElm).addClass("active"); //クリックした要素に改めてCSS設定を付与
		return false;
	});
}
/* 使い方
*function tabSwitch(onSelect){ //タブメニュー選択肢
*	switch(onSelect){
*		case '#menu1'
*	}
*}tabSwitch('#お問い合わせ詳細'); //tab初期表示設定

*tabMenu('tabID', ['menu1','menu2']); //タブメニュー作成
*$('.tabMenu a').on('click', function(){ //タブメニュークリック時アクション
*	var idName = $(this).attr('href'); //タブ内のリンク名を取得
*	tabSwitch(idName); //tabをクリックした時の表示設定
*	return false;
*});
*/


/* 表示関連 */
//フィールド表示設定
function setFieldShown(fieldCode, isShown) {
	kintone.app.record.setFieldShown(fieldCode, isShown);
	kintone.mobile.app.record.setFieldShown(Element, isShown);
}

function setSpaceShown(Element, option, parm) {
	var elTag = kintone.app.record.getSpaceElement(Element); //スペースフィールドの要素を取得
	if (option == 'line') elTag.parentNode.parentNode.style.display = parm; //上記で取得した要素の二つ前の要素のdisplayオプション設定
	else if (option == 'individual') elTag.parentNode.style.display = parm;
}

/* ツール */
//sessionStorageにデータ格納
function createNewREC(tarAPP_id, copy_fCode, copy_value) {
	if (Array.isArray(copy_fCode)) { //配列の場合のアクション
		for (let i in copy_fCode) { //ループさせデータ格納
			sessionStorage.removeItem(copy_fCode[i]); //同じ名称のSessionStorageを削除
			sessionStorage.setItem(copy_fCode[i], copy_value[i]); //値をSessionStorageに格納する
		}
	} else { //配列以外の場合のアクション
		sessionStorage.removeItem(copy_fCode); //同じ名称のSessionStorageを削除
		sessionStorage.setItem(copy_fCode, copy_value); //値をSessionStorageに格納する
	}
	// window.open('https://accel-lab.cybozu.com/k/' + tarAPP_id + '/edit', '_blank'); //該当アプリの新規レコード作成画面を開く
	window.open('https://accel-lab.cybozu.com/k/' + tarAPP_id + '/edit', Math.random() + '-newWindow', 'scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=1000,height=600,left=300,top=200'); //該当アプリの新規レコード作成画面を開く

	if (Array.isArray(copy_fCode)) { //配列の場合のアクション
		for (let i in copy_fCode) {
			sessionStorage.removeItem(copy_fCode[i]);
		} //同じ名称のSessionStorageを削除
	} else {
		sessionStorage.removeItem(copy_fCode); //同じ名称のSessionStorageを削除
	}
}

// シリアル番号取得
var sNumRecords = function (Value, fType) {
	let snum = {
		SNs: []
	};
	switch (fType) {
		case 'table':
			for (let i in Value) {
				let sn = Value[i].value.sNum.value; //シリアル番号データを取り出す
				let mcode = Value[i].value.mCode.value;
				let snArray = sn.split(/\r\n|\n/); //シリアル番号を改行を持って、区切り、配列にする
				let sns = snArray.filter(Boolean); //配列順番を反転(書いた順番と同じ順番にするため)
				snum[mcode] = sns;
				for (let y in sns) {
					snum.SNs.push(sns[y]);
				}
			}
			break;
		case 'text':
			let snArray = Value.split(/\r\n|\n/); //シリアル番号を改行を持って、区切り、配列にする
			snum.SNs = snArray.filter(Boolean);
			break;
	}
	return snum;
};

// パスワードジェネレーター
var pw_generator = function (len) {
	let letters = 'abcdefghjklmnpqrstuvwxyz'; //パスワードに使用する文字列群
	let numbers = '0123456789'; //パスワードに使用する数字群
	let symbols = '!@#$%^&*(){}<>?'; //パスワードに使用する記号群
	let string = letters + letters.toUpperCase() + numbers + symbols; //小文字を大文字に変換

	let pw_req = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(){}<>?])[a-zA-Z0-9!@#$%^&*(){}<>?]+$/); //パスワード条件

	let newPw;
	while (true) { //条件を果たすまでパスワードを繰り返し作成
		newPw = ''; //パスワードをクリア
		for (let i = 0; i < len; i++) {
			newPw += string.charAt(Math.floor(Math.random() * string.length));
		} //パスワード生成
		let ck_pw_req = pw_req.exec(newPw); //生成したパスワードが条件を満たすか確認
		if (ck_pw_req) break; //生成したパスワードが条件を満たす場合のみ繰り返し中止
	}
	return newPw;
};
// 文字列ジェネレーター
var string_generator = function (len) {
	let letters = 'abcdefghjklmnpqrstuvwxyz'; //文字列に使用する文字列群
	let numbers = '0123456789'; //文字列に使用する数字群
	let string = letters + numbers; //小文字のみ

	let string_req = new RegExp(/^(?=.*[a-z])(?=.*[0-9])[a-z0-9]+$/); //文字列条件

	let newString;
	while (true) { //条件を果たすまで文字列を繰り返し作成
		newString = ''; //パスワードをクリア
		for (let i = 0; i < len; i++) {
			newString += string.charAt(Math.floor(Math.random() * string.length));
		} //パスワード生成
		let ck_string_req = string_req.exec(newString); //生成した文字列が条件を満たすか確認
		if (ck_string_req) break; //生成した文字列が条件を満たす場合のみ繰り返し中止
	}
	return newString;
};

// Auto Numbering 自動採番
function autoNum(header, fieldCode) {
	$.ajax({
		type: 'GET'
	}).done(function (data, status, xhr) {
		var serverDate = new Date(xhr.getResponseHeader('Date')).getTime(); //サーバー時刻を代入
		var utcNum = Math.floor(serverDate / 5000); //5秒の幅を持って、切り上げる
		var eRecord = kintone.app.record.get(); //レコード値を取得
		eRecord.record[fieldCode].value = header + utcNum; //フィールドに値をセット
		kintone.app.record.set(eRecord); //変更内容を反映
	});
}

// カーテンレール部品割り出し
var railConf = function (spec) {
	var truckLength = spec.rLength - 140;
	var mcode = 'KRT-DY' + spec.rLength + spec.rType.toUpperCase();
	var railDetail = [];
	var truck = ['アルミトラック2000', Math.ceil(truckLength / 2000) * spec.shipNum];
	var ConnectingKit = ['連結金具', Math.ceil(truckLength / 2000 - 1) * spec.shipNum];
	var RubberBelt = ['ラバーベルト', Math.ceil((truckLength * 2 + 240) / 1000) * spec.shipNum];
	var Carriers = ['ランナー', Math.round(truckLength / 125)];
	if (spec.rType.match(/[wW]/)) Carriers[1] = Math.ceil(Carriers[1] / 2) * 2 * spec.shipNum;
	else Carriers[1] = Carriers[1] * spec.shipNum;
	var CeilingBracket = ['', Math.round(spec.rLength / 500 + 1) * spec.shipNum];
	if (spec.rMethod == '天井') CeilingBracket[0] = '取付金具D';
	else if (spec.rMethod.match(/壁付/)) CeilingBracket[0] = '取付金具N';
	var MasterCarrier = ['マスタキャリアW', 1 * spec.shipNum];
	if (ConnectingKit[1] > 0) MasterCarrier[0] = 'マスタキャリアG';
	var BeltClip = ['ベルトクリップ', 2 * spec.shipNum];
	var EndHook = ['エンドフック', 1 * spec.shipNum];
	if (spec.rType.match(/[wW]/)) {
		MasterCarrier[1] = MasterCarrier[1] * 2;
		BeltClip[1] = BeltClip[1] * 2;
		EndHook[1] = EndHook[1] * 2;
	}

	railDetail.push({
		mname: truck[0],
		shipnum: truck[1]
	});
	if (ConnectingKit[1] > 0) railDetail.push({
		mname: ConnectingKit[0],
		shipnum: ConnectingKit[1]
	});
	railDetail.push({
		mname: RubberBelt[0],
		shipnum: RubberBelt[1]
	});
	railDetail.push({
		mname: Carriers[0],
		shipnum: Carriers[1]
	});
	railDetail.push({
		mname: CeilingBracket[0],
		shipnum: CeilingBracket[1]
	});
	if (spec.rMethod.match(/壁付/)) {
		if (spec.rMethod.match(/壁付[sS]/)) railDetail.push({
			mname: 'L字金具S',
			shipnum: CeilingBracket[1]
		});
		else if (spec.rMethod.match(/壁付[wW]/)) railDetail.push({
			mname: 'L字金具W',
			shipnum: CeilingBracket[1]
		});
	}
	railDetail.push({
		mname: MasterCarrier[0],
		shipnum: MasterCarrier[1]
	});
	railDetail.push({
		mname: BeltClip[0],
		shipnum: BeltClip[1]
	});
	railDetail.push({
		mname: EndHook[0],
		shipnum: EndHook[1]
	});
	railDetail.push({
		mname: 'エンドボックス',
		shipnum: 2 * spec.shipNum
	});
	railDetail.push({
		mname: 'エンドカバー',
		shipnum: 1 * spec.shipNum
	});
	railDetail.push({
		mname: 'バンパー',
		shipnum: 2 * spec.shipNum
	});
	var railComp = [];
	for (let i in railDetail) {
		railComp.push({
			value: {
				mVendor: {
					value: '',
					type: 'SINGLE_LINE_TEXT'
				},
				mType: {
					value: '',
					type: 'SINGLE_LINE_TEXT'
				},
				mCode: {
					value: '',
					type: 'SINGLE_LINE_TEXT'
				},
				mName: {
					value: '',
					type: 'SINGLE_LINE_TEXT'
				},
				mNickname: {
					value: railDetail[i].mname,
					type: 'SINGLE_LINE_TEXT'
				},
				shipNum: {
					value: railDetail[i].shipnum,
					type: 'NUMBER'
				},
				sNum: {
					value: '',
					type: 'MULTI_LINE_TEXT'
				},
				shipRemarks: {
					value: '',
					type: 'SINGLE_LINE_TEXT'
				}
			}
		});
	}
	railComp[0].value.shipRemarks.value = 'truckLength: ' + truckLength;
	return railComp;
};

// 検索エンジン
/* その他 */
function orgRound(value, base) {
	return Math.round(value * base) / base;
}

function orgCeil(value, base) {
	return Math.ceil(value * base) / base;
}

function orgFloor(value, base) {
	return Math.floor(value * base) / base;
}
// 全レコード呼び出し
function api_getRecords(appID) {
	return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
		'app': appID,
		'query': null
	});
}

// 100件以上のレコード登録
function postRecords(sendApp, records) {
	return new Promise(async function (resolve, reject) {
		const POST_RECORDS = records;
		while (POST_RECORDS.length) {
			var postBody = {
				'app': sendApp,
				'records': POST_RECORDS.slice(0, 100),
			}
			console.log(postBody);
			var postResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postBody)
				.then(function (resp) {
					console.log(postBody);
					return {
						stat: 'success',
						message: resp
					};
				}).catch(function (error) {
					console.log(error);
					return {
						stat: 'error',
						message: error
					};
				});
			if (postResult.stat == 'error') {
				reject(new Error(JSON.stringify(postResult.message)));
			}
			POST_RECORDS.splice(0, 100);
		}
		resolve('success');
	});
}

// 100件以上のレコード更新
async function putRecords(sendApp, records) {
	return new Promise(async function (resolve, reject) {
		const PUT_RECORDS = records;
		while (PUT_RECORDS.length) {
			var putBody = {
				'app': sendApp,
				'records': PUT_RECORDS.slice(0, 100),
			}
			var putResult = await kintone.api(kintone.api.url('/k/v1/records', true), "PUT", putBody)
				.then(function (resp) {
					console.log(putBody);
					return {
						stat: 'success',
						message: resp
					};
				}).catch(function (error) {
					console.log(error);
					return {
						stat: 'error',
						message: error
					};
				});
			if (putResult.stat == 'error') {
				reject(new Error(JSON.stringify(putResult.message)));
			}
			PUT_RECORDS.splice(0, 100);
		}
		resolve('success');
	});
}

// 100件以上のレコード削除
async function deleteRecords(sendApp, records) {
	return new Promise(async function (resolve, reject) {
		const DELETE_RECORDS = records;
		while (DELETE_RECORDS.length) {
			var deleteBody = {
				'app': sendApp,
				'ids': DELETE_RECORDS.slice(0, 100),
			}
			var deleteResult = await kintone.api(kintone.api.url('/k/v1/records', true), "DELETE", deleteBody)
				.then(function (resp) {
					console.log(deleteBody);
					return 'success';
				}).catch(function (error) {
					console.log(error);
					return 'error';
				});
			if (deleteResult == 'error') {
				reject(new Error('delete error'));
			}
			DELETE_RECORDS.splice(0, 100);
		}
		resolve('success');
	});
}

/**
 * 指定月のレポートが締切の場合エラー表示
 * @param {*} reportDate 判別したいレポートの月 例)202109
 * @returns
 */
async function checkEoMReport(reportDate,loginUserData) {
	var getReportBody = {
		'app': sysid.INV.app_id.report,
		'query': 'sys_invoiceDate = "' + reportDate + '"'
	};
	var reportData = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getReportBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	//一時確認例外アカウント
	var firstCheck = ['システム設計','kintone Admin','在庫管理拠点'];
	//二時確認例外アカウント
	var secondCheck = ['システム設計','kintone Admin'];
	//締切例外アカウント
	var lastCheck = ['kintone Admin'];
	if (reportData.records.length != 0) {
		if (reportData.records[0].EoMcheck.value == '一時確認') {
			if(firstCheck.includes(loginUserData.name)){
				return ['true','一時確認'];
			} else{
				return ['false','一時確認'];
			}
		} else if (reportData.records[0].EoMcheck.value == '二時確認') {
			if(secondCheck.includes(loginUserData.name)){
				return ['true','二時確認'];
			} else{
				return ['false','二時確認'];
			}
		} else if (reportData.records[0].EoMcheck.value == '締切') {
			if(lastCheck.includes(loginUserData.name)){
				return ['true','締切'];
			} else{
				return ['false','締切'];
			}
		}
	}
	return reportData;
};

/* 商品管理、拠点管理の在庫処理 */

/**
 * ストック情報をまとめたjson作成
 * @param {*} event kintone event, ASS配送先リストの場合のみ指定の情報
 * @param {*} appId 関数を使ったアプリのID
 * @returns json
 */
function createStockJson(event, appId) {
	/**
	 * 在庫管理用json
	 * arr 入荷データ
	 * ship 出荷データ
	 */
	var stockData = {
		'arr': [],
		'ship': []
	};
	stockData.appId = appId;
	if (appId == sysid.INV.app_id.shipment) { //入出荷管理
		//レポート用日付作成
		if(appId==104){
			var sendDate = event.record.shipping_datetime.value.slice(0,10);
		}else{
			var sendDate = event.record.sendDate.value;
		}
		sendDate = sendDate.replace(/-/g, '');
		sendDate = sendDate.slice(0, -2);
		stockData.date = sendDate;
		//レポート用日付作成 end
		if(!event.record.shipType.value.match(/移動|確認中/)){
			stockData.shipType = event.record.shipType.value;
		}
		if (event.nextStatus) {
			if (event.nextStatus.value == '集荷待ち') {
				var arrivalShipType = ['移動-販売', '移動-サブスク', '移動-拠点間', '移動-ベンダー', '社内利用', '貸与', '修理・交換'];
				for (let i in event.record.deviceList.value) {
					/**
					 * 出荷用json作成
					 * arrOrShip 入荷か出荷かの識別子
					 * devCode 商品コード
					 * uniCode 拠点コード
					 * stockNum 依頼数
					 */
					var stockShipBody = {
						'arrOrShip': 'ship',
						'devCode': event.record.deviceList.value[i].value.mCode.value,
						'uniCode': event.record.sys_shipmentCode.value,
						'stockNum': event.record.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockShipBody);
					if (arrivalShipType.includes(event.record.shipType.value)) { // 出荷区分がarrivalShipTypeに含まれる場合のみ入荷情報を作成
						/**
						 * 入荷用json作成
						 * arrOrShip 入荷か出荷かの識別子
						 * devCode 商品コード
						 * uniCode 拠点コード
						 * stockNum 依頼数
						 */
						var stockArrBody = {
							'arrOrShip': 'arr',
							'devCode': event.record.deviceList.value[i].value.mCode.value,
							'uniCode': event.record.sys_arrivalCode.value,
							'stockNum': event.record.deviceList.value[i].value.shipNum.value
						};
						stockData.arr.push(stockArrBody)
					}
				}
				return stockData;
			} else if (event.nextStatus.value == '出荷完了') {
				var arrivalShipType_dist1 = ['移動-販売', '移動-サブスク'];
				var arrivalShipType_dist2 = ['社内利用', '貸与', '修理・交換'];
				var arrivalShipType_arr = ['移動-拠点間', '移動-ベンダー', '社内利用', '貸与', '修理・交換'];
				for (let i in event.record.deviceList.value) {
					// 出荷情報を作成
					var stockShipBody = {
						'arrOrShip': 'ship',
						'devCode': event.record.deviceList.value[i].value.mCode.value,
						'uniCode': event.record.sys_shipmentCode.value,
						'stockNum': event.record.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockShipBody);
					if (arrivalShipType_dist1.includes(event.record.shipType.value)) { // 出荷区分がarrivalShipType_dist1に含まれる場合のみ入荷情報を作成
						var stockArrBody = {
							'arrOrShip': 'arr',
							'devCode': event.record.deviceList.value[i].value.mCode.value,
							'uniCode': 'distribute',
							'stockNum': event.record.deviceList.value[i].value.shipNum.value
						};
						stockData.arr.push(stockArrBody)
					} else if (arrivalShipType_dist2.includes(event.record.shipType.value)) { // 出荷区分がarrivalShipType_dist2に含まれる場合のみ入荷情報を作成
						var stockArrBody = {
							'arrOrShip': 'arr',
							'devCode': event.record.deviceList.value[i].value.mCode.value,
							'uniCode': 'reuse(incomp)',
							'stockNum': event.record.deviceList.value[i].value.shipNum.value
						};
						stockData.arr.push(stockArrBody)
					} else if (arrivalShipType_arr.includes(event.record.shipType.value)) { // 出荷区分がarrivalShipType_arrに含まれる場合のみ入荷情報を作成
						var stockArrBody = {
							'arrOrShip': 'arr',
							'devCode': event.record.deviceList.value[i].value.mCode.value,
							'uniCode': event.record.sys_arrivalCode.value,
							'stockNum': event.record.deviceList.value[i].value.shipNum.value
						};
						stockData.arr.push(stockArrBody)
					}
				}
				return stockData;
			} else {
				return false;
			}
		} else {
			return false;
		}
	} else if (appId == sysid.PM.app_id.project) { //案件管理
		var distributeSalesType = ['販売', 'サブスク'];
		stockData.date = event.record.sys_invoiceDate.value;
		if (distributeSalesType.includes(event.record.salesType.value)) {
			stockData.shipType = event.record.salesType.value;
			for (let i in event.record.deviceList.value) {
				if (event.record.deviceList.value[i].value.subBtn.value == '通常') { // 予備機が通常のもののみ
					//出荷情報は積送からのみ
					var stockShipBody = {
						'arrOrShip': 'ship',
						'devCode': event.record.deviceList.value[i].value.mCode.value,
						'uniCode': 'distribute',
						'stockNum': event.record.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockShipBody);
				}
			}
			return stockData;
		}
		return false;
	} else if (appId == sysid.INV.app_id.purchasing) { // 仕入管理
		var sendDate = event.record.arrivalDate.value;
		sendDate = sendDate.replace(/-/g, '');
		sendDate = sendDate.slice(0, -2);
		stockData.date = sendDate;
		// 通貨種類によって先頭の記号変更
		if (event.record.currencyType.value == '米ドル＄') {
			var foreignCurrency = '$';
		} else if (event.record.currencyType.value == 'ユーロ€') {
			var foreignCurrency = '€';
		} else {
			var foreignCurrency = '';
		}
		// 入荷情報作成
		for (let i in event.record.arrivalList.value) {
			var stockArrBody = {
				'arrOrShip': 'arr',
				'devCode': event.record.arrivalList.value[i].value.mCode.value,
				'uniCode': event.record.arrivalList.value[i].value.uCode.value,
				'stockNum': event.record.arrivalList.value[i].value.arrivalNum.value,
				'costInfo': {
					'mCost': event.record.arrivalList.value[i].value.totalUnitCost.value,
					'mCostUpdate': event.record.arrivalDate.value,
					'deviceCost': event.record.arrivalList.value[i].value.unitPrice.value,
					'deviceCost_foreign': foreignCurrency + event.record.arrivalList.value[i].value.unitPrice_foreign.value,
					'importExpenses': event.record.arrivalList.value[i].value.addiUnitExpenses.value,
					'developCost': event.record.arrivalList.value[i].value.addiCost.value
				}
			};
			stockData.arr.push(stockArrBody);
		}
		return stockData;
	} else if (appId == sysid.ASS.app_id.shipment) { //ASS配送先リスト
		var sendDate = new Date(event.shipping_datetime.value);
		var sendYears = String(sendDate.getFullYear());
		var sendMonth = String(("0" + (sendDate.getMonth() + 1)).slice(-2));
		var reportDate = sendYears + sendMonth;
		stockData.date = reportDate;
		var titanToDistType = ['デバイス追加', '故障交換（保証期間外）'];
		if (event.working_status.value == '出荷完了') {
			for (let i in event.deviceList.value) { //出荷、入荷情報をセット
				//出荷情報はatlasから
				var stockShipBody = {
					'arrOrShip': 'ship',
					'devCode': event.deviceList.value[i].value.mCode.value,
					'uniCode': 'atlas',
					'stockNum': event.deviceList.value[i].value.shipNum.value
				};
				//入荷情報は積送ASSに
				var stockArrBody = {
					'arrOrShip': 'arr',
					'devCode': event.deviceList.value[i].value.mCode.value,
					'uniCode': 'distribute-ASS',
					'stockNum': event.deviceList.value[i].value.shipNum.value
				};
				stockData.ship.push(stockShipBody);
				stockData.arr.push(stockArrBody)
			}
		} else if (event.working_status.value == '着荷完了') {
			if(titanToDistType.includes(event.application_type.value)){
				for (let i in event.deviceList.value) { //出荷、入荷情報をセット
					//出荷情報はatlasから
					var stockShipBody = {
						'arrOrShip': 'ship',
						'devCode': event.deviceList.value[i].value.mCode.value,
						'uniCode': 'atlas',
						'stockNum': event.deviceList.value[i].value.shipNum.value
					};
					//入荷情報は積送ASSに
					var stockArrBody = {
						'arrOrShip': 'arr',
						'devCode': event.deviceList.value[i].value.mCode.value,
						'uniCode': 'distribute-ASS',
						'stockNum': event.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockShipBody);
					stockData.arr.push(stockArrBody)
				}
			}
		}
		return stockData;
	} else if(appId == sysid.DEV.app_id.rental){
		//レポート用日付作成
		var sendDate = event.record.sendDate.value;
		sendDate = sendDate.replace(/-/g, '');
		sendDate = sendDate.slice(0, -2);
		stockData.date = sendDate;
		//レポート用日付作成 end
		if (event.nextStatus) {
			if (event.nextStatus.value == '集荷待ち') {
				for (let i in event.record.deviceList.value) {
					/**
					 * 出荷用json作成
					 * arrOrShip 入荷か出荷かの識別子
					 * devCode 商品コード
					 * uniCode 拠点コード
					 * stockNum 依頼数
					 */
					var stockRentBody = {
						'arrOrShip': 'ship',
						'devCode': event.record.deviceList.value[i].value.mCode.value,
						'uniCode': event.record.sys_shipmentCode.value,
						'stockNum': event.record.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockRentBody);
				}
				return stockData;
			} else if (event.nextStatus.value == '出荷完了') {
				for (let i in event.record.deviceList.value) {
					// 出荷情報を作成
					var stockRentBody = {
						'arrOrShip': 'ship',
						'devCode': event.record.deviceList.value[i].value.mCode.value,
						'uniCode': event.record.sys_shipmentCode.value,
						'stockNum': event.record.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockRentBody);
				}
				return stockData;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	return false;
};

/**
 * 受け取ったjsonから商品管理、拠点管理に在庫情報を挿入
 * @param {*} event kintone event
 * @param {*} appId 関数を使ったアプリのID
 * @returns json
 */
async function stockCtrl(event, appId) {
	var stockData = createStockJson(event, appId);
	// console.log(stockData);
	/* 商品管理情報取得 */
	//商品管理クエリ作成
	var devQuery = [];
	for (let i in stockData.arr) {
		devQuery.push('"' + stockData.arr[i].devCode + '"');
	}
	for (let i in stockData.ship) {
		devQuery.push('"' + stockData.ship[i].devCode + '"');
	}
	// 配列内の重複した要素の削除
	devQuery = Array.from(new Set(devQuery));
	var getDeviceBody = {
		'app': sysid.INV.app_id.device,
		'query': 'mCode in (' + devQuery.join() + ')'
	};
	console.log(getDeviceBody);
	var deviceRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getDeviceBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	/* 商品管理情報取得 end */

	/* 拠点管理情報取得 */
	//拠点管理クエリ作成
	var uniQuery = [];
	for (let i in stockData.arr) {
		uniQuery.push('"' + stockData.arr[i].uniCode + '"');
	}
	for (let i in stockData.ship) {
		uniQuery.push('"' + stockData.ship[i].uniCode + '"');
	}
	// 配列内の重複した要素の削除
	uniQuery = Array.from(new Set(uniQuery));
	var getUnitBody = {
		'app': sysid.INV.app_id.unit,
		'query': 'uCode in (' + uniQuery.join() + ')'
	};
	console.log(getUnitBody);
	var unitRecords = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', getUnitBody)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	/* 拠点管理情報取得 end */

	// 情報更新用配列
	var deviceStockData = [];
	var unitStockData = [];

	// 商品管理情報作成
	for (let i in deviceRecords.records) {
		var putDevBody = {
			'updateKey': {
				'field': 'mCode',
				'value': deviceRecords.records[i].mCode.value
			},
			'record': {
				'uStockList': {
					'value': deviceRecords.records[i].uStockList.value
				}
			}
		};
		deviceStockData.push(putDevBody);
	}

	// 商品管理、入荷情報挿入 (指定数分＋する)
	for (let i in deviceStockData) {
		for (let j in deviceStockData[i].record.uStockList.value) {
			for (let k in stockData.arr) {
				if (stockData.arr[k].devCode == deviceStockData[i].updateKey.value && stockData.arr[k].uniCode == deviceStockData[i].record.uStockList.value[j].value.uCode.value) {
					deviceStockData[i].record.uStockList.value[j].value.uStock.value = parseInt(deviceStockData[i].record.uStockList.value[j].value.uStock.value || 0) + parseInt(stockData.arr[k].stockNum || 0);
				}
			}
		}
	}

	// 商品管理、出荷情報挿入 (指定数分-する)
	for (let i in deviceStockData) {
		for (let j in deviceStockData[i].record.uStockList.value) {
			for (let k in stockData.ship) {
				if (stockData.ship[k].devCode == deviceStockData[i].updateKey.value && stockData.ship[k].uniCode == deviceStockData[i].record.uStockList.value[j].value.uCode.value) {
					deviceStockData[i].record.uStockList.value[j].value.uStock.value = parseInt(deviceStockData[i].record.uStockList.value[j].value.uStock.value || 0) - parseInt(stockData.ship[k].stockNum || 0);
				}
			}
		}
	}

	// 仕入管理の場合のみ商品管理jsonに在庫情報を入れる
	if (stockData.appId == sysid.INV.app_id.purchasing) {
		for (let i in deviceStockData) {
			for (let j in stockData.arr) {
				if (stockData.arr[j].devCode == deviceStockData[i].updateKey.value) {
					deviceStockData[i].record.mCost = {
						'value': stockData.arr[j].costInfo.mCost
					};
					deviceStockData[i].record.mCostUpdate = {
						'value': stockData.arr[j].costInfo.mCostUpdate
					};
					deviceStockData[i].record.deviceCost = {
						'value': stockData.arr[j].costInfo.deviceCost
					};
					deviceStockData[i].record.deviceCost_foreign = {
						'value': stockData.arr[j].costInfo.deviceCost_foreign
					};
					deviceStockData[i].record.importExpenses = {
						'value': stockData.arr[j].costInfo.importExpenses
					};
					deviceStockData[i].record.developCost = {
						'value': stockData.arr[j].costInfo.developCost
					};
				}
			}
		}
	}
	// 拠点管理情報作成
	for (let i in unitRecords.records) {
		var putUniBody = {
			'updateKey': {
				'field': 'uCode',
				'value': unitRecords.records[i].uCode.value
			},
			'record': {
				'mStockList': {
					'value': unitRecords.records[i].mStockList.value
				}
			}
		};
		unitStockData.push(putUniBody);
	}
	// 拠点管理、入荷情報挿入 (指定数分＋する)
	for (let i in unitStockData) {
		for (let j in unitStockData[i].record.mStockList.value) {
			for (let k in stockData.arr) {
				if (stockData.arr[k].uniCode == unitStockData[i].updateKey.value && stockData.arr[k].devCode == unitStockData[i].record.mStockList.value[j].value.mCode.value) {
					unitStockData[i].record.mStockList.value[j].value.mStock.value = parseInt(unitStockData[i].record.mStockList.value[j].value.mStock.value || 0) + parseInt(stockData.arr[k].stockNum || 0);
				}
			}
		}
	}
	// 拠点管理、出荷情報挿入 (指定数分-する)
	for (let i in unitStockData) {
		for (let j in unitStockData[i].record.mStockList.value) {
			for (let k in stockData.ship) {
				if (stockData.ship[k].uniCode == unitStockData[i].updateKey.value && stockData.ship[k].devCode == unitStockData[i].record.mStockList.value[j].value.mCode.value) {
					unitStockData[i].record.mStockList.value[j].value.mStock.value = parseInt(unitStockData[i].record.mStockList.value[j].value.mStock.value || 0) - parseInt(stockData.ship[k].stockNum || 0);
				}
			}
		}
	}
	//商品管理、拠点管理を更新
	var putDeviceBody = {
		'app': sysid.INV.app_id.device,
		'records': deviceStockData,
	};
	await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putDeviceBody)
		.then(function (resp) {
			console.log('商品在庫数変更');
			console.log(putDeviceBody);
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});
	var putUnitBody = {
		'app': sysid.INV.app_id.unit,
		'records': unitStockData,
	};
	await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putUnitBody)
		.then(function (resp) {
			console.log('拠点在庫数変更');
			console.log(putUnitBody);
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});

	// 作成したjsonを配列に格納
	var totalStockdata = {
		'device': deviceStockData,
		'unit': unitStockData
	};
	return totalStockdata;
};



/* 計算ボタン処理 */
/**
 * 計算ボタン押下時、パッケージ品、KRT-DYに対応した商品を挿入
 * @param {*} eRecord kintone.app.record.get();
 * @param {*} appId 関数を使ったアプリのID
 * @returns
 */
async function calBtnFunc(eRecord, appId) {
	var eRecord = kintone.app.record.get();
	var shipTable = eRecord.record.deviceList.value;
	var lengthStr = '';
	var openType = '';
	var methodType = '';
	var shipNum = '';
	var numRegExp = new RegExp(/^([1-9]\d*|0)$/);
	var openRegExp = new RegExp(/^[sw]/i);
	var methodRegExp = new RegExp(/壁付[sw]|天井/i);
	var newShipTable = [];

	// 依頼数空欄時エラー
	for (let i in shipTable) {
		if (numRegExp.test(shipTable[i].value.shipNum.value)) {
			shipNum = shipTable[i].value.shipNum.value;
			shipTable[i].value.shipNum.error = null;
		} else {
			shipTable[i].value.shipNum.error = '入力形式が間違えています';
		}
	}

	// 対応商品取得
	var calDeviceQuery = [];
	for (let i in shipTable) {
		if (String(shipTable[i].value.shipRemarks.value).match(/WFP/)) {
			if (String(shipTable[i].value.mCode.value).match(/pkg_/)) {
				calDeviceQuery.push('"' + shipTable[i].value.mCode.value + '"');
			}
		}
	}
	if (calDeviceQuery.length != 0) {
		var getCalDevice = {
			'app': sysid.INV.app_id.device,
			'query': 'mCode in (' + calDeviceQuery.join() + ')',
		};
	} else {
		var getCalDevice = {
			'app': sysid.INV.app_id.device,
			'query': '',
		};
	}

	var calDevice = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', getCalDevice)
		.then(function (resp) {
			return resp;
		}).catch(function (error) {
			console.log(error);
			return error;
		});

	for (let i in shipTable) {
		if (String(shipTable[i].value.shipRemarks.value).match(/WFP/)) {
			if (shipTable[i].value.mCode.value == 'KRT-DY') {
				shipTable[i].value.shipRemarks.value = shipTable[i].value.shipRemarks.value.replace(/WFP/g, 'PAC')
				newShipTable.push(shipTable[i]);
				var railSpecs = (String(shipTable[i].value.shipRemarks.value)).split(/,\n|\n/);
				var numCutter = railSpecs[1].indexOf('：');
				railSpecs[0] = railSpecs[1].slice(numCutter + 1);
				var openCutter = railSpecs[2].indexOf('：');
				railSpecs[1] = railSpecs[2].slice(openCutter + 1);
				var methodCutter = railSpecs[3].indexOf('：');
				railSpecs[2] = railSpecs[3].slice(methodCutter + 1);

				if (railSpecs[1] == '(S)片開き') {
					railSpecs[1] = 's';
				} else if (railSpecs[1] == '(W)両開き') {
					railSpecs[1] = 'w';
				} else {
					railSpecs[1] = '';
				}
				railSpecs.pop();
				for (let j in railSpecs) {
					if (numRegExp.test(railSpecs[j])) {
						if (parseInt(railSpecs[j]) >= 580) {
							lengthStr = railSpecs[j];
							shipTable[i].value.shipRemarks.error = null;
						} else {
							shipTable[i].value.shipRemarks.error = '入力形式が間違えています';
							break;
						}
					} else {
						shipTable[i].value.shipRemarks.error = '入力形式が間違えています';
					}

					if (openRegExp.test(railSpecs[j])) {
						if (railSpecs[j].length === 1) {
							openType = railSpecs[j];
							openType = openType.toLowerCase();

							shipTable[i].value.shipRemarks.error = null;
						} else {
							shipTable[i].value.shipRemarks.error = '入力形式が間違えています';
							break;
						}
					} else {
						shipTable[i].value.shipRemarks.error = '入力形式が間違えています';
					}

					if (methodRegExp.test(railSpecs[j])) {
						if (railSpecs[j].match(/壁付s/i)) {
							methodType = '壁付s';
						} else if (railSpecs[j].match(/壁付w/i)) {
							methodType = '壁付w';
						} else {
							methodType = '天井';
						}
						shipTable[i].value.shipRemarks.error = null;
					} else {
						shipTable[i].value.shipRemarks.error = '入力形式が間違えています';
					}
				}
				var spec = {
					rLength: lengthStr,
					rType: openType,
					rMethod: methodType,
					shipNum: shipTable[i].value.shipNum.value
				}
				var railItems = railConf(spec);
				for (let j in railItems) {
					if (appId == sysid.PM.app_id.project) {
						var railItemBody = {
							value: {
								mVendor: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mVendor.value).replace(/\"/g, '')
								},
								mType: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mType.value).replace(/\"/g, '')
								},
								mCode: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mCode.value).replace(/\"/g, '')
								},
								mName: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mName.value).replace(/\"/g, '')
								},
								mNickname: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mNickname.value).replace(/\"/g, '')
								},
								subBtn: {
									type: "RADIO_BUTTON",
									value: '通常'
								},
								shipRemarks: {
									type: "MULTI_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.shipRemarks.value).replace(/\"/g, '')
								},
								shipNum: {
									type: "NUMBER",
									value: JSON.stringify(railItems[j].value.shipNum.value).replace(/\"/g, '')
								}
							}
						}
					} else if (appId == sysid.INV.app_id.shipment) {
						var railItemBody = {
							value: {
								mVendor: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mVendor.value).replace(/\"/g, '')
								},
								mType: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mType.value).replace(/\"/g, '')
								},
								mCode: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mCode.value).replace(/\"/g, '')
								},
								mName: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mName.value).replace(/\"/g, '')
								},
								mNickname: {
									type: "SINGLE_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.mNickname.value).replace(/\"/g, '')
								},
								sNum: {
									type: "MULTI_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.sNum.value).replace(/\"/g, '')
								},
								shipRemarks: {
									type: "MULTI_LINE_TEXT",
									value: JSON.stringify(railItems[j].value.shipRemarks.value).replace(/\"/g, '')
								},
								shipNum: {
									type: "NUMBER",
									value: JSON.stringify(railItems[j].value.shipNum.value).replace(/\"/g, '')
								}
							}
						}
					}
					newShipTable.push(railItemBody);
				}
			} else if (String(shipTable[i].value.mCode.value).match(/pkg_/)) {
				shipTable[i].value.shipRemarks.value = shipTable[i].value.shipRemarks.value.replace(/WFP/g, 'PAC')
				newShipTable.push(shipTable[i]);
				for (let j in calDevice.records) {
					if (shipTable[i].value.mCode.value == calDevice.records[j].mCode.value) {
						for (let k in calDevice.records[j].packageComp.value) {
							if (appId == sysid.PM.app_id.project) {
								var pkgBody = {
									value: {
										mVendor: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mVendor.value
										},
										mType: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mType.value
										},
										mCode: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mCode.value
										},
										mName: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mName.value
										},
										mNickname: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mNickname.value
										},
										subBtn: {
											type: "RADIO_BUTTON",
											value: '通常'
										},
										shipRemarks: {
											type: "MULTI_LINE_TEXT",
											value: ''
										},
										shipNum: {
											type: "NUMBER",
											value: parseInt(calDevice.records[j].packageComp.value[k].value.pc_Num.value) * parseInt(shipTable[i].value.shipNum.value)
										}
									}
								}
							} else if (appId == sysid.INV.app_id.shipment) {
								var pkgBody = {
									value: {
										mVendor: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mVendor.value
										},
										mType: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mType.value
										},
										mCode: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mCode.value
										},
										mName: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mName.value
										},
										mNickname: {
											type: "SINGLE_LINE_TEXT",
											value: calDevice.records[j].packageComp.value[k].value.pc_mNickname.value
										},
										sNum: {
											type: "MULTI_LINE_TEXT",
											value: ''
										},
										shipRemarks: {
											type: "MULTI_LINE_TEXT",
											value: ''
										},
										shipNum: {
											type: "NUMBER",
											value: parseInt(calDevice.records[j].packageComp.value[k].value.pc_Num.value) * parseInt(shipTable[i].value.shipNum.value)
										}
									}
								}
							}
							newShipTable.push(pkgBody);
						}
					}
				}
			} else if (String(shipTable[i].value.mCode.value).match(/ZSL10/)) {
				shipTable[i].value.shipRemarks.value = shipTable[i].value.shipRemarks.value.replace(/WFP/g, 'PAC')
				newShipTable.push(shipTable[i]);
				if (appId == sysid.PM.app_id.project) {
					var escBody = {
						value: {
							mVendor: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mType: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mCode: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mName: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mNickname: {
								type: "SINGLE_LINE_TEXT",
								value: 'LOCK Pro用エスカッション'
							},
							subBtn: {
								type: "RADIO_BUTTON",
								value: '通常'
							},
							shipRemarks: {
								type: "MULTI_LINE_TEXT",
								value: ''
							},
							shipNum: {
								type: "NUMBER",
								value: parseInt(shipTable[i].value.shipNum.value)
							}
						}
					}
				} else if (appId == sysid.INV.app_id.shipment) {
					var escBody = {
						value: {
							mVendor: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mType: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mCode: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mName: {
								type: "SINGLE_LINE_TEXT",
								value: ''
							},
							mNickname: {
								type: "SINGLE_LINE_TEXT",
								value: 'LOCK Pro用エスカッション'
							},
							sNum: {
								type: "MULTI_LINE_TEXT",
								value: ''
							},
							shipRemarks: {
								type: "MULTI_LINE_TEXT",
								value: ''
							},
							shipNum: {
								type: "NUMBER",
								value: parseInt(shipTable[i].value.shipNum.value)
							}
						}
					}
				}
				newShipTable.push(escBody);
			}
		} else {
			newShipTable.push(shipTable[i]);
		}
	}
	eRecord.record.deviceList.value = newShipTable;
	for (let i in eRecord.record.deviceList.value) {
		eRecord.record.deviceList.value[i].value.mNickname.lookup = true;
	}
	return kintone.app.record.set(eRecord);
}

/* 検索窓処理 */
function setSearch(searchParms) {
	// モーダルWrap作成
	var searchWrap = document.createElement('div');
	searchWrap.id = 'searchWrap';
	searchWrap.classList.add('searchWrap');

	// 簡易検索モーダル表示ボタン作成,表示機能
	var showEasySearchBtn = document.createElement('button');
	showEasySearchBtn.type = 'button';
	showEasySearchBtn.id = 'showEasySearch';
	showEasySearchBtn.classList.add('showModalBtn');
	showEasySearchBtn.innerHTML = '簡易検索';
	kintone.app.getHeaderMenuSpaceElement().appendChild(showEasySearchBtn);

	// 簡易検索モーダル作成
	var eSearchArea = document.createElement('div');
	eSearchArea.id = 'easySearch';
	eSearchArea.classList.add('searchWindow');

	var eSearchTitle = document.createElement('p');
	eSearchTitle.classList.add('searchTitle');
	eSearchTitle.innerText = '簡易検索';
	eSearchArea.appendChild(eSearchTitle);

	var eSearchTargetArea = document.createElement('form');
	eSearchTargetArea.id = 'easySearchTargets';
	eSearchTargetArea.name = 'easySearchTargets';

	var eSearchCheckboxArea = document.createElement('div');
	eSearchCheckboxArea.id = 'easySearchCheckboxWrap';
	eSearchCheckboxArea.classList.add('checkBoxWrap');
	eSearchTargetArea.appendChild(eSearchCheckboxArea);

	var eSearchInputArea = document.createElement('div');
	eSearchInputArea.id = 'easySearchInputWrap';
	eSearchInputArea.classList.add('inputWrap');
	eSearchTargetArea.appendChild(eSearchInputArea);

	if (sessionStorage.getItem('searched')) {
		for (let i in searchParms.sConditions) {
			var eSearchTarget = document.createElement('input');
			eSearchTarget.id = 'esc_' + searchParms.sConditions[i].fCode;
			eSearchTarget.name = 'eSearchTarget';
			eSearchTarget.type = 'checkbox';
			eSearchTarget.value = searchParms.sConditions[i].fCode;
			eSearchCheckboxArea.appendChild(eSearchTarget);

			var eSearchTargetValue = document.createElement('label');
			eSearchTargetValue.htmlFor = 'esc_' + searchParms.sConditions[i].fCode;
			eSearchTargetValue.innerText = searchParms.sConditions[i].fName;
			eSearchCheckboxArea.appendChild(eSearchTargetValue);

			$(document).on("click", `#esc_${searchParms.sConditions[i].fCode}`, function () {
				if ($(`#esc_${searchParms.sConditions[i].fCode}`).prop("checked") == true) {
					var eSearch = document.createElement('input');
					eSearch.id = 'esi_' + searchParms.sConditions[i].fCode;
					eSearch.type = 'text';
					eSearch.name = searchParms.sConditions[i].fCode + '_' + searchParms.sConditions[i].matchType;
					eSearch.placeholder = searchParms.sConditions[i].fName;
					eSearch.classList.add('searchInput');
					eSearch.classList.add('eSearchInput');
					eSearchInputArea.appendChild(eSearch);
				} else {
					$(`#esi_${searchParms.sConditions[i].fCode}`).remove();
				}
			});

			if (sessionStorage.getItem(searchParms.sConditions[i].fCode)) {
				eSearchTarget.checked = true;
				var eSearch = document.createElement('input');
				eSearch.id = 'esi_' + searchParms.sConditions[i].fCode;
				eSearch.type = 'text';
				eSearch.name = searchParms.sConditions[i].fCode + '_' + searchParms.sConditions[i].matchType;
				eSearch.value = sessionStorage.getItem(searchParms.sConditions[i].fCode);
				eSearch.placeholder = searchParms.sConditions[i].fName;
				eSearch.classList.add('searchInput');
				eSearch.classList.add('eSearchInput');
				eSearchInputArea.appendChild(eSearch);
			}
		}
	} else {
		for (let i in searchParms.sConditions) {
			var eSearchTarget = document.createElement('input');
			eSearchTarget.id = 'esc_' + searchParms.sConditions[i].fCode;
			eSearchTarget.name = 'eSearchTarget';
			eSearchTarget.type = 'checkbox';
			eSearchTarget.value = searchParms.sConditions[i].fCode;
			eSearchCheckboxArea.appendChild(eSearchTarget);

			var eSearchTargetValue = document.createElement('label');
			eSearchTargetValue.htmlFor = 'esc_' + searchParms.sConditions[i].fCode;
			eSearchTargetValue.innerText = searchParms.sConditions[i].fName;
			eSearchCheckboxArea.appendChild(eSearchTargetValue);

			$(document).on("click", `#esc_${searchParms.sConditions[i].fCode}`, function () {
				if ($(`#esc_${searchParms.sConditions[i].fCode}`).prop("checked") == true) {
					var eSearch = document.createElement('input');
					eSearch.id = 'esi_' + searchParms.sConditions[i].fCode;
					eSearch.type = 'text';
					eSearch.name = searchParms.sConditions[i].fCode + '_' + searchParms.sConditions[i].matchType;
					eSearch.placeholder = searchParms.sConditions[i].fName;
					eSearch.classList.add('searchInput');
					eSearch.classList.add('eSearchInput');
					eSearchInputArea.appendChild(eSearch);
				} else {
					$(`#esi_${searchParms.sConditions[i].fCode}`).remove();
				}
			});

			if (i == 0) {
				eSearchTarget.checked = true;
				var eSearch = document.createElement('input');
				eSearch.id = 'esi_' + searchParms.sConditions[0].fCode;
				eSearch.type = 'text';
				eSearch.name = searchParms.sConditions[0].fCode + '_' + searchParms.sConditions[0].matchType;
				eSearch.placeholder = searchParms.sConditions[0].fName;
				eSearch.classList.add('searchInput');
				eSearch.classList.add('eSearchInput');
				eSearchInputArea.appendChild(eSearch);
			}
		}
	}

	//簡易検索ボタン作成
	var eSearchBtn = document.createElement('button');
	eSearchBtn.type = 'button';
	var eSearchBtn_id = 'eSearchBtn_' + searchParms.sID;
	eSearchBtn.id = eSearchBtn_id;
	eSearchBtn.innerHTML = '検索';
	eSearchCheckboxArea.appendChild(eSearchBtn);

	//検索リセットボタン作成
	var eSearchResetBtn = document.createElement('button');
	eSearchResetBtn.type = 'button';
	var eSearchResetBtn_id = 'eSearchReset_' + searchParms.sID;
	eSearchResetBtn.id = eSearchResetBtn_id;
	eSearchResetBtn.classList.add('searchReset');
	eSearchResetBtn.innerHTML = '検索リセット';
	eSearchCheckboxArea.appendChild(eSearchResetBtn);

	//検索クリアボタン作成
	var eSearchClearBtn = document.createElement('button');
	eSearchClearBtn.type = 'button';
	var eSearchClearBtn_id = 'eSearchClear_' + searchParms.sID;
	eSearchClearBtn.id = eSearchClearBtn_id;
	eSearchClearBtn.classList.add('searchClear');
	eSearchClearBtn.innerHTML = 'クリア';
	eSearchCheckboxArea.appendChild(eSearchClearBtn);

	// 詳細検索モーダル表示ボタン作成,表示機能
	var showDetailSearchBtn = document.createElement('button');
	showDetailSearchBtn.type = 'button';
	showDetailSearchBtn.id = 'showDetailSearch';
	showDetailSearchBtn.classList.add('showModalBtn');
	showDetailSearchBtn.innerHTML = '詳細検索';
	kintone.app.getHeaderMenuSpaceElement().appendChild(showDetailSearchBtn);

	// 詳細検索モーダル作成
	var dSearchArea = document.createElement('div');
	dSearchArea.id = 'detailSearch';
	dSearchArea.classList.add('searchWindow');

	var dSearchTitle = document.createElement('p');
	dSearchTitle.classList.add('searchTitle');
	dSearchTitle.innerText = '詳細検索';
	dSearchArea.appendChild(dSearchTitle);

	var dSearchTargetArea = document.createElement('form');
	dSearchTargetArea.id = 'detailSearchTargets';
	dSearchTargetArea.name = 'detailSearchTargets';

	var dSearchCheckboxArea = document.createElement('div');
	dSearchCheckboxArea.id = 'detailSearchCheckboxWrap';
	dSearchCheckboxArea.classList.add('checkBoxWrap');
	dSearchTargetArea.appendChild(dSearchCheckboxArea);

	var dSearchInputArea = document.createElement('div');
	dSearchInputArea.id = 'detailSearchInputWrap';
	dSearchInputArea.classList.add('inputWrap');
	dSearchTargetArea.appendChild(dSearchInputArea);

	if (sessionStorage.getItem('searched')) {
		for (let i in searchParms.sConditions) {
			var dSearchTarget = document.createElement('input');
			dSearchTarget.id = 'dsc_' + searchParms.sConditions[i].fCode;
			dSearchTarget.name = 'dSearchTarget';
			dSearchTarget.type = 'checkbox';
			dSearchTarget.value = searchParms.sConditions[i].fCode;
			dSearchCheckboxArea.appendChild(dSearchTarget);

			var dSearchTargetValue = document.createElement('label');
			dSearchTargetValue.htmlFor = 'dsc_' + searchParms.sConditions[i].fCode;
			dSearchTargetValue.innerText = searchParms.sConditions[i].fName;
			dSearchCheckboxArea.appendChild(dSearchTargetValue);

			$(document).on("click", `#dsc_${searchParms.sConditions[i].fCode}`, function () {
				if ($(`#dsc_${searchParms.sConditions[i].fCode}`).prop("checked") == true) {
					var dSearch = document.createElement('input');
					dSearch.id = 'dsi_' + searchParms.sConditions[i].fCode;
					dSearch.type = 'text';
					dSearch.name = searchParms.sConditions[i].fCode + '_' + searchParms.sConditions[i].matchType;
					dSearch.placeholder = searchParms.sConditions[i].fName;
					dSearch.classList.add('searchInput');
					dSearch.classList.add('dSearchInput');
					dSearchInputArea.appendChild(dSearch);
				} else {
					$(`#dsi_${searchParms.sConditions[i].fCode}`).remove();
				}
			});

			if (sessionStorage.getItem(searchParms.sConditions[i].fCode)) {
				dSearchTarget.checked = true;
				var dSearch = document.createElement('input');
				dSearch.id = 'dsi_' + searchParms.sConditions[i].fCode;
				dSearch.type = 'text';
				dSearch.name = searchParms.sConditions[i].fCode + '_' + searchParms.sConditions[i].matchType;
				dSearch.value = sessionStorage.getItem(searchParms.sConditions[i].fCode);
				dSearch.placeholder = searchParms.sConditions[i].fName;
				dSearch.classList.add('searchInput');
				dSearch.classList.add('dSearchInput');
				dSearchInputArea.appendChild(dSearch);
			}
		}
	} else {
		for (let i in searchParms.sConditions) {
			var dSearchTarget = document.createElement('input');
			dSearchTarget.id = 'dsc_' + searchParms.sConditions[i].fCode;
			dSearchTarget.name = 'dSearchTarget';
			dSearchTarget.type = 'checkbox';
			dSearchTarget.value = searchParms.sConditions[i].fCode;
			dSearchCheckboxArea.appendChild(dSearchTarget);

			var dSearchTargetValue = document.createElement('label');
			dSearchTargetValue.htmlFor = 'dsc_' + searchParms.sConditions[i].fCode;
			dSearchTargetValue.innerText = searchParms.sConditions[i].fName;
			dSearchCheckboxArea.appendChild(dSearchTargetValue);

			$(document).on("click", `#dsc_${searchParms.sConditions[i].fCode}`, function () {
				if ($(`#dsc_${searchParms.sConditions[i].fCode}`).prop("checked") == true) {
					var dSearch = document.createElement('input');
					dSearch.id = 'dsi_' + searchParms.sConditions[i].fCode;
					dSearch.type = 'text';
					dSearch.name = searchParms.sConditions[i].fCode + '_' + searchParms.sConditions[i].matchType;
					dSearch.placeholder = searchParms.sConditions[i].fName;
					dSearch.classList.add('searchInput');
					dSearch.classList.add('dSearchInput');
					dSearchInputArea.appendChild(dSearch);
				} else {
					$(`#dsi_${searchParms.sConditions[i].fCode}`).remove();
				}
			});

			if (i == 0) {
				dSearchTarget.checked = true;
				var dSearch = document.createElement('input');
				dSearch.id = 'dsi_' + searchParms.sConditions[0].fCode;
				dSearch.type = 'text';
				dSearch.name = searchParms.sConditions[0].fCode + '_' + searchParms.sConditions[0].matchType;
				dSearch.placeholder = searchParms.sConditions[0].fName;
				dSearch.classList.add('searchInput');
				dSearch.classList.add('dSearchInput');
				dSearchInputArea.appendChild(dSearch);
			}
		}
	}

	//詳細検索ボタン作成
	var dSearchBtn = document.createElement('button');
	dSearchBtn.type = 'button';
	var dSearchBtn_id = 'dSearchBtn_' + searchParms.sID;
	dSearchBtn.id = dSearchBtn_id;
	dSearchBtn.innerHTML = '検索';
	dSearchCheckboxArea.appendChild(dSearchBtn);

	//検索リセットボタン作成
	var dSearchResetBtn = document.createElement('button');
	dSearchResetBtn.type = 'button';
	var dSearchResetBtn_id = 'eSearchReset_' + searchParms.sID;
	dSearchResetBtn.id = dSearchResetBtn_id;
	dSearchResetBtn.classList.add('searchReset');
	dSearchResetBtn.innerHTML = '検索リセット';
	dSearchCheckboxArea.appendChild(dSearchResetBtn);

	//検索クリアボタン作成
	var dSearchClearBtn = document.createElement('button');
	dSearchClearBtn.type = 'button';
	var dSearchClearBtn_id = 'eSearchClear_' + searchParms.sID;
	dSearchClearBtn.id = dSearchClearBtn_id;
	dSearchClearBtn.classList.add('searchClear');
	dSearchClearBtn.innerHTML = 'クリア';
	dSearchCheckboxArea.appendChild(dSearchClearBtn);


	//閉じるボタン作成
	var esCloseBtn = document.createElement('div');
	esCloseBtn.classList.add('searchClose');
	esCloseBtn.innerHTML = '<p>X</p>';
	var dsCloseBtn = document.createElement('div');
	dsCloseBtn.classList.add('searchClose');
	dsCloseBtn.innerHTML = '<p>X</p>';

	//bodyに追加
	eSearchArea.appendChild(eSearchTargetArea);
	eSearchArea.appendChild(esCloseBtn);
	dSearchArea.appendChild(dSearchTargetArea);
	dSearchArea.appendChild(dsCloseBtn);
	searchWrap.appendChild(eSearchArea);
	searchWrap.appendChild(dSearchArea);
	$("body").append(searchWrap);

	$(document).on("click", '.searchClose, .searchWrap', function () {
		$(`#${searchWrap.id}`).fadeOut();
		$(`#${eSearchArea.id}`).fadeOut();
		$(`#${dSearchArea.id}`).fadeOut();
	});

	$(document).on("click", '.searchWindow', function (e) {
		e.stopPropagation();
	});

	$(document).on("click", `#${showEasySearchBtn.id}`, function () {
		$(`#${searchWrap.id}`).fadeIn();
		$(`#${eSearchArea.id}`).fadeIn();
	});

	$(document).on("click", `#${showDetailSearchBtn.id}`, function () {
		$(`#${searchWrap.id}`).fadeIn();
		$(`#${dSearchArea.id}`).fadeIn();
	});

	//簡易検索
	$(`#${eSearchBtn_id}`).on('click', function () {
		sessionStorage.setItem('searched', 'true');
		for (let i in searchParms.sConditions) {
			sessionStorage.removeItem(searchParms.sConditions[i].fCode);
		}
		//作成したテキストボックスから値を格納
		var inputText = $(".eSearchInput").map(function (index, element) {
			var val = $(this).val();
			var nameArray = $(this).attr('name').split('_');
			var name = nameArray[0];
			var matchType = nameArray[1];
			sessionStorage.setItem(name, val);
			if (val == "") {
				var inputJson = {
					'name': name,
					'value': val,
					'matchType': '='
				};
			} else {
				var inputJson = {
					'name': name,
					'value': val,
					'matchType': matchType
				};
			}
			return inputJson
		}).get();
		if (inputText.length > 1) {
			var queryArray = [];
			for (let i in inputText) {
				var queryBody = inputText[i].name + ` ${inputText[i].matchType} ` + '"' + inputText[i].value + '"';
				queryArray.push(queryBody);
			}
			var queryText = queryArray.join(' or ');
		} else if (inputText.length == 1) {
			var queryText = inputText[0].name + ` ${inputText[0].matchType} ` + '"' + inputText[0].value + '"';
		} else {
			var queryText = '';
		}
		queryText = encodeURIComponent(queryText);
		var str_query = '?query=' + queryText;
		document.location = location.origin + location.pathname + str_query;
	});

	// 詳細検索
	$(`#${dSearchBtn_id}`).on('click', function () {
		sessionStorage.setItem('searched', 'true');
		for (let i in searchParms.sConditions) {
			sessionStorage.removeItem(searchParms.sConditions[i].fCode);
		}
		//作成したテキストボックスから値を格納
		var inputText = $(".dSearchInput").map(function (index, element) {
			var val = $(this).val();
			var nameArray = $(this).attr('name').split('_');
			var name = nameArray[0];
			var matchType = nameArray[1];
			sessionStorage.setItem(name, val);
			if (val == "") {
				var inputJson = {
					'name': name,
					'value': val,
					'matchType': '='
				};
			} else {
				var inputJson = {
					'name': name,
					'value': val,
					'matchType': matchType
				};
			}
			return inputJson
		}).get();
		console.log(inputText.length);
		if (inputText.length > 1) {
			var queryArray = [];
			for (let i in inputText) {
				var queryBody = inputText[i].name + ` ${inputText[i].matchType} ` + '"' + inputText[i].value + '"';
				queryArray.push(queryBody);
			}
			var queryText = queryArray.join(' and ');
		} else if (inputText.length == 1) {
			var queryText = inputText[0].name + ` ${inputText[0].matchType} ` + '"' + inputText[0].value + '"';
		} else {
			var queryText = '';
		}
		queryText = encodeURIComponent(queryText);
		var str_query = '?query=' + queryText;
		document.location = location.origin + location.pathname + str_query;
	});

	//検索リセット
	$('.searchReset').on('click', function () {
		sessionStorage.removeItem('searched');
		for (let i in searchParms.sConditions) {
			sessionStorage.removeItem(searchParms.sConditions[i].fCode);
		}
		document.location = location.origin + location.pathname;
	});

	//検索クリア
	$('.searchClear').on('click', function () {
		$('.searchInput').val('');
	});

}

// ロード中のページ表示凍結
function startLoad(msg) {
	return new Promise(function (resolve, reject) {
		if (msg == undefined) {
			msg = '処理中です';
		}
		var dispMsg = "<div class='loadingMsg'><p>" + msg + "</p></div>";
		if ($("#loading").length == 0) {
			$("body").append("<div id='loading'>" + dispMsg + "</div>");
		}
		resolve('load start');
	})
}

function endLoad() {
	return new Promise(function (resolve, reject) {
		$("#loading").remove();
		resolve('load end');
	})
}

// Modal Window
var mWindow = function () {
	var mwFrame = document.createElement('div');
	mwFrame.id = 'mwFrame';
	mwFrame.onclick = function () {
		$('#mwFrame').fadeOut();
	};
	mwFrame.classList.add('modalwindow');

	var mwArea = document.createElement('div');
	mwArea.classList.add('mwArea');
	mwArea.onclick = function (e) {
		e.stopPropagation();
	};
	mwFrame.appendChild(mwArea);

	var mwContents = document.createElement('div');
	mwContents.classList.add('mwContents');
	mwArea.appendChild(mwContents);

	var mwCloseBtn = document.createElement('div');
	mwCloseBtn.classList.add('mwCloseBtn');
	mwCloseBtn.innerHTML = '<a>X</a>';
	mwCloseBtn.onclick = function () {
		$('#mwFrame').fadeOut(1000, function () {
			$('#mwFrame').remove();
		});
	};
	mwArea.appendChild(mwCloseBtn);

	document.body.appendChild(mwFrame);

	var returnData = {
		'frame': mwFrame,
		'area': mwArea,
		'contents': mwContents
	};
	return returnData;
}

/**
 * カーテンレール特記事項用モーダルウィンドウ
 * ・該当ページのルックアップ取得ボタンを押した際に品目がKRT-DYの際にモーダルウィンドウ表示
 */
function krtSetting() {
	var mw = mWindow();
	mw.contents.innerHTML = '<p>カーテンレール設定</p>' +
		'<div class="krtInput"><label>カーテンレール全長(mm)：<input type="text" class="length"></label></div>' +
		'<div class="krtInput">開き勝手：<label class="radioLabel">(W)両開き<input type="radio" value="(W)両開き" name="openType"></label><label class="radioLabel">(S)片開き<input type="radio" value="(S)片開き" name="openType" checked></label><select name="openDetail"><option>開く方向を選択してください。</option><option>左に開ける</option><option>右に開ける</option></select></div>' +
		'<div class="krtInput">取り付け方法：<label class="radioLabel">天井<input type="radio" value="天井" name="methodType" checked></label><label class="radioLabel">壁付S<input type="radio" value="壁付S" name="methodType"></label><label class="radioLabel">壁付W<input type="radio" value="壁付W" name="methodType"></label></div>' +
		'<button id="krtSetBtn">登録</button>';
	$('#mwFrame').fadeIn();
}

/**
 * プロセス実行条件取得＆jsonに格納
 */
function setProcessCD(app_id) {
	return new Promise(async function (resolve, reject) {
		const sessionName = 'processCD_' + app_id;
		if (sessionStorage.getItem(sessionName) == null) {
			const operator = [' not in ', ' in ', ' != ', ' = '];
			await kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', {
				'app': app_id
			}).then(function (resp) {
				console.log(resp);
				let processInfo = {
					enable: resp.enable,
					processCD: {}
				};
				for (let i in resp.actions) {
					if (typeof processInfo.processCD[resp.actions[i].from] === "undefined") {
						processInfo.processCD[resp.actions[i].from] = [];
					}
					var processCDBody = {};
					processCDBody.from = resp.actions[i].from;
					processCDBody.to = resp.actions[i].to;
					processCDBody.name = resp.actions[i].name;
					processCDBody.conditions = [];
					if (resp.actions[i].filterCond.match(' and ')) {
						processCDBody.cdt = 'and';
						let cdQuery = resp.actions[i].filterCond.split(' and ');
						for (let y in cdQuery) {
							for (let z in operator) {
								if (cdQuery[y].match(operator[z])) {
									let cds = cdQuery[y].split(operator[z]);
									processCDBody.conditions.push({
										name: JSON.stringify(fields.find((v) => v.var == cds[0]).label).replace(/\"/g, ''),
										code: JSON.stringify(cds[0]).replace(/\"/g, ''),
										operator: JSON.stringify(operator[z].trim()).replace(/\"/g, ''),
										value: JSON.stringify(cds[1]).replace(/\(|\)|\"|\\|\s/g, '').split(',')
									});
									break;
								}
							}
						}
					} else if (resp.actions[i].filterCond.match(' or ')) {
						processCDBody.cdt = 'or';
						let cdQuery = resp.actions[i].filterCond.split(' or ');
						for (let y in cdQuery) {
							for (let z in operator) {
								if (cdQuery[y].match(operator[z])) {
									let cds = cdQuery[y].split(operator[z]);
									processCDBody.conditions.push({
										name: JSON.stringify(fields.find((v) => v.var == cds[0]).label).replace(/\"/g, ''),
										code: JSON.stringify(cds[0]).replace(/\"/g, ''),
										operator: JSON.stringify(operator[z].trim()).replace(/\"/g, ''),
										value: JSON.stringify(cds[1]).replace(/\(|\)|\"|\\|\s/g, '').split(',')
									});
									break;
								}
							}
						}
					} else {
						processCDBody.cdt = 'other';
						for (let z in operator) {
							if (resp.actions[i].filterCond.match(operator[z])) {
								let cds = resp.actions[i].filterCond.split(operator[z]);
								processCDBody.conditions.push({
									name: JSON.stringify(fields.find((v) => v.var == cds[0]).label).replace(/\"/g, ''),
									code: JSON.stringify(cds[0]).replace(/\"/g, ''),
									operator: JSON.stringify(operator[z].trim()).replace(/\"/g, ''),
									value: JSON.stringify(cds[1]).replace(/\(|\)|\"|\\|\s/g, '').split(',')
								});
								break;
							}
						}
					}
					processInfo.processCD[resp.actions[i].from].push(processCDBody);
				}
				sessionStorage.setItem(sessionName, JSON.stringify(processInfo));
			});
		}
		resolve(sessionName);
	})
}

/**
 * プロセスエラー処理
 * ・プロセスに設定がされている場合、それが満たされていない時アラートで条件を表示
 */
async function processError(event) {
	var sessionName = await setProcessCD(kintone.app.getId());
	var sessionData = JSON.parse(sessionStorage.getItem(sessionName));
	var cStatus = event.record.ステータス.value;
	var totalErrorCheck = [];
	var errorText = [];

	// アクション判別関数
	function actionCheck(event, sessionData, cStatus, i, j) {
		if (sessionData.processCD[cStatus][i].conditions[j].operator == '=') {
			if (event.record[sessionData.processCD[cStatus][i].conditions[j].code].value == sessionData.processCD[cStatus][i].conditions[j].value[0]) {
				return ['true'];
			} else {
				return ['false', sessionData.processCD[cStatus][i].conditions[j].name];
			}
		} else if (sessionData.processCD[cStatus][i].conditions[j].operator == '!=') {
			if (event.record[sessionData.processCD[cStatus][i].conditions[j].code].value == null) {
				event.record[sessionData.processCD[cStatus][i].conditions[j].code].value = '';
			}
			if (event.record[sessionData.processCD[cStatus][i].conditions[j].code].value != sessionData.processCD[cStatus][i].conditions[j].value[0]) {
				return ['true'];
			} else {
				return ['false', sessionData.processCD[cStatus][i].conditions[j].name];
			}
		} else if (sessionData.processCD[cStatus][i].conditions[j].operator == 'in') {
			if (Array.isArray(event.record[sessionData.processCD[cStatus][i].conditions[j].code].value)) {
				var arrayInCheck = [];
				for (let k in event.record[sessionData.processCD[cStatus][i].conditions[j].code].value) {
					if (sessionData.processCD[cStatus][i].conditions[j].value.includes(event.record[sessionData.processCD[cStatus][i].conditions[j].code].value[k])) {
						arrayInCheck.push('true');
					} else {
						arrayInCheck.push('false');
					}
				}
				if (arrayInCheck.includes('true')) {
					return ['true'];
				} else {
					return ['false', sessionData.processCD[cStatus][i].conditions[j].name];
				}
			} else {
				if (sessionData.processCD[cStatus][i].conditions[j].value.includes(event.record[sessionData.processCD[cStatus][i].conditions[j].code].value)) {
					return ['true'];
				} else {
					return ['false', sessionData.processCD[cStatus][i].conditions[j].name];
				}
			}
		} else if (sessionData.processCD[cStatus][i].conditions[j].operator == 'not in') {
			if (Array.isArray(event.record[sessionData.processCD[cStatus][i].conditions[j].code].value)) {
				var arrayNotInCheck = [];
				for (let k in event.record[sessionData.processCD[cStatus][i].conditions[j].code].value) {
					if (sessionData.processCD[cStatus][i].conditions[j].value.includes(event.record[sessionData.processCD[cStatus][i].conditions[j].code].value[k])) {
						arrayNotInCheck.push('false');
					} else {
						arrayNotInCheck.push('true');
					}
				}
				if (arrayNotInCheck.includes('false')) {
					return ['false', sessionData.processCD[cStatus][i].conditions[j].name];
				} else {
					return ['true'];
				}
			} else {
				if (sessionData.processCD[cStatus][i].conditions[j].value.includes(event.record[sessionData.processCD[cStatus][i].conditions[j].code].value)) {
					return ['false', sessionData.processCD[cStatus][i].conditions[j].name];
				} else {
					return ['true'];
				}
			}
		}
	}

	// 現在のステータスのアクション分ループ
	for (let i in sessionData.processCD[cStatus]) {
		console.log(sessionData.processCD[cStatus][i].name)
		var errorCheck = [];
		var errorName = [];
		if (sessionData.processCD[cStatus][i].conditions.length > 1) {
			if (sessionData.processCD[cStatus][i].cdt == 'and') {
				for (let j in sessionData.processCD[cStatus][i].conditions) {
					let actionReturn = actionCheck(event, sessionData, cStatus, i, j);
					if (actionReturn[0] == 'true') {
						errorCheck.push(actionReturn[0]);
					} else {
						errorCheck.push(actionReturn[0]);
						errorName.push(actionReturn[1]);
					}
				}
				if (errorCheck.includes('false')) {
					totalErrorCheck.push('false');
					var errorTextBody = `${sessionData.processCD[cStatus][i].name}実行には以下の条件が足りません\n`;
					for (let j in errorName) {
						errorTextBody += `${errorName[j]}は指定条件を満たしていません\n`;
					}
					errorText.push(errorTextBody);
				} else {
					totalErrorCheck.push('true');
				}
			} else if (sessionData.processCD[cStatus][i].cdt == 'or') {
				for (let j in sessionData.processCD[cStatus][i].conditions) {
					let actionReturn = actionCheck(event, sessionData, cStatus, i, j);
					if (actionReturn[0] == 'true') {
						errorCheck.push(actionReturn[0]);
					} else {
						errorCheck.push(actionReturn[0]);
						errorName.push(actionReturn[1]);
					}
				}
				if (errorCheck.includes('true')) {
					totalErrorCheck.push('true');
				} else {
					totalErrorCheck.push('false');
					var errorTextBody = `${sessionData.processCD[cStatus][i].name}実行には以下の条件が足りません\n`;
					for (let j in errorName) {
						errorTextBody += `${errorName[j]}は指定条件を満たしていません\n`;
					}
					errorText.push(errorTextBody);
				}
			}
		} else if (sessionData.processCD[cStatus][i].conditions.length == 1) {
			if(!sessionData.processCD[cStatus][i].name.match('admin_')){
				let actionReturn = actionCheck(event, sessionData, cStatus, i, 0);
				if (actionReturn[0] == 'true') {
					errorCheck.push(actionReturn[0]);
				} else {
					errorCheck.push(actionReturn[0]);
					errorName.push(actionReturn[1]);
				}
				if (errorCheck.includes('false')) {
					totalErrorCheck.push('false');
					var errorTextBody = `${sessionData.processCD[cStatus][i].name}実行には以下の条件が足りません\n`;
					for (let j in errorName) {
						errorTextBody += `${errorName[0]}は指定条件を満たしていません\n`;
					}
					errorText.push(errorTextBody);
				}
			}
		} else {
			console.log(`${sessionData.processCD[cStatus][i].name}はプロセス条件を指定されていません`);
			totalErrorCheck.push('true');
		}
	}
	if (totalErrorCheck.includes('false')) {
		await sessionStorage.removeItem(sessionName);
		return ['error', errorText.join('\n')];
	} else {
		await sessionStorage.removeItem(sessionName);
		return ['success', errorText.join('\n')];
	}
}

/**
 * 導入案件管理と入出荷管理のコメント同期
 * ・導入案件管理が納品準備中,製品発送済み
 * ・入出荷管理が納品情報未確定,処理中
 * ・上記のステータスの場合コメントを同期
 * ※どちらかが上のステータスでない場合同期しない
 */
$(function () {
	$('.ocean-ui-comments-commentform-submit').on('click', async function () {
		await startLoad();
		var eRecord = kintone.app.record.get();
		var prjStat = ['納品準備中', '入力内容確認中'];
		var shipStat = ['納品情報未確定', '処理中'];
		if (kintone.app.getId() == sysid.INV.app_id.shipment && eRecord.record.prjId.value != '') {
			let getPrjResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
				'app': sysid.PM.app_id.project,
				'id': eRecord.record.prjId.value
			}).then(function (resp) {
				return resp;
			}).catch(function (error) {
				console.log(error);
				return ['error', error];
			});
			if (Array.isArray(getPrjResult)) {
				alert('コメント同期の際にエラーが発生しました。');
				await endLoad();
				return;
			}

			if (shipStat.includes(eRecord.record.ステータス.value) && prjStat.includes(getPrjResult.record.ステータス.value)) {
				if ($('.ocean-ui-editor-field').html() != '' && $('.ocean-ui-editor-field').html() != '<br>') {
					let getCommentBody = {
						'app': kintone.app.getId(),
						'record': eRecord.record.$id.value
					};
					let postCommentBody = {
						'app': sysid.PM.app_id.project,
						'record': eRecord.record.prjId.value,
						'comment': {
							'text': '',
							'mentions': []
						}
					};
					await new Promise(resolve => {
						setTimeout(async function () {
							let getCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comments.json', true), 'GET', getCommentBody)
								.then(function (resp) {
									return resp;
								}).catch(function (error) {
									console.log(error);
									return ['error', error];
								});
							if (Array.isArray(getCommentResult)) {
								alert('コメント同期の際にエラーが発生しました。');
								resolve();
							}
							postCommentBody.comment.text = getCommentResult.comments[0].text;
							postCommentBody.comment.mentions = getCommentResult.comments[0].mentions;
							let postCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comment.json', true), 'POST', postCommentBody)
								.then(function (resp) {
									return resp;
								}).catch(function (error) {
									console.log(error);
									return ['error', error];
								});
							if (Array.isArray(postCommentResult)) {
								alert('コメント同期の際にエラーが発生しました。');
								resolve();
							}
							resolve();
						}, 1000)
					})
				}
			} else {
				alert('対応した案件管理レコードにはコメントは同期されません');
			}
		} else if(kintone.app.getId() == sysid.DEV.app_id.rental && eRecord.record.sys_prjId.value != ''){
			let getPrjResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
				'app': sysid.PM.app_id.project,
				'id': eRecord.record.sys_prjId.value
			}).then(function (resp) {
				return resp;
			}).catch(function (error) {
				console.log(error);
				return ['error', error];
			});
			if (Array.isArray(getPrjResult)) {
				alert('コメント同期の際にエラーが発生しました。');
				await endLoad();
				return;
			}

			if (shipStat.includes(eRecord.record.ステータス.value) && prjStat.includes(getPrjResult.record.ステータス.value)) {
				if ($('.ocean-ui-editor-field').html() != '' && $('.ocean-ui-editor-field').html() != '<br>') {
					let getCommentBody = {
						'app': kintone.app.getId(),
						'record': eRecord.record.$id.value
					};
					let postCommentBody = {
						'app': sysid.PM.app_id.project,
						'record': eRecord.record.sys_prjId.value,
						'comment': {
							'text': '',
							'mentions': []
						}
					};
					await new Promise(resolve => {
						setTimeout(async function () {
							let getCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comments.json', true), 'GET', getCommentBody)
								.then(function (resp) {
									return resp;
								}).catch(function (error) {
									console.log(error);
									return ['error', error];
								});
							if (Array.isArray(getCommentResult)) {
								alert('コメント同期の際にエラーが発生しました。');
								resolve();
							}
							postCommentBody.comment.text = getCommentResult.comments[0].text;
							postCommentBody.comment.mentions = getCommentResult.comments[0].mentions;
							let postCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comment.json', true), 'POST', postCommentBody)
								.then(function (resp) {
									return resp;
								}).catch(function (error) {
									console.log(error);
									return ['error', error];
								});
							if (Array.isArray(postCommentResult)) {
								alert('コメント同期の際にエラーが発生しました。');
								resolve();
							}
							resolve();
						}, 1000)
					})
				}
			} else {
				alert('対応した案件管理レコードにはコメントは同期されません');
			}
		}	else if (kintone.app.getId() == sysid.PM.app_id.project) {
			if(eRecord.record.sys_shipment_ID.value != ''){
				let getShipResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
					'app': sysid.INV.app_id.shipment,
					'id': eRecord.record.sys_shipment_ID.value
				}).then(function (resp) {
					return resp;
				}).catch(function (error) {
					console.log(error);
					return ['error', error];
				});
				if (Array.isArray(getShipResult)) {
					alert('コメント同期の際にエラーが発生しました。');
					await endLoad();
					return;
				}

				if (prjStat.includes(eRecord.record.ステータス.value) && shipStat.includes(getShipResult.record.ステータス.value)) {
					if ($('.ocean-ui-editor-field').html() != '' && $('.ocean-ui-editor-field').html() != '<br>') {
						let getCommentBody = {
							'app': kintone.app.getId(),
							'record': eRecord.record.$id.value
						};
						let postCommentBody = {
							'app': sysid.INV.app_id.shipment,
							'record': eRecord.record.sys_shipment_ID.value,
							'comment': {
								'text': '',
								'mentions': []
							}
						};
						await new Promise(resolve => {
							setTimeout(async function () {
								let getCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comments.json', true), 'GET', getCommentBody)
									.then(function (resp) {
										return resp;
									}).catch(function (error) {
										console.log(error);
										return ['error', error];
									});
								if (Array.isArray(getCommentResult)) {
									alert('コメント同期の際にエラーが発生しました。');
									resolve();
								}
								postCommentBody.comment.text = getCommentResult.comments[0].text;
								postCommentBody.comment.mentions = getCommentResult.comments[0].mentions;
								let postCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comment.json', true), 'POST', postCommentBody)
									.then(function (resp) {
										return resp;
									}).catch(function (error) {
										console.log(error);
										return ['error', error];
									});
								if (Array.isArray(postCommentResult)) {
									alert('コメント同期の際にエラーが発生しました。');
									resolve();
								}
								resolve();
							}, 1000)
						})
					}
				} else {
					alert('対応した入出荷管理レコードにはコメントは同期されません');
				}
			}else if(eRecord.record.sys_rent_ID.value != '' ){
				let getShipResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
					'app': sysid.DEV.app_id.rental,
					'id': eRecord.record.sys_rent_ID.value
				}).then(function (resp) {
					return resp;
				}).catch(function (error) {
					console.log(error);
					return ['error', error];
				});
				if (Array.isArray(getShipResult)) {
					alert('コメント同期の際にエラーが発生しました。');
					await endLoad();
					return;
				}

				if (prjStat.includes(eRecord.record.ステータス.value) && shipStat.includes(getShipResult.record.ステータス.value)) {
					if ($('.ocean-ui-editor-field').html() != '' && $('.ocean-ui-editor-field').html() != '<br>') {
						let getCommentBody = {
							'app': kintone.app.getId(),
							'record': eRecord.record.$id.value
						};
						let postCommentBody = {
							'app': sysid.DEV.app_id.rental,
							'record': eRecord.record.sys_rent_ID.value,
							'comment': {
								'text': '',
								'mentions': []
							}
						};
						await new Promise(resolve => {
							setTimeout(async function () {
								let getCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comments.json', true), 'GET', getCommentBody)
									.then(function (resp) {
										return resp;
									}).catch(function (error) {
										console.log(error);
										return ['error', error];
									});
								if (Array.isArray(getCommentResult)) {
									alert('コメント同期の際にエラーが発生しました。');
									resolve();
								}
								postCommentBody.comment.text = getCommentResult.comments[0].text;
								postCommentBody.comment.mentions = getCommentResult.comments[0].mentions;
								let postCommentResult = await kintone.api(kintone.api.url('/k/v1/record/comment.json', true), 'POST', postCommentBody)
									.then(function (resp) {
										return resp;
									}).catch(function (error) {
										console.log(error);
										return ['error', error];
									});
								if (Array.isArray(postCommentResult)) {
									alert('コメント同期の際にエラーが発生しました。');
									resolve();
								}
								resolve();
							}, 1000)
						})
					}
				} else {
					alert('対応した貸与管理レコードにはコメントは同期されません');
				}
			}
		}

		await endLoad();
		return;
	});
})
/** サブペーブル更新 */
async function update_sbTable(param){
	// シリアル番号Jsonを配列に変更
	let updateItems = Object.values(param.listValue);
	// パラメータエラー確認
	if(updateItems.length==0){
		console.log('stop subTable update control');
		return {result: false, error: {target: '', code: 'usbt_nosubtable'}};
	}
	for(const items of updateItems){
		for(const values of Object.values(items.updateKey_listValue)){
			if(!values.operator.match(/\+|-|\*|\/|=/) || values.operator.length>1){
				console.log('stop subTable update control');
				return {result: false, error: {target: '', code: 'usbt_wrongoperator'}};
			}
		}
	}
	let updateRecordsInfo={};
	try {
		// 更新先のレコード情報取得
		updateRecordsInfo = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {app: param.app, id: param.id})
			.then(function (resp) {
				return {
					stat: 'success',
					message: resp
				};
			}).catch(function (error) {
				console.log(error);
				throw {
					stat: 'error',
					message: error,
					code: 'usbt_undfindapporrecord',
					error: new Error()
				};
			});
		// テーブルコード確認
		if(!updateRecordsInfo.message.record[param.sbTableCode]){
			throw {
				stat: 'error',
				code: 'usbt_undfindapporrecord',
				error: new Error()
			};
		}
		// リストコード確認
		for(const lists of updateRecordsInfo.message.record[param.sbTableCode].value){
			if(!lists.value[param.listCode]){
				throw {
					stat: 'error',
					code: 'usbt_undfindapporrecord',
					error: new Error()
				};
			}
		}
	} catch(e) {
		console.log(e);
		return {result: false, error: {target: param.app, code: e.code}};
	}

	// 更新用Json作成
	let updateBody = {
		app: param.app,
		id: param.id,
		record: {
			[param.sbTableCode]: {
				value: updateRecordsInfo.message.record[param.sbTableCode].value
			}
		}
	};

	// 配列に既存であるものを入れる
	let existData=[]

	for(const lists of updateBody.record[param.sbTableCode].value){
		for(const items of updateItems){
			if(lists.value[param.listCode].value==items.updateKey_listCode){
				for(const fields of Object.values(items.updateKey_listValue)){
					let sumNum;
					// 取得した先に値がない場合0で考える
					if(!lists.value[fields.updateKey_cell].value){
						sumNum=0;
					}else{
						sumNum=parseInt(lists.value[fields.updateKey_cell].value)
					}
					if(fields.operator=='+'){
						sumNum+=parseInt(fields.value)
					} else if(fields.operator=='-'){
						sumNum-=parseInt(fields.value)
					} else if(fields.operator=='*'){
						sumNum*=parseInt(fields.value)
					} else if(fields.operator=='/'){
						sumNum/=parseInt(fields.value)
					} else if(fields.operator=='='){
						sumNum=fields.value
					} else {
						return {result: false, error: {target: param.app, code: 'usbt_unknown'}};
					}
					lists.value[fields.updateKey_cell].value = sumNum;
					existData.push(items.updateKey_listCode);
					console.log(items);
					console.log(items.updateKey_listCode);
				}
			}
		}
	}

	// サブテーブル新規追加
	if(existData.length!=updateItems.length){
		if(existData.length==0){
			for(const items of updateItems){
				sumNum=0;
				for(const fields of Object.values(items.updateKey_listValue)){
					sumNum=0;
					if(fields.operator=='+'){
						sumNum+=parseInt(fields.value)
					} else if(fields.operator=='-'){
						sumNum-=parseInt(fields.value)
					} else if(fields.operator=='*'){
						sumNum*=parseInt(fields.value)
					} else if(fields.operator=='/'){
						sumNum/=parseInt(fields.value)
					} else if(fields.operator=='='){
						sumNum=fields.value
					} else {
						return {result: false, error: {target: param.app, code: 'usbt_unknown'}};
					}
					updateBody.record[param.sbTableCode].value.push({
						value:{
							[fields.updateKey_cell]:{
								value: sumNum
							},
							[param.listCode]:{
								value: items.updateKey_listCode
							}
						}
					})
				}
			}
		} else {
			let newUpdateItems = Object.values(param.listValue)
			// 新規のデータのみを抽出
			for(let i in updateItems){
				for(const existItems of existData){
					if(updateItems[i].updateKey_listCode==existItems){
						newUpdateItems.splice(i,i+1)
					}
				}
			}
			console.log(updateItems);
			console.log(newUpdateItems);
			for(const items of newUpdateItems){
				sumNum=0;
				for(const fields of Object.values(items.updateKey_listValue)){
					sumNum=0;
					if(fields.operator=='+'){
						sumNum+=parseInt(fields.value)
					} else if(fields.operator=='-'){
						sumNum-=parseInt(fields.value)
					} else if(fields.operator=='*'){
						sumNum*=parseInt(fields.value)
					} else if(fields.operator=='/'){
						sumNum/=parseInt(fields.value)
					} else if(fields.operator=='='){
						sumNum=fields.value
					} else {
						return {result: false, error: {target: param.app, code: 'usbt_unknown'}};
					}
					updateBody.record[param.sbTableCode].value.push({
						value:{
							[fields.updateKey_cell]:{
								value: sumNum
							},
							[param.listCode]:{
								value: items.updateKey_listCode
							}
						}
					})
				}
			}
		}
	}

	// 処理結果書き込み
	let response_PUT={};
	try{
		if(Object.values(updateBody.record).length>0) {
			// console.log(items.updateKey_listCode);
			response_PUT = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateBody)
				.then(function (resp) {
					return {
						stat: 'success',
						message: resp
					};
				}).catch(function (error) {
					console.log(error);
					throw {
						stat: 'error',
						message: error,
						code: 'usbt_putwrong',
						error: new Error()
					};
				});
		}
	} catch(e) {
		console.log(e);
		return {result: false, error: {target: param.app, code: e.code}};
	}
	return {result: true, error: {target: param.app, code: response_PUT}};
}
// updateTable({
//   appid: 156,
//   recordid: 41,
//   tar_tableCode: 'mStockList',
//   tar_tableValue: {
//     tar_listCode: 'mCode',
//     tar_listValue: {
//       LS151WH:{ //行検索値
// 				mStock:{ //更新するセル対象指定
// 					operator: '+', //演算式
// 					value: 2
// 				},
// 				mName:{ //更新するセル対象指定
// 					operator: '$', //演算式
// 					value: '上書きしない' //更新値
// 				},
//       },
//       LS091WH:{ //行検索値
// 				mStock:{ //更新するセル対象指定
// 					operator: '+', //演算式
// 					value: 1
// 				},
// 				mName:{ //更新するセル対象指定
// 					operator: '$', //演算式
// 					value: 'CUBE Environmental Sensor' //更新値
// 				},
//       },
//     }
//   }
// });
async function updateTable(parm, newList){
	// パラメーター入力確認
	if(parm.appid == null) return {result: false, error:  {target: parm.appid + '-' + parm.recordid, code: 'emptyappid'}};
	if(parm.recordid == null) return {result: false, error:  {target: parm.appid + '-' + parm.recordid, code: 'emptyrecordid'}};
	// レコード取得
	const get_tableRecord = (await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {app: parm.appid, id: parm.recordid})).record[parm.tar_tableCode].value;
	console.log(get_tableRecord);
	// アップデートするデータ作成
	let putBody = { app: parm.appid, id: parm.recordid, record: { [parm.tar_tableCode]: { value: [] } } };

	let updateKeyCode = parm.tar_tableValue.tar_listCode;
	let updateKeyValue = parm.tar_tableValue.tar_listValue;
	// テーブルリストに更新対象が存在する場合演算処理し値代入、存在しない場合そのまま値代入
	get_tableRecord.forEach(list => {
		let keyCode = list.value[updateKeyCode].value;
		if(keyCode in updateKeyValue){
			// 該当行が更新対象の場合更新データを反映してから格納
			let cellValue = updateKeyValue[keyCode];
			let cellValueKeys = Object.keys(cellValue);
			console.log(cellValueKeys);
			// 演算子別処理内容
			cellValueKeys.forEach(cellCode => {
				if(cellValue[cellCode].operator == '$' && list.value[cellCode].value == '') list.value[cellCode].value = cellValue[cellCode].value;
				if(cellValue[cellCode].operator == '=') list.value[cellCode].value = cellValue[cellCode].value;
				if(cellValue[cellCode].operator == '+') list.value[cellCode].value = Number(list.value[cellCode].value) + Number(cellValue[cellCode].value);
				if(cellValue[cellCode].operator == '-') list.value[cellCode].value = Number(list.value[cellCode].value) - Number(cellValue[cellCode].value);
				if(cellValue[cellCode].operator == '*') list.value[cellCode].value = Number(list.value[cellCode].value) * Number(cellValue[cellCode].value);
				if(cellValue[cellCode].operator == '/') list.value[cellCode].value = Number(list.value[cellCode].value) / Number(cellValue[cellCode].value);
			});
			// 処理済み「parmプロパティーを削除」
			delete updateKeyValue[keyCode];
		}
		putBody.record[parm.tar_tableCode].value.push(list);
	});
	// 更新対象がテーブルリストに存在しない場合新規リスト作成
	console.log(updateKeyValue);
	let updateKeyValues = Object.keys(updateKeyValue);
	if(updateKeyValues.length > 0 && newList){
		updateKeyValues.forEach(keyValue => {
			// テーブル行を初期設定
			let list = { value: { [updateKeyCode]: { value:  keyValue} } };

			let cellValue = updateKeyValue[keyValue];
			let cellValueKeys = Object.keys(cellValue);

			// 残り値代入
			cellValueKeys.forEach(cellCode => {
				list.value[cellCode] = { value: cellValue[cellCode].value };
			});
			putBody.record[parm.tar_tableCode].value.push(list);
		});
	}
	else if(updateKeyValues.length > 0 && !newList){
		// return {result: false, error:  {target: parm.appid + '-' + parm.recordid, code: 'unknowListCode'}};
		return {result: false, error:  {target: parm.appid + '-' + parm.recordid, code: 'cannotcreatenew_mCode'}};
	}
	// データ書き込み
	console.log(putBody);
	let putResult = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', putBody);
	console.log(putResult);
	if('error' in putResult) return {result: false, error:  {target: parm.appid + '-' + parm.recordid, code: 'updateTableFaile'}};
	else return {result: true, putResult};
}

// APItokenを利用して外部からAPI実行用
const useBackdoor = (method, param, apiToken) => {
  const header = { "X-Cybozu-API-Token": apiToken };
  let uri = kintone.api.url("/k/v1/record", true);
  let body = "";
  if (typeof param === "string") {
    uri += encodeURI(param);
  } else {
    header["Content-Type"] = "application/json";
    body = param;
  }
  return kintone.proxy(uri, method, header, body);
};
