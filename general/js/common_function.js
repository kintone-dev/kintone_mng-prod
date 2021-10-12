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
	for (var sl in selectValue) {
		var sOption = document.createElement('option');
		sOption.innerText = selectValue[sl];
		headerSelect.appendChild(sOption);
	}
	kintone.app.record.getHeaderMenuSpaceElement().appendChild(headerSelect);
	return headerSelect;
}

// tabメニューをULで作成
function tabMenu(tabID, tabList) {
	var tMenu = document.createElement('ul'); //ul要素作成
	tMenu.id = tabID; //リストにID追加
	tMenu.classList.add(tabID); //リストにCSS追加
	tMenu.classList.add('tabMenu'); //リストにCSS追加
	for (var tl in tabList) { //繰り返しli要素とその中身を作成
		var tList = document.createElement('li'); //li要素作成
		var aLink = document.createElement('a'); //a要素作成
		aLink.setAttribute('href', '#' + tabList[tl]); //a要素に詳細を追加
		aLink.innerText = tabList[tl]; //a要素の表示名
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
		for (var fi in copy_fCode) { //ループさせデータ格納
			sessionStorage.removeItem(copy_fCode[fi]); //同じ名称のSessionStorageを削除
			sessionStorage.setItem(copy_fCode[fi], copy_value[fi]); //値をSessionStorageに格納する
		}
	} else { //配列以外の場合のアクション
		sessionStorage.removeItem(copy_fCode); //同じ名称のSessionStorageを削除
		sessionStorage.setItem(copy_fCode, copy_value); //値をSessionStorageに格納する
	}
	// window.open('https://accel-lab.cybozu.com/k/' + tarAPP_id + '/edit', '_blank'); //該当アプリの新規レコード作成画面を開く
	window.open('https://accel-lab.cybozu.com/k/' + tarAPP_id + '/edit', Math.random() + '-newWindow', 'scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=1000,height=600,left=300,top=200'); //該当アプリの新規レコード作成画面を開く

	if (Array.isArray(copy_fCode)) { //配列の場合のアクション
		for (var fr in copy_fCode) {
			sessionStorage.removeItem(copy_fCode[fr]);
		} //同じ名称のSessionStorageを削除
	} else {
		sessionStorage.removeItem(copy_fCode); //同じ名称のSessionStorageを削除
	}
}

// シリアル番号取得
var sNumRecords = function (Value, fType) {
	var sNs = [];
	switch (fType) {
		case 'table':
			for (var ti in Value) {
				var sn = Value[ti].value.sNum.value; //シリアル番号データを取り出す
				var snArray = sn.split(/\r\n|\n/); //シリアル番号を改行を持って、区切り、配列にする
				var sns = snArray.filter(Boolean); //配列順番を反転
				for (var sni in sns) {
					sNs.push(sns[sni]);
				}
			}
			break;
		case 'text':
			//var sn=Value[ti].value.sNum.value; //シリアル番号データを取り出す
			var snArray = Value.split(/\r\n|\n/); //シリアル番号を改行を持って、区切り、配列にする
			sNs = snArray.filter(Boolean);
			break;
	}
	return sNs;
};

// パスワードジェネレーター
var pw_generator = function (len) {
	var letters = 'abcdefghjklmnpqrstuvwxyz'; //パスワードに使用する文字列群
	var numbers = '0123456789'; //パスワードに使用する数字群
	var symbols = '~!@#$%^&*()_+={}[:;<>,.?'; //パスワードに使用する記号群
	var string = letters + letters.toUpperCase() + numbers + symbols; //小文字を大文字に変換

	var pw_req = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[~!@#$%^&*()_+={}[:;<>,.?])[a-zA-Z0-9~!@#$%^&*()_+={}[:;<>,.?]+$/); //パスワード条件

	var pw;
	while (true) { //条件を果たすまでパスワードを繰り返し作成
		pw = ''; //パスワードをクリア
		for (var i = 0; i < len; i++) {
			pw += string.charAt(Math.floor(Math.random() * string.length));
		} //パスワード生成
		var ck_pw_req = pw_req.exec(pw); //生成したパスワードが条件を満たすか確認
		if (ck_pw_req) break; //生成したパスワードが条件を満たす場合のみ繰り返し中止
	}
	return pw;
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
	var truck = ['カーテンレール（DY）2000', Math.ceil(truckLength / 2000) * spec.shipNum];
	var ConnectingKit = ['Connecting Kit', Math.ceil(truckLength / 2000 - 1) * spec.shipNum];
	var RubberBelt = ['ラバーベルト', Math.ceil((truckLength * 2 + 240) / 1000) * spec.shipNum];
	var Carriers = ['ランナー', Math.round(truckLength / 125)];
	if (spec.rType.match(/[wW]/)) Carriers[1] = Math.ceil(Carriers[1] / 2) * 2 * spec.shipNum;
	else Carriers[1] = Carriers[1] * spec.shipNum;
	var CeilingBracket = ['', Math.round(spec.rLength / 500 + 1) * spec.shipNum];
	if (spec.rMethod == '天井') CeilingBracket[0] = '取付金具(D)';
	else if (spec.rMethod.match(/壁付/)) CeilingBracket[0] = '取付金具';
	var MasterCarrier = ['マスターキャリアー', 1 * spec.shipNum];
	if (ConnectingKit[1] > 0) MasterCarrier[0] = 'マスターキャリアー連結レール用(G)';
	var BeltClip = ['ベルトアタッチメント', 2 * spec.shipNum];
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
			mname: 'L字金具',
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
		mname: 'バンパー＋クッション',
		shipnum: 2 * spec.shipNum
	})
	var railComp = [];
	for (var i in railDetail) {
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
const postRecords = async (sendApp, records) => {
	const POST_RECORDS = records;
	while (POST_RECORDS.length) {
		var postBody = {
			'app': sendApp,
			'records': POST_RECORDS.slice(0, 100),
		}
		var postResult = await kintone.api(kintone.api.url('/k/v1/records', true), "POST", postBody)
			.then(function (resp) {
				console.log(postBody);
				return 'success';
			}).catch(function (error) {
				console.log(error);
				return 'error';
			});
		if (putResult == 'error') {
			throw new Error('error');
		}
		POST_RECORDS.splice(0, 100);
	}
}

// 100件以上のレコード更新
const putRecords = async (sendApp, records) => {
	const PUT_RECORDS = records;
	while (PUT_RECORDS.length) {
		var putBody = {
			'app': sendApp,
			'records': PUT_RECORDS.slice(0, 100),
		}
		var putResult = await kintone.api(kintone.api.url('/k/v1/records', true), "PUT", putBody)
			.then(function (resp) {
				console.log(putBody);
				return 'success';
			}).catch(function (error) {
				console.log(error);
				return 'error';
			});
		if (putResult == 'error') {
			throw new Error('error');
		}
		PUT_RECORDS.splice(0, 100);
	}
}

// 100件以上のレコード削除
const deleteRecords = async (sendApp, records) => {
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
		if (putResult == 'error') {
			throw new Error('error');
		}
		DELETE_RECORDS.splice(0, 100);
	}
}

/**
 * 指定月のレポートが締切の場合エラー表示
 * @param {*} reportDate 判別したいレポートの月 例)202109
 * @returns
 */
async function checkEoMReport(reportDate) {
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
	if (reportData.records.length != 0) {
		for (var i in reportData.records[0].EoMcheck.value) {
			if (reportData.records[0].EoMcheck.value[i] == '締切') {
				return false;
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
		var sendDate = event.record.sendDate.value;
		sendDate = sendDate.replace(/-/g, '');
		sendDate = sendDate.slice(0, -2);
		stockData.date = sendDate;
		//レポート用日付作成 end
		if (event.nextStatus) {
			if (event.nextStatus.value == '集荷待ち') {
				var arrivalShipType = ['移動-販売', '移動-サブスク', '販売', 'サブスク', '移動-拠点間', '移動-ベンダー'];
				for (var i in event.record.deviceList.value) {
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
				var arrivalShipType_dist = ['移動-販売', '移動-サブスク', '販売', 'サブスク'];
				var arrivalShipType_arr = ['移動-拠点間', '移動-ベンダー'];
				for (var i in event.record.deviceList.value) {
					// 出荷情報を作成
					var stockShipBody = {
						'arrOrShip': 'ship',
						'devCode': event.record.deviceList.value[i].value.mCode.value,
						'uniCode': event.record.sys_shipmentCode.value,
						'stockNum': event.record.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockShipBody);
					if (arrivalShipType_dist.includes(event.record.shipType.value)) { // 出荷区分がarrivalShipType_distに含まれる場合のみ入荷情報を作成
						var stockArrBody = {
							'arrOrShip': 'arr',
							'devCode': event.record.deviceList.value[i].value.mCode.value,
							'uniCode': 'distribute',
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
		stockData.date = event.record.sys_invoiceDate.value;
		var distributeSalesType = ['販売', 'サブスク'];
		if (distributeSalesType.includes(event.record.salesType.value)) {
			for (var i in event.record.deviceList.value) {
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
		for (var i in event.record.arrivalList.value) {
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
		var arrCompAddType = ['デバイス追加', '故障交換（保証期間外）'];
		if (event.working_status.value == '出荷完了') {
			for (var i in event.deviceList.value) { //出荷、入荷情報をセット
				//出荷情報はForNeedsから
				var stockShipBody = {
					'arrOrShip': 'ship',
					'devCode': event.deviceList.value[i].value.mCode.value,
					'uniCode': 'forNeeds',
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
			if (event.application_type.value == '新規申込') {
				// function getNowDate() {
				// 	return $.ajax({
				// 		type: 'GET',
				// 		async: false
				// 	}).done(function (data, status, xhr) {
				// 		return xhr;
				// 	});
				// }
				// var currentDate = new Date(getNowDate().getResponseHeader('Date'));
				// var arrDate = new Date(event.arrival_datetime.value);
				// var dateComp = currentDate.getTime() - arrDate.getTime();
				// // 着荷日から7日以上立っている場合
				// if (dateComp > 604800 * 1000) {
				// 	for (var j in event.deviceList.value) { //出荷情報をセット
				// 		//出荷情報は積送ASSから
				// 		var stockShipBody = {
				// 			'arrOrShip': 'ship',
				// 			'devCode': event.deviceList.value[j].value.mCode.value,
				// 			'uniCode': 'distribute-ASS',
				// 			'stockNum': event.deviceList.value[j].value.shipNum.value
				// 		};
				// 		stockData.ship.push(stockShipBody);
				// 	}
				// }
			} else if (arrCompAddType.includes(event.application_type.value)) {
				for (var i in event.deviceList.value) { //出荷情報をセット
					//出荷情報は積送ASSから
					var stockShipBody = {
						'arrOrShip': 'ship',
						'devCode': event.deviceList.value[i].value.mCode.value,
						'uniCode': 'distribute-ASS',
						'stockNum': event.deviceList.value[i].value.shipNum.value
					};
					stockData.ship.push(stockShipBody);
				}
			}
		}
		return stockData;
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
	console.log(stockData);
	/* 商品管理情報取得 */
	//商品管理クエリ作成
	var devQuery = [];
	for (var i in stockData.arr) {
		devQuery.push('"' + stockData.arr[i].devCode + '"');
	}
	for (var i in stockData.ship) {
		devQuery.push('"' + stockData.ship[i].devCode + '"');
	}
	// 配列内の重複した要素の削除
	devQuery = Array.from(new Set(devQuery));
	var getDeviceBody = {
		'app': sysid.INV.app_id.device,
		'query': 'mCode in (' + devQuery.join() + ')'
	};
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
	for (var i in stockData.arr) {
		uniQuery.push('"' + stockData.arr[i].uniCode + '"');
	}
	for (var i in stockData.ship) {
		uniQuery.push('"' + stockData.ship[i].uniCode + '"');
	}
	// 配列内の重複した要素の削除
	uniQuery = Array.from(new Set(uniQuery));
	var getUnitBody = {
		'app': sysid.INV.app_id.unit,
		'query': 'uCode in (' + uniQuery.join() + ')'
	};
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
	for (var i in deviceRecords.records) {
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
	for (var i in deviceStockData) {
		for (var j in deviceStockData[i].record.uStockList.value) {
			for (var k in stockData.arr) {
				if (stockData.arr[k].devCode == deviceStockData[i].updateKey.value && stockData.arr[k].uniCode == deviceStockData[i].record.uStockList.value[j].value.uCode.value) {
					deviceStockData[i].record.uStockList.value[j].value.uStock.value = parseInt(deviceStockData[i].record.uStockList.value[j].value.uStock.value || 0) + parseInt(stockData.arr[k].stockNum || 0);
				}
			}
		}
	}

	// 商品管理、出荷情報挿入 (指定数分-する)
	for (var i in deviceStockData) {
		for (var j in deviceStockData[i].record.uStockList.value) {
			for (var k in stockData.ship) {
				if (stockData.ship[k].devCode == deviceStockData[i].updateKey.value && stockData.ship[k].uniCode == deviceStockData[i].record.uStockList.value[j].value.uCode.value) {
					deviceStockData[i].record.uStockList.value[j].value.uStock.value = parseInt(deviceStockData[i].record.uStockList.value[j].value.uStock.value || 0) - parseInt(stockData.ship[k].stockNum || 0);
				}
			}
		}
	}

	// 仕入管理の場合のみ商品管理jsonに在庫情報を入れる
	if (stockData.appId == sysid.INV.app_id.purchasing) {
		for (var i in deviceStockData) {
			for (var j in stockData.arr) {
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
	for (var i in unitRecords.records) {
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
	for (var i in unitStockData) {
		for (var j in unitStockData[i].record.mStockList.value) {
			for (var k in stockData.arr) {
				if (stockData.arr[k].uniCode == unitStockData[i].updateKey.value && stockData.arr[k].devCode == unitStockData[i].record.mStockList.value[j].value.mCode.value) {
					unitStockData[i].record.mStockList.value[j].value.mStock.value = parseInt(unitStockData[i].record.mStockList.value[j].value.mStock.value || 0) + parseInt(stockData.arr[k].stockNum || 0);
				}
			}
		}
	}
	// 拠点管理、出荷情報挿入 (指定数分-する)
	for (var i in unitStockData) {
		for (var j in unitStockData[i].record.mStockList.value) {
			for (var k in stockData.ship) {
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

/* レポート処理 */
/**
 * createStockJsonから月次レポートに情報を挿入
 * @param {*} event kintone event
 * @param {*} appId 関数を使ったアプリのID
 * @returns json
 */
async function reportCtrl(event, appId) {
	var stockData = createStockJson(event, appId);
	console.log(stockData);

	/* 月次レポート情報取得 */
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
	/* 月次レポート情報取得 end */

	/* レポート更新用情報作成 */
	var reportUpdateData = [];
	var getUniNameArray = [];
	for (var i in stockData.arr) {
		var reportUpdateBody = {
			'arrOrShip': stockData.arr[i].arrOrShip,
			'sysCode': stockData.arr[i].devCode + '-' + stockData.arr[i].uniCode,
			'devCode': stockData.arr[i].devCode,
			'uniCode': stockData.arr[i].uniCode,
			'stockNum': stockData.arr[i].stockNum
		};
		getUniNameArray.push('"' + stockData.arr[i].uniCode + '"');
		reportUpdateData.push(reportUpdateBody);
	}
	for (var i in stockData.ship) {
		var reportUpdateBody = {
			'arrOrShip': stockData.ship[i].arrOrShip,
			'sysCode': stockData.ship[i].devCode + '-' + stockData.ship[i].uniCode,
			'devCode': stockData.ship[i].devCode,
			'uniCode': stockData.ship[i].uniCode,
			'stockNum': stockData.ship[i].stockNum
		};
		getUniNameArray.push('"' + stockData.ship[i].uniCode + '"');
		reportUpdateData.push(reportUpdateBody);
	}
	getUniNameArray = Array.from(new Set(getUniNameArray));

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
	for (var i in reportUpdateData) {
		for (var j in unitRecords.records) {
			if (reportUpdateData[i].uniCode == unitRecords.records[j].uCode.value) {
				reportUpdateData[i].uName = unitRecords.records[j].uName.value;
			}
		}
	}
	/* レポート更新用情報作成 end */

	if (reportRecords.records.length != 0) { //対応したレポートがある場合
		// 情報更新用配列
		var putReportData = [];
		//更新レポート情報作成
		var putReportBody = {
			'id': reportRecords.records[0].$id.value,
			'record': {
				'inventoryList': {
					'value': reportRecords.records[0].inventoryList.value
				}
			}
		};
		for (var i in reportUpdateData) {
			if (putReportBody.record.inventoryList.value.some(item => item.value.sys_code.value === reportUpdateData[i].sysCode)) {
				for (var j in putReportBody.record.inventoryList.value) {
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
							'sys_code': {
								'value': reportUpdateData[i].sysCode
							},
							'mCode': {
								'value': reportUpdateData[i].devCode
							},
							'stockLocation': {
								'value': reportUpdateData[i].uName
							},
							'shipNum': {
								'value': reportUpdateData[i].stockNum
							}
						}
					}
				} else if (reportUpdateData[i].arrOrShip == 'arr') {
					var newReportListBody = {
						'value': {
							'sys_code': {
								'value': reportUpdateData[i].sysCode
							},
							'mCode': {
								'value': reportUpdateData[i].devCode
							},
							'stockLocation': {
								'value': reportUpdateData[i].uName
							},
							'arrivalNum': {
								'value': reportUpdateData[i].stockNum
							}
						}
					};
				}
				putReportBody.record.inventoryList.value.push(newReportListBody);
			}
		}
		putReportData.push(putReportBody);
		//レポート更新
		var putReport = {
			'app': sysid.INV.app_id.report,
			'records': putReportData,
		}
		await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', putReport)
			.then(function (resp) {
				return resp;
			}).catch(function (error) {
				console.log(error);
				return error;
			});
	} else { //対応したレポートがない場合
		//レポート新規作成
		var postReportData = [];
		var postReportBody = {
			'invoiceYears': {
				'value': stockData.date.slice(0, -2)
			},
			'invoiceMonth': {
				'value': stockData.date.slice(4)
			},
			'inventoryList': {
				'value': []
			}
		};

		// レポート更新情報をリストに格納
		for (var i in reportUpdateData) {
			if (reportUpdateData[i].arrOrShip == 'ship') {
				var newReportListBody = {
					'value': {
						'sys_code': {
							'value': reportUpdateData[i].sysCode
						},
						'mCode': {
							'value': reportUpdateData[i].devCode
						},
						'stockLocation': {
							'value': reportUpdateData[i].uName
						},
						'shipNum': {
							'value': reportUpdateData[i].stockNum
						}
					}
				};
			} else if (reportUpdateData[i].arrOrShip == 'arr') {
				var newReportListBody = {
					'value': {
						'sys_code': {
							'value': reportUpdateData[i].sysCode
						},
						'mCode': {
							'value': reportUpdateData[i].devCode
						},
						'stockLocation': {
							'value': reportUpdateData[i].uName
						},
						'arrivalNum': {
							'value': reportUpdateData[i].stockNum
						}
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

	console.log(putReportData);
	console.log(postReportData);

	return reportUpdateData;
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
	for (var i in shipTable) {
		if (numRegExp.test(shipTable[i].value.shipNum.value)) {
			shipNum = shipTable[i].value.shipNum.value;
			shipTable[i].value.shipNum.error = null;
		} else {
			shipTable[i].value.shipNum.error = '入力形式が間違えています';
		}
	}

	// 対応商品取得
	var calDeviceQuery = [];
	for (var i in shipTable) {
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

	for (var i in shipTable) {
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
				for (var j in railSpecs) {
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
				for (var j in railItems) {
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
				for (var j in calDevice.records) {
					if (shipTable[i].value.mCode.value == calDevice.records[j].mCode.value) {
						for (var k in calDevice.records[j].packageComp.value) {
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
	for (var i in eRecord.record.deviceList.value) {
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
	esCloseBtn.innerHTML = '<p>×</p>';
	var dsCloseBtn = document.createElement('div');
	dsCloseBtn.classList.add('searchClose');
	dsCloseBtn.innerHTML = '<p>×</p>';

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
		for (var i in searchParms.sConditions) {
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
			for (var i in inputText) {
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
		for (var i in searchParms.sConditions) {
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
			for (var i in inputText) {
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
		for (var i in searchParms.sConditions) {
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
	if (msg == undefined) {
		msg = '処理中です';
	}
	var dispMsg = "<div class='loadingMsg'><p>" + msg + "</p></div>";
	if ($("#loading").length == 0) {
		$("body").append("<div id='loading'>" + dispMsg + "</div>");
	}
}

function endLoad() {
	$("#loading").remove();
}