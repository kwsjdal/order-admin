<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="table_number" label="桌号" required>
        <uni-easyinput placeholder="请输入桌号" v-model="formData.table_number"></uni-easyinput>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/table-QRcode.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'table-QRcode';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  export default {
    data() {
      let formData = {
        "table_number": ""
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      /**
       * 提交表单 - 调用云对象生成小程序码
       */
      async submitForm(value) {
        try {
          const tableQRcode = uniCloud.importObject('table-QRcode')
          const result = await tableQRcode.generateQRCode(value.table_number)
          
          if (result.errCode === 0) {
            uni.showToast({
              title: '新增成功'
            })
            this.getOpenerEventChannel().emit('refreshData')
            setTimeout(() => uni.navigateBack(), 500)
          } else if (result.errCode === 'TABLE_EXISTS') {
            uni.showModal({
              content: '该桌号已存在',
              showCancel: false
            })
          } else {
            uni.showModal({
              content: result.errMsg || '生成失败',
              showCancel: false
            })
          }
        } catch (err) {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }
      }
    }
  }
</script>
