<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { startPoll } from '../poll'

type Dept = { id: string; name: string; total: number; occupied: number; reserved: number; free: number }

const depts = ref<Dept[]>([])
const updated = ref('')
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!window.hxBackend?.enabled?.()) throw new Error('后端接口未连接，请检查登录状态')
    await window.hxBackend.ensureAuth()
    const data = await window.hxBackend.get<{ updatedAt?: string; hospitalId?: string; departments?: Dept[] }>('/beds/by-dept')
    updated.value = data?.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')
    depts.value = Array.isArray(data?.departments) ? data.departments : []
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    depts.value = []
  } finally {
    loading.value = false
  }
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
    <h2>重症 / 科室床位监控</h2>
    <p class="lead">数据来自后端 ADT 实时同步 · 更新于 {{ updated || '—' }} · 8s 轮询</p>

    <p v-if="error" class="error">
      床位数据加载失败：{{ error }}
      <button class="retry-btn" type="button" @click="load">重试</button>
    </p>
    <p v-else-if="!loading && !depts.length" class="muted">暂无科室床位数据</p>

    <table v-show="depts.length" class="table">
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
        <tr v-for="(d, idx) in depts" :key="d.id + '-' + d.name + '-' + idx">
          <td>{{ d.name }}</td>
          <td>{{ d.total }}</td>
          <td>{{ d.occupied }}</td>
          <td>{{ d.reserved }}</td>
          <td>{{ d.free }}</td>
          <td>{{ d.total ? Math.round((d.occupied / d.total) * 100) + '%' : '—' }}</td>
        </tr>
      </tbody>
    </table>
    <p class="muted">原系统完整 UI：<a href="/#/critical">/#/critical</a></p>
  </div>
</template>

<style scoped>
.error { color: #c0392b; margin: 12px 0; }
.retry-btn { margin-left: 8px; padding: 2px 10px; border: 1px solid #c0392b; background: #fff; color: #c0392b; border-radius: 4px; cursor: pointer; font-size: 12px; }
.retry-btn:hover { background: #fdf2f2; }
</style>
