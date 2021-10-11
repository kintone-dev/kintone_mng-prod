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
						purchasing: 170
					}
				},
				// Device Management
				DEV: {
					space: 22,
					app_id: {
						swap: 161,
						account_tc: 160,
						sNum: 215,
						reuse: 174
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
						reuse: 211
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
}

var prjSerchJson = {
	sID: 'eSearch',
	sPlaceholder: '総合検索',
	//matchType：likeは部分一致、=は完全一致
	sConditions: [{
			fCode: 'prjTitle',
			fName: 'タイトル',
			matchType:'like'
		},
		{
			fCode: 'invoiceNum',
			fName: '請求書番号',
			matchType:'='
		},
		{
			fCode: 'prjNum',
			fName: '案件管理番号',
			matchType:'='
		}
	]
}