<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { startPoll } from '../poll'

type Vehicle = {
  id: string
  plate: string
  status: string
  etaMinutes: number | null
  route: number[][]
}

const props = defineProps<{
  focusId?: string
  embedded?: boolean
}>()

const vehicles = ref<Vehicle[]>([])
const selectedId = ref<string | null>(null)
const root = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let stop: (() => void) | null = null
let anim: ReturnType<typeof setInterval> | null = null
let t = 0

const selected = () => vehicles.value.find((v) => v.id === selectedId.value) ?? vehicles.value[0]

async function load() {
  const data = await fetch('/api/vehicles-gps.json', { cache: 'no-store' }).then((r) => r.json())
  vehicles.value = data.vehicles
  if (props.focusId && vehicles.value.some((v) => v.id === props.focusId)) selectedId.value = props.focusId
  else if (!selectedId.value && vehicles.value.length) selectedId.value = vehicles.value[0].id
  renderMap()
}

watch(
  () => props.focusId,
  (id) => {
    if (id) {
      selectedId.value = id
      renderMap()
    }
  },
)

function renderMap() {
  if (!chart) return
  const moving = vehicles.value.filter((v) => v.route?.length > 1)
  const scatter = moving.map((v, i) => {
    const route = v.route
    const idx = Math.floor(((t + i * 0.2) % 1) * (route.length - 1))
    const p = route[idx]
    return { name: v.plate, value: [p[0], p[1]], id: v.id }
  })
  chart.setOption({
    geo: {
      map: 'weiyuan',
      roam: true,
      itemStyle: {
        areaColor: '#f1f5f9',
        borderColor: '#94a3b8',
        borderWidth: 1,
      },
      emphasis: { itemStyle: { areaColor: '#e2e8f0' } },
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatter.map((s) => ({
          name: s.name,
          value: s.value,
          symbolSize: s.id === selectedId.value ? 20 : 14,
          itemStyle: {
            color: 'rgba(0,0,0,0)',
            borderColor: s.id === selectedId.value ? '#0284c7' : '#38BDF8',
            borderWidth: 3,
          },
        })),
      },
    ],
  })
}

onMounted(async () => {
  const geo = await fetch('/maps/weiyuan.json').then((r) => r.json())
  echarts.registerMap('weiyuan', geo)
  chart = echarts.init(root.value!)
  await load()
  stop = startPoll(async () => {
    await load()
    return null
  }, () => {}, 5000)
  anim = setInterval(() => {
    t += 0.02
    renderMap()
  }, 800)
})

onUnmounted(() => {
  stop?.()
  if (anim) clearInterval(anim)
  chart?.dispose()
})
</script>

<template>
  <div :class="embedded ? 'dh-embed' : 'dh-page'">
    <template v-if="!embedded">
      <h2 class="dh-h2">车辆监控</h2>
      <p class="dh-lead">GPS 与到院 ETA（后端实时）。车内监控见右侧占位区域。</p>
    </template>
    <div class="dh-split" :class="{ embed: embedded }">
      <div class="dh-map-shell">
        <div ref="root" class="dh-map" />
      </div>
      <aside v-if="!embedded" class="dh-side">
        <ul class="dh-veh-tabs">
          <li v-for="v in vehicles" :key="v.id">
            <button type="button" :class="{ active: selectedId === v.id }" @click="selectedId = v.id">
              {{ v.plate }} · {{ v.status }}
            </button>
          </li>
        </ul>
        <template v-if="selected()">
          <p v-if="selected()!.etaMinutes != null">预计到院 <strong>{{ selected()!.etaMinutes }}</strong> 分钟</p>
          <div class="dh-video hx-video-placeholder hx-video-placeholder--block" data-hx-video="vehicle" role="status">
            <span class="hx-video-placeholder__icon" aria-hidden="true"></span>
            <strong class="hx-video-placeholder__title">车内监控</strong>
            <span class="hx-video-placeholder__hint">演示环境未接入摄像头，正式环境将显示救护车实时画面。</span>
          </div>
          <a class="dh-btn primary block" :href="`/#/consultations?plate=${encodeURIComponent(selected()!.plate)}&vehicle=${encodeURIComponent(selected()!.id)}`">发起远程会诊</a>
        </template>
      </aside>
      <div v-else class="dh-video hx-video-placeholder hx-video-placeholder--block" data-hx-video="vehicle" role="status">
        <span class="hx-video-placeholder__icon" aria-hidden="true"></span>
        <strong class="hx-video-placeholder__title">车内监控</strong>
        <span class="hx-video-placeholder__hint">演示环境未接入摄像头，正式环境将显示救护车实时画面。</span>
      </div>
    </div>
  </div>
</template>
