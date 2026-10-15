<script setup lang="ts">
import { ref } from 'vue'
import { emptyEventForm, saveEvent, type EventCreateForm } from '../context'

const form = ref<EventCreateForm>(emptyEventForm())
const message = ref('')
const messageKind = ref<'ok' | 'warn'>('ok')
const busy = ref(false)

const LEVEL_OPTIONS = [
  { value: 'CRITICAL', label: '重症' },
  { value: 'ACUTE', label: '急症' },
  { value: 'GENERAL', label: '一般' },
] as const

async function submit() {
  if (!form.value.task120Id.trim()) {
    messageKind.value = 'warn'
    message.value = '请填写 120 任务号后再创建事件'
    return
  }
  if (!form.value.chiefComplaint.trim()) {
    messageKind.value = 'warn'
    message.value = '请填写主诉后再创建事件'
    return
  }
  if (!form.value.pickupAddress.trim()) {
    messageKind.value = 'warn'
    message.value = '请填写接车地址后再创建事件'
    return
  }
  busy.value = true
  try {
    const msg = await saveEvent(form.value)
    messageKind.value = msg.includes('失败') ? 'warn' : 'ok'
    message.value = msg
    if (!msg.includes('失败')) form.value = emptyEventForm()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="dh-form wide" @submit.prevent="submit">
    <label>120 任务号<input v-model="form.task120Id" required placeholder="如 120-WY-88421" /></label>
    <label>事件等级
      <select v-model="form.level">
        <option v-for="o in LEVEL_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </label>
    <label class="span-2">主诉<input v-model="form.chiefComplaint" required placeholder="患者主要症状，如胸痛、呼吸困难" /></label>
    <label class="span-2">接车地址<input v-model="form.pickupAddress" required placeholder="现场地址 / 接车地点" /></label>
    <label>送达地点<input v-model="form.destination" placeholder="目标医院（选填）" /></label>
    <label>出警时间<input v-model="form.startedAt" type="datetime-local" /></label>
    <p class="dh-form-note span-2">
      创建事件即「接警建档」，初始状态为<strong>出警中</strong>；事件编号由系统自动生成（EVT-日期-序号）。
    </p>
    <div class="dh-actions span-2">
      <button type="submit" class="dh-btn primary" :disabled="busy">创建事件</button>
    </div>
    <p
      v-if="message"
      class="span-2 dh-toast"
      :class="messageKind === 'warn' ? 'dh-toast--warn' : 'dh-toast--ok'"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </p>
  </form>
</template>
