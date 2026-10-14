<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AmbulanceList from './pages/AmbulanceList.vue'
import EventsList from './pages/EventsList.vue'
import LiveDispatch from './pages/LiveDispatch.vue'
import PatientRegister from './pages/PatientRegister.vue'
import { hashQuery, tabFromHash, type TabId } from './context'

const embed = computed(
  () => hashQuery().get('embed') === '1' || (typeof window !== 'undefined' && window.parent !== window),
)

const tabs = [
  { id: 'live', label: '实时出警', hint: '选中车辆就地登记' },
  { id: 'events', label: '急救事件', hint: '一次出车一条事件' },
  { id: 'ambulances', label: '救护车列表', hint: '绑定与状态' },
  { id: 'register', label: '患者登记', hint: '医生一屏录入' },
] as const

const hash = ref<TabId>('live')

function sync() {
  const id = tabFromHash()
  if (id === 'monitor') {
    const q = location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?')) : ''
    location.replace(`#live${q}`)
    hash.value = 'live'
    return
  }
  hash.value = id
}

onMounted(() => {
  if (!location.hash || location.hash === '#') location.hash = '#live'
  sync()
  window.addEventListener('hashchange', sync)
})

onUnmounted(() => window.removeEventListener('hashchange', sync))

const Current = computed(() => {
  const map = {
    live: LiveDispatch,
    events: EventsList,
    ambulances: AmbulanceList,
    register: PatientRegister,
  } as const
  return map[hash.value]
})
</script>

<template>
  <div class="dh-app" :class="{ 'dh-app--embed': embed }">
    <header v-if="!embed" class="dh-header">
      <div class="dh-brand">
        <h1>120 急救调度</h1>
        <p>重症出诊 · 出警、事件、车辆、登记</p>
      </div>
      <nav class="dh-tabs" aria-label="调度子页">
        <a
          v-for="t in tabs"
          :key="t.id"
          :href="`#${t.id}`"
          class="dh-tab"
          :class="{ active: hash === t.id }"
          :title="t.hint"
        >
          {{ t.label }}
        </a>
      </nav>
      <div class="dh-links">
        <a href="/app.html#/consultations">远程会诊</a>
        <a href="/app.html#/transfers">转诊交接</a>
        <a class="dh-back" href="/app.html#/">返回指挥中枢</a>
      </div>
    </header>
    <main class="dh-main" :class="{ 'dh-main--embed': embed }">
      <component :is="Current" />
    </main>
  </div>
</template>
