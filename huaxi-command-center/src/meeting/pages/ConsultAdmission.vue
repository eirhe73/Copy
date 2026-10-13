<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Session = {
  sessionId: string
  mode: string
  compatible120: boolean
  patient: { name: string; gender: string; age: number; chiefComplaint: string; task120Id: string }
  hospital: string
  department: string
  status: string
  participants: { role: string; name: string; online: boolean }[]
}

const session = ref<Session | null>(null)
const note = ref('')
const inCall = ref(false)

onMounted(async () => {
  session.value = await fetch('/api/consultation-admission.json').then((r) => r.json())
  note.value = localStorage.getItem('huaxi-consult-note-demo') || ''
})

function startStandalone() {
  inCall.value = true
  if (session.value) session.value.status = 'in-call'
}

async function saveNote() {
  localStorage.setItem('huaxi-consult-note-demo', note.value)
  const token = session.value?.sessionId
  if (token && window.hxBackend?.enabled?.()) {
    try {
      await window.hxBackend.ensureAuth()
      await window.hxBackend.post(`/rooms/${encodeURIComponent(token)}/opinions`, {
        content: note.value,
        authorRole: 'doctor',
      })
    } catch (e) {
      console.warn('会诊意见 API', e)
    }
  }
}
</script>

<template>
  <div class="page consult-page" v-if="session">
    <h2>入院远程会诊（独立运行演示）</h2>
    <p class="lead">
      模式 <code>{{ session.mode }}</code> · 120 任务号 <strong>{{ session.patient.task120Id }}</strong> ·
      {{ session.compatible120 ? '可与院前任务兼容' : '不兼容 120' }}。线上列表：
      <a href="/#/consultations">远程会诊</a> · 院前：
      <a href="/dispatch.html#live">实时出警</a>
    </p>
    <p class="demo-badge">演示环境 · 音视频为占位，非商用 RTC；意见保存至本地。</p>
    <div class="split consult-split">
      <div class="video-placeholder consult-video" :class="{ live: inCall }">
        <span v-if="!inCall">会诊画面区（生产接 WebRTC / 第三方 RTC）</span>
        <span v-else>演示通话中 · 无真实媒体流</span>
      </div>
      <div class="side">
        <h3>{{ session.patient.name }} · {{ session.patient.gender }} · {{ session.patient.age }} 岁</h3>
        <p>{{ session.hospital }} · {{ session.department }}</p>
        <p>{{ session.patient.chiefComplaint }}</p>
        <ul class="participants">
          <li v-for="p in session.participants" :key="p.role">
            {{ p.role }}：{{ p.name }}
            <span :class="p.online ? 'ok' : 'off'">{{ p.online ? '在线' : '离线' }}</span>
          </li>
        </ul>
        <button type="button" class="btn primary" @click="startStandalone">
          {{ inCall ? '演示通话中…' : '开始会诊（演示）' }}
        </button>
        <textarea v-model="note" rows="4" placeholder="会诊意见…" />
        <button type="button" class="btn" @click="saveNote">保存意见到本地</button>
      </div>
    </div>
  </div>
</template>
