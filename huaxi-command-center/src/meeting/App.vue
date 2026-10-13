<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PortalHome from './pages/PortalHome.vue'
import LayoutControl from './pages/LayoutControl.vue'
import DispatchGps from './pages/DispatchGps.vue'
import ConsultAdmission from './pages/ConsultAdmission.vue'
import BedsMonitor from './pages/BedsMonitor.vue'
import DeviceBinding from './pages/DeviceBinding.vue'
import DoctorRegister from './pages/DoctorRegister.vue'
import QcStandards from './pages/QcStandards.vue'
import ReleaseChecklist from './pages/ReleaseChecklist.vue'
import VideoBrief from './pages/VideoBrief.vue'

const hash = ref(location.hash.replace(/^#/, '') || 'home')

const page = computed(() => hash.value || 'home')

function onHash() {
  hash.value = location.hash.replace(/^#/, '') || 'home'
}

onMounted(() => window.addEventListener('hashchange', onHash))
onUnmounted(() => window.removeEventListener('hashchange', onHash))

const views: Record<string, object> = {
  home: PortalHome,
  layout: LayoutControl,
  gps: DispatchGps,
  consult: ConsultAdmission,
  beds: BedsMonitor,
  devices: DeviceBinding,
  register: DoctorRegister,
  qc: QcStandards,
  checklist: ReleaseChecklist,
  video: VideoBrief,
}

const Current = computed(() => views[page.value] ?? PortalHome)
</script>

<template>
  <div class="meeting-app">
    <header v-if="page !== 'home'" class="meeting-top">
      <a href="#home" class="back">← 会议交付清单</a>
      <a href="/#/" class="muted">指挥中枢</a>
      <a href="/gis-command.html" class="muted">GIS 大屏</a>
    </header>
    <component :is="Current" />
    <footer class="meeting-demo-foot">
      演示数据 · 非实时 HIS / 120 · 非临床统计（Mock），正式环境对接院方接口。
    </footer>
  </div>
</template>
