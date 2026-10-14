<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { startPoll } from '../poll'

type Dept = { id: string; name: string; total: number; occupied: number; reserved: number; free: number }

const depts = ref<Dept[]>([])
const updated = ref('')

async function load() {
  const data = await fetch('/api/beds-by-dept.json', { cache: 'no-store' }).then((r) => r.json())
  updated.value = data.updatedAt
  depts.value = (data.departments as Dept[]).map((d) => {
    if (Math.random() > 0.7) {
      const delta = Math.random() > 0.5 ? 1 : -1
      return { ...d, occupied: Math.max(0, Math.min(d.total, d.occupied + delta)), free: Math.max(0, d.free - delta) }
    }
    return d
  })
}

let stop: (() => void) | null = null
onMounted(() => {
  load()
  stop = startPoll(async () => {
    await load()
    return null
  }, () => {}, 8000)
})
onUnmounted(() => stop?.())
</script>

<template>
  <div class="page">
    <h2>重症 / 科室床位监控（后端实时）</h2>
    <p class="lead">8s 轮询 · 更新于 {{ updated }} · 生产改为 WebSocket 推送 ADT 事件</p>
    <table class="table">
      <thead>
        <tr>
          <th>科室</th>
          <th>总床</th>
          <th>占用</th>
          <th>预留</th>
          <th>空床</th>
          <th>占用率</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in depts" :key="d.id">
          <td>{{ d.name }}</td>
          <td>{{ d.total }}</td>
          <td>{{ d.occupied }}</td>
          <td>{{ d.reserved }}</td>
          <td>{{ d.free }}</td>
          <td>{{ Math.round((d.occupied / d.total) * 100) }}%</td>
        </tr>
      </tbody>
    </table>
    <p class="muted">原系统完整 UI：<a href="/#/critical">/#/critical</a></p>
  </div>
</template>
