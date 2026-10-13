<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref } from 'vue'
import { startPoll } from '../poll'

type Vehicle = {
  id: string
  plate: string
  status: string
  lng: number
  lat: number
  etaMinutes: number | null
  route: number[][]
}

const list = ref<Vehicle[]>([])
const root = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let stop: (() => void) | null = null
let anim: ReturnType<typeof setInterval> | null = null
let t = 0

async function load() {
  const res = await fetch('/api/vehicles-gps.json', { cache: 'no-store' })
  const data = await res.json()
  list.value = data.vehicles as Vehicle[]
  renderMap()
}

function renderMap() {
  if (!chart) return
  const moving = list.value.filter((v) => v.route?.length > 1)
  const scatter = moving.map((v, i) => {
    const route = v.route
    const idx = Math.floor((t + i * 0.2) % 1 * (route.length - 1))
    const p = route[idx]
    return { name: v.plate, value: [p[0], p[1]], id: v.id, eta: v.etaMinutes }
  })
  chart.setOption({
    geo: {
      map: 'weiyuan',
      roam: true,
      itemStyle: { areaColor: '#F7FBFF', borderColor: '#CBD5E1', borderWidth: 1 },
      emphasis: { itemStyle: { areaColor: 'rgba(56,189,248,0.04)' } },
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: 'circle',
        data: scatter.map((s) => ({
          name: s.name,
          value: s.value,
          symbolSize: 16,
          itemStyle: { color: 'rgba(0,0,0,0)', borderColor: '#38BDF8', borderWidth: 3 },
        })),
      },
    ],
  })
}

onMounted(async () => {
  const geo = await fetch('/maps/weiyuan.json').then((r) => r.json())
  echarts.registerMap('weiyuan', geo)
  chart = echarts.init(root.value!)
  t = 0
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
  <div class="page">
    <h2>120 车辆 GPS + 预计到达（Mock）</h2>
    <p class="lead">每 5s 拉取 <code>/api/vehicles-gps.json</code>；地图为 2D 圆点沿 route 插值移动。接生产时替换为 WebSocket。</p>
    <div class="split">
      <div ref="root" class="map-box" />
      <ul class="veh-list">
        <li v-for="v in list" :key="v.id">
          <strong>{{ v.plate }}</strong> · {{ v.status }}
          <span v-if="v.etaMinutes != null"> · 预计 {{ v.etaMinutes }} 分钟</span>
        </li>
      </ul>
    </div>
  </div>
</template>
