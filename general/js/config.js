/*
// アクセスグループコントロール
function agc(){
	let sysid = set_sysid();
	var agcl={
		[sysid.PM.app_id.project]:{
			app:sysid.PM.app_id.project,
			permission:'accept/reject',
			subject:['group1','group2']
		},
		[sysid.PM.app_id.installation]:{
			app:sysid.PM.app_id.installation,
			permission:'accept/reject',
			subject:['group1','group2']
		},
		[sysid.PM.app_id.organization]:{
			app:sysid.PM.app_id.organization,
			permission:'accept/reject',
			subject:['group1','group2']
		},
		[sysid.INV.app_id.unit]:{
			app:sysid.INV.app_id.unit,
			permission:'accept/reject',
			subject:['group1','group2']
		},
		[sysid.INV.app_id.device]:{
			app:sysid.INV.app_id.device,
			permission:'accept/reject',
			subject:['group1','group2']
		},
		[sysid.INV.app_id.report]:{
			app:sysid.INV.app_id.report,
			permission:'accept/reject',
			subject:['group1','group2']
		}
	};
	return agcl;
}
*/
function set_sysid(env) {
	//スペース＆アプリ情報
	switch (env) {
		default:
			var sysid = {
				// Project Management
				PM: {
					space_id: 11,
					app_id: {
						item: 165,
						project: 133,
						installation: 76,
						organization: 75
					}
				},
				// Inventory Management
				INV: {
					space_id: 19,
					app_id: {
						unit: 156,
						device: 155,
						report: 179,
						shipment: 178,
						shipmentv2: 338,
						purchasing: 170
					}
				},
				// Device Management
				DEV: {
					space: 22,
					app_id: {
						swap: 161,
						account_tc: 160,
						sNum: 159,
						reuse: 174,
						rental: 262,
						deviceaccount: 341
					}
				},
				// Support
				SUP: {
					space_id: 13,
					app_id: {
						item: 111,
						inquiry: 95,
						onsite: 108,
						shipment: 110,
						escalation: 94,
						accident: 92
					}
				},
				// ATLAS Smart Security
				ASS: {
					space: 14,
					app_id: {
						member: 139,
						cancellation: 135,
						item: 109,
						shipment: 104
					}
				},
				ASS2: {
					space: 40,
					app_id: {
						member: 324,
						cancellation: 323,
						item: 322,
						shipment: 321
					}
				},
				prasYS: {
					apace: 48,
					app_id: {
						item: 367,
						batch: 366,
						shipment: 368,
						cancellation: 370
					}
				},
				prasYSDev: {
					apace: 47,
					app_id: {
						item: 365,
						batch: 364,
						shipment: 363,
						cancellation: 369,
					}
				}
			}
			break;
		case 'develop_sog':
			var sysid = {
				// Project Management (DEV)
				PM: {
					space_id: 26,
					app_id: {
						item: 213,
						project: 217,
						installation: 208,
						organization: 209
					}
				},
				// Inventory Management (DEV)
				INV: {
					space_id: 26,
					app_id: {
						unit: 210,
						device: 206,
						report: 205,
						shipment: 207,
						purchasing: 212
					}
				},
				// Device Management (DEV)
				DEV: {
					space: 26,
					app_id: {
						swap: 214,
						account_tc: 216,
						sNum: 215,
						reuse: 211,
						rental: 253
					}
				},
				// Support (DEV)
				SUP: {
					space_id: 31,
					app_id: {
						item: 226,
						inquiry: 227,
						onsite: 0,
						shipment: 0,
						escalation: 0,
						accident: 0
					}
				},
				// ATLAS Smart Security (DEV)
				ASS: {
					space: 30,
					app_id: {
						member: 222,
						cancellation: 225,
						item: 223,
						shipment: 224
					}
				}
			}
			break;
	}
	return sysid;
};

//案件管理
//納品依頼実行時confirm表示
var confirmSetting = [{
		'fCode': 'prjTitle',
		'fName': 'タイトル',
	},
	{
		'fCode': 'salesType',
		'fName': '提供形態',
	},
	{
		'fCode': 'prjNum',
		'fName': '案件管理番号',
	}
]

// 検索窓設定
var prjSerchJson = {
	sID: 'eSearch',
	sPlaceholder: '総合検索',
	//matchType：likeは部分一致、=は完全一致
	sConditions: [{
			fCode: 'prjTitle',
			fName: 'タイトル',
			matchType: 'like'
		},
		{
			fCode: 'invoiceNum',
			fName: '請求書番号',
			matchType: '='
		},
		{
			fCode: 'prjNum',
			fName: '案件管理番号',
			matchType: '='
		}
	]
};

// レポート除外設定
var ignoreUnitArray = ['ns-', 'KRT-DY', 'siyb'];

// 出荷数チェック対象外
var ship_uncheckList={
	mcode:/^(KRT-DY)$/,
	mtype:/^(仕掛品|付属品|パッケージ品)$/
};


/** new */

/**
 * 例外対象グループ
 * @param {string} tarApp
 * @author Jay
 */
function deadlineException(tarAppName){
	let dxceptionGroup={
		default:[
			{code: 'exc_1stDeadline', groupName:['sysAdmin','sysSetup','invAdmin','prjAdmin']},
			{code: 'exc_2ndDeadline', groupName:['sysAdmin','sysSetup','invAdmin']},
			{code: 'exc_finalDeadline', groupName:['sysAdmin','sysSetup']},
		],
		project:[
			{code: 'exc_1stDeadline', groupName:['sysAdmin','sysSetup','invAdmin','prjAdmin']},
			{code: 'exc_2ndDeadline', groupName:['sysAdmin','sysSetup','invAdmin']},
			{code: 'exc_finalDeadline', groupName:['sysAdmin']},
		]
	}
	return dxceptionGroup[tarAppName];
}
const setShiptype = {
	'移動-販売': 'newship',
	'移動-サブスク': 'newship',
	'移動-拠点間': 'all',
	'移動-ベンダー': 'all',
	'社内利用': 'internal',
	'貸与': 'auto',
	'修理・交換': 'auto',
	'返品': 'all',
	'確認中': ''
};

/**
 * エラー文言集
 * @author Jay
 */
const errorCode={
	sn_overlapping: 'シリアル番号が重複してます。',
	sn_notnewship: '販売可能な製品ではありません。',
	sn_cannotuse: '出荷可能な製品ではありません。',
	sn_nosnum: 'シリアル番号が入っていません。',
	sn_noshininfo: 'シリアル番号に入れる出荷情報が入っていません。',
	sn_wrongchecktype: 'シリアル番号確認値に問題があります。',
	sn_wrongshipment: 'シリアルの出荷ロケーションに問題があります。',
	sn_param: 'シリアル番号制御パラメータに問題があります。',
	ship_unknowtype: '出荷区分が「確認中」になっています。',
	ship_unknowshipment: '出荷ロケーションが空欄です。',
	ship_shipnumnotmuch: '出荷？処理数が一致しません。',
	unit_unkonwmCode: '拠点管理の品目コードが不明です',
	unit_failgetshipunit: '出荷ロケーション特定に失敗しました。',
	unit_filegetdestunit: '入荷ロケーション特定に失敗しました。',
	unit_unmachshipnum: '出荷品目数と処理品目数が一致しません。',
	report_noparm: '新規作成するレポートの対象月が見つかりません。',
	report_multtiple: '該当月のレポートが複数存在します。',
	renewsn_nodata: '品目リストにシリアル番号が入っていません。',
	updateMain_apiError: 'メインの更新中にエラーが発生しました',
	updateMain_notMainData: 'メインに対応するデータが存在しません',
	updateMain_alreadyShipComp: 'メインは既に出荷完了です',
	updateProject_apiError: '導入案件管理更新中にエラーが発生しました',
	updateProject_wrongSubDataStat: '分岐データのステータスが出荷完了ではありません',
	updateProject_notData: '対応するデバイスがありません',
	ctl_stock_v2_notNewShip: '新品の製品がありません',
	'ctl_stock_v2_arrival-updateError': '入荷用在庫連携のAPIが失敗しました',
	'ctl_stock_v2_shipping-updateError': '出荷用在庫連携のAPIが失敗しました',
	ctl_stock_v2_unknownError: '在庫連携で不明なエラーが発生しました',
	'ctl_report_v2_report-updateError': 'レポート連携更新APIが失敗しました',
	POST_shipData_postAPIerror: '入出荷のデータ登録に失敗しました',
	PUT_shipData_updateAPIerror: '入出荷のデータ更新に失敗しました',
	PUT_shipData_statusAPIerror: '入出荷のステータス更新に失敗しました',
	PUT_shipData_userChangeError: '入出荷のユーザー更新に失敗しました',
	notRequireData: '必要情報が入力されていません',
	unknownError: '不明なエラーが発生しました'
};

/**
 * 製品状態対応表（解約アプリで使用）
 */
const sStateMatchTable={
	'未開封': '再生品',
	'開封_補修不要': '再生品',
	'開封_補修済': '再生品',
	'再生不可': '社内用',
	'故障': '故障品',
	'返却待ち': false,
};