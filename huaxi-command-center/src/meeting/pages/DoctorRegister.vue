<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  name: '',
  gender: '男',
  age: '',
  phone: '',
  symptoms: '',
})
const saved = ref('')

function save() {
  const key = `draft-${Date.now()}`
  localStorage.setItem(`huaxi-er-draft-${key}`, JSON.stringify(form.value))
  saved.value = `已保存草稿 ${new Date().toLocaleTimeString()}`
}

function submit() {
  save()
  alert('演示：已写入 localStorage。生产对接 POST /api/patients')
}
</script>

<template>
  <div class="page narrow">
    <h2>急救医生 · 快速登记</h2>
    <p class="lead">
      大按钮、少字段、草稿 localStorage。院前一屏登记见
      <a href="/dispatch.html#register">dispatch.html#register</a> 与 live 页就地登记。
    </p>
    <form class="form" @submit.prevent="submit">
      <label>姓名<input v-model="form.name" required /></label>
      <label>性别
        <select v-model="form.gender"><option>男</option><option>女</option></select>
      </label>
      <label>年龄<input v-model="form.age" inputmode="numeric" /></label>
      <label>电话<input v-model="form.phone" inputmode="tel" /></label>
      <label>主诉<textarea v-model="form.symptoms" rows="3" /></label>
      <div class="actions">
        <button type="button" class="btn" @click="save">存草稿</button>
        <button type="submit" class="btn primary">提交</button>
      </div>
      <p v-if="saved" class="ok">{{ saved }}</p>
    </form>
  </div>
</template>
