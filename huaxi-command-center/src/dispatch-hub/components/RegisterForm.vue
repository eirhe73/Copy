<script setup lang="ts">
import { ref, watch } from 'vue'
import { consultHref, emptyForm, loadDraft, savePatient, type PatientForm } from '../context'

const props = defineProps<{
  seed: Partial<PatientForm>
  compact?: boolean
}>()

const form = ref<PatientForm>(emptyForm())
const message = ref('')

function applySeed(seed: Partial<PatientForm>) {
  const draft = loadDraft()
  const sameTask = draft && seed.task120Id && draft.task120Id === seed.task120Id
  const base = sameTask ? draft! : emptyForm()
  form.value = {
    ...base,
    eventId: seed.eventId || base.eventId,
    task120Id: seed.task120Id || base.task120Id,
    vehicleId: seed.vehicleId || base.vehicleId,
    vehiclePlate: seed.vehiclePlate || base.vehiclePlate,
    chiefComplaint: seed.chiefComplaint || base.chiefComplaint,
    name: sameTask ? draft!.name : seed.task120Id ? '' : draft?.name || '',
    gender: sameTask ? draft!.gender : '男',
    age: sameTask ? draft!.age : seed.task120Id ? '' : draft?.age || '',
    phone: sameTask ? draft!.phone : seed.task120Id ? '' : draft?.phone || '',
  }
  if (!seed.task120Id && !seed.eventId && draft) form.value = draft
}

watch(
  () => `${props.seed.eventId || ''}|${props.seed.task120Id || ''}|${props.seed.vehicleId || ''}`,
  () => applySeed(props.seed),
  { immediate: true },
)

const messageKind = ref<'ok' | 'warn'>('ok')

function submit() {
  if (!form.value.name.trim()) {
    messageKind.value = 'warn'
    message.value = '请填写姓名后再提交'
    return
  }
  messageKind.value = 'ok'
  message.value = savePatient(form.value, true)
}

function onDraft() {
  messageKind.value = 'ok'
  message.value = savePatient(form.value, false)
}
</script>

<template>
  <form class="dh-form wide" @submit.prevent="submit">
    <p v-if="compact && (form.task120Id || form.vehiclePlate)" class="dh-context span-2">
      当前车辆 <strong>{{ form.vehiclePlate || '未选' }}</strong>
      · 任务 <strong>{{ form.task120Id || '未关联' }}</strong>
    </p>
    <label>120 任务号<input v-model="form.task120Id" placeholder="如 120-WY-88421" /></label>
    <label>车牌<input v-model="form.vehiclePlate" placeholder="演示001" /></label>
    <label class="span-2">姓名<input v-model="form.name" required placeholder="车上直接填写" /></label>
    <label>性别
      <select v-model="form.gender"><option>男</option><option>女</option></select>
    </label>
    <label>年龄<input v-model="form.age" inputmode="numeric" /></label>
    <label class="span-2">联系电话<input v-model="form.phone" inputmode="tel" /></label>
    <label class="span-2">主诉
      <textarea v-model="form.chiefComplaint" :rows="compact ? 3 : 4" />
    </label>
    <div class="dh-actions span-2">
      <button type="button" class="dh-btn" @click="onDraft">保存草稿</button>
      <button type="submit" class="dh-btn primary">提交登记</button>
      <a class="dh-btn ghost" :href="consultHref(form)">发起远程会诊</a>
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
