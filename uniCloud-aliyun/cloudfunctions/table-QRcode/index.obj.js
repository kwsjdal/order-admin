const db = uniCloud.database()

module.exports = {
	_before: function () {

	},
	async generateQRCode(tableNumber) {
		if (!tableNumber) {
			return {
				errCode: 'PARAM_IS_NULL',
				errMsg: '桌号不能为空'
			}
		}

		if (tableNumber.length > 32) {
			return {
				errCode: 'INVALID_PARAM',
				errMsg: '桌号长度不能超过32位'
			}
		}

		try {
			const appId = 'wx034a41aad309ce25'
			const secret = 'YOUR_WX_APPSECRET'
			const tokenRes = await uniCloud.httpclient.request('https://api.weixin.qq.com/cgi-bin/token', {
				method: 'GET',
				data: {
					grant_type: 'client_credential',
					appid: appId,
					secret: secret
				},
				dataType: 'json'
			})

			if (!tokenRes.data || !tokenRes.data.access_token) {
				return {
					errCode: 'GET_TOKEN_FAILED',
					errMsg: tokenRes.data.errmsg || '获取微信 access_token 失败'
				}
			}
			const accessToken = tokenRes.data.access_token

			const res = await uniCloud.httpclient.request(`https://api.weixin.qq.com/wxa/getwxacode?access_token=${accessToken}`, {
				method: 'POST',
				contentType: 'json',
				data: {
					path: `pages/index/index?scene=${tableNumber}`,
					width: 430,
					env_version: 'develop'
				}
			})

			const contentType = res.headers['content-type'] || ''
			if (contentType.indexOf('application/json') > -1) {
				const errData = JSON.parse(res.data.toString())
				return {
					errCode: errData.errcode,
					errMsg: errData.errmsg || '生成小程序码失败',
					rid: errData.rid,
					help: '如果显示 invalid url，请确保小程序已在后台配置服务器域名，或尝试发布一个版本'
				}
			}

			if (!res.data || res.data.length === 0) {
				return {
					errCode: 'EMPTY_BUFFER',
					errMsg: '微信接口未返回有效的图片数据'
				}
			}

			const uploadRes = await uniCloud.uploadFile({
				cloudPath: `qrcode/table_${tableNumber}_${Date.now()}.png`,
				fileContent: res.data
			})

			const addRes = await db.collection('table-QRcode').add({
				table_number: tableNumber,
				qr_code_url: uploadRes.fileID,
				create_date: Date.now()
			})

			return {
				errCode: 0,
				errMsg: '生成成功',
				qrCodeUrl: uploadRes.fileID,
				id: addRes.id
			}
		} catch (e) {
			return {
				errCode: 'SYSTEM_ERROR',
				errMsg: e.message
			}
		}
	}
}