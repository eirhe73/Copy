<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Std = { id: string; name: string; target: string; complianceRate: number }
type Ev = { at: string; standardId: string; ok: boolean; note: string }

const version = ref('')
const standards = ref<Std[]>([])
const events = ref<Ev[]>([])

onMounted(async () => {
  const data = await fetch('/api/qc-standards.json').then((r) => r.json())
  version.value = data.version
  standards.value = data.standards
  events.value = data.recentEvents
})
</script>

<template>
  <div class="page">
    <h2>统一质控标准（{{ version }}）</h2>
    <p class="lead">持续维护版本号。完整台账：<a href="/#/medical-quality">/#/medical-quality</a></p>
    <ul class="qc-list">
      <li v-for="s in standards" :key="s.id">
        <strong>{{ s.name }}</strong>
        <span>{{ s.target }}</span>
        <em>{{ Math.round(s.complianceRate * 100) }}%</em>
      </li>
    </ul>
    <h3>近期抽检</h3>
    <ul class="ev-list">
      <li v-for="e in events" :key="e.at">
        <span :class="e.ok ? 'ok' : 'bad'">{{ e.ok ? '达标' : '未达标' }}</span>
        {{ e.at }} · {{ e.note }}
      </li>
    </ul>
  </div>
</template>
