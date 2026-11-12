// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database()

module.exports = {
	_before: function () { // 通用预处理器

	},
	async generateQRCode(tableNumber) {
		if (!tableNumber) {
			return {
				errCode: 'PARAM_IS_NULL',
				errMsg: '桌号不能为空'
			}
		}
		
		// 微信小程序码 scene 参数限制：最大32个字符
		if (tableNumber.length > 32) {
			return {
				errCode: 'INVALID_PARAM',
				errMsg: '桌号长度不能超过32位'
			}
		}

		try {
			// 1. 获取 access_token
			const appId = 'wx3b127fbdadf567c0'
			const secret = '9fbd0c5546a3277af986d44bbaa068f6'
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

			// 2. 调用微信接口生成小程序码
			// 使用 wxacode.get 接口，因为它对未发布的小程序兼容性更好
			const res = await uniCloud.httpclient.request(`https://api.weixin.qq.com/wxa/getwxacode?access_token=${accessToken}`, {
				method: 'POST',
				contentType: 'json',
				data: {
					path: `pages/index/index?scene=${tableNumber}`,
					width: 430,
					env_version: 'develop'
				}
			})

			// 检查返回的是否为错误信息（JSON格式）
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

			// 检查返回的是否为二进制图片数据
			if (!res.data || res.data.length === 0) {
				return {
					errCode: 'EMPTY_BUFFER',
					errMsg: '微信接口未返回有效的图片数据'
				}
			}

			// 3. 上传到云存储
			const uploadRes = await uniCloud.uploadFile({
				cloudPath: `qrcode/table_${tableNumber}_${Date.now()}.png`,
				fileContent: res.data
			})

			// 4. 保存到数据库
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
