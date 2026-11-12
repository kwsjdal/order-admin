<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="table_number" label="桌号">
        <uni-easyinput placeholder="桌号" v-model="formData.table_number"></uni-easyinput>
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
  const tableQRCodeObj = uniCloud.importObject('table-QRcode');

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
       * 提交表单
       */
      async submitForm(value) {
        try {
          const res = await tableQRCodeObj.generateQRCode(value.table_number);
          if (res.errCode === 0) {
            uni.showToast({
              title: '新增成功'
            })
            this.getOpenerEventChannel().emit('refreshData')
            setTimeout(() => uni.navigateBack(), 500)
          } else {
            uni.showModal({
              content: res.errMsg || '生成失败',
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
