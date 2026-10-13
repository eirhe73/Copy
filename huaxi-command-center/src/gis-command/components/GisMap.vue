<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { resolveMapThemeId } from '../../mapTheme'
import { COLORS, lineWidth, ringSize, TIER_RING } from '../constants'
import type { CollabLink, CollabNode, DispatchVehicleMarker, RegionKey } from '../types'

const props = defineProps<{
  region: RegionKey
  nodes: CollabNode[]
  links: CollabLink[]
  selectedId: string | null
  vehicles?: DispatchVehicleMarker[]
}>()

const emit = defineEmits<{ select: [id: string] }>()

const root = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let breathe = 0
let raf = 0
let geoReady = false

async function ensureGeo(region: RegionKey) {
  const res = await fetch(`/maps/${region}.json`)
  if (!res.ok) throw new Error('地图加载失败')
  echarts.registerMap(region, await res.json())
  geoReady = true
}

function nodeOpacity(id: string, sel: string | null) {
  if (!sel) return 1
  return id === sel ? 1 : 0.4
}

function ringStyle(n: CollabNode, sel: string | null, glow: number) {
  const selected = n.id === sel
  return {
    color: 'rgba(0,0,0,0)',
    borderColor: COLORS.primary,
    borderWidth: TIER_RING[n.tier],
    opacity: nodeOpacity(n.id, sel),
    shadowBlur: selected && sel ? 10 + glow * 15 : 0,
    shadowColor: 'rgba(56,189,248,0.38)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  }
}

function buildLines(nodes: CollabNode[], links: CollabLink[], sel: string | null) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  return links
    .map((link) => {
      const a = byId.get(link.from)
      const b = byId.get(link.to)
      if (!a || !b) return null
      const dimmed = sel && sel !== link.from && sel !== link.to
      return {
        coords: [
          [a.lng, a.lat],
          [b.lng, b.lat],
        ],
        lineStyle: {
          color: COLORS.line,
          width: lineWidth(link.flow),
          opacity: dimmed ? 0.3 : 1,
        },
      }
    })
    .filter(Boolean)
}

function vehicleScatter(vehicles: DispatchVehicleMarker[]) {
  return vehicles.map((v) => ({
    id: v.id,
    name: v.plate,
    value: [v.lng, v.lat],
    symbol: 'pin',
    symbolSize: 28,
    itemStyle: {
      color: '#ea580c',
      borderColor: '#fff',
      borderWidth: 1,
      shadowBlur: 6,
      shadowColor: 'rgba(234, 88, 12, 0.35)',
    },
  }))
}

function buildOption(
  region: RegionKey,
  nodes: CollabNode[],
  links: CollabLink[],
  sel: string | null,
  glow: number,
  vehicles: DispatchVehicleMarker[],
) {
  const main = nodes.map((n) => ({
    id: n.id,
    name: n.name,
    value: [n.lng, n.lat, n.er],
    symbol: 'circle' as const,
    symbolSize: ringSize(n.er),
    itemStyle: ringStyle(n, sel, glow),
    emphasis: {
      scale: false,
      disabled: false,
      itemStyle: {
        ...ringStyle(n, sel, 0),
        opacity: nodeOpacity(n.id, sel),
        shadowBlur: 0,
      },
    },
  }))

  const tightInner = nodes
    .filter((n) => n.tight)
    .map((n) => ({
      id: `${n.id}-inner`,
      name: n.name,
      value: [n.lng, n.lat],
      symbol: 'circle' as const,
      symbolSize: Math.max(6, ringSize(n.er) - 10),
      itemStyle: {
        color: 'rgba(0,0,0,0)',
        borderColor: COLORS.alert,
        borderWidth: 1,
        opacity: nodeOpacity(n.id, sel),
        shadowBlur: 0,
      },
      emphasis: { scale: false, itemStyle: { shadowBlur: 0 } },
    }))

  const flatGeo = {
    map: region,
    roam: true,
    silent: false,
    layoutCenter: ['50%', '50%'],
    layoutSize: '100%',
    label: { show: false },
    itemStyle: {
      areaColor: COLORS.geoFill,
      borderColor: COLORS.geoBorder,
      borderWidth: 1,
      shadowBlur: 0,
      shadowColor: 'transparent',
    },
    emphasis: {
      label: { show: false },
      itemStyle: {
        areaColor: COLORS.geoHover,
        borderColor: COLORS.geoBorder,
        shadowBlur: 0,
      },
    },
    select: {
      itemStyle: {
        areaColor: COLORS.geoHover,
        borderColor: COLORS.geoBorder,
      },
    },
  }

  const darkMap = resolveMapThemeId('light') !== 'light'

  return {
    backgroundColor: darkMap ? 'rgba(2, 8, 24, 0.25)' : 'transparent',
    animation: false,
    animationDurationUpdate: 650,
    animationEasingUpdate: 'cubicOut' as const,
    geo: flatGeo,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderColor: COLORS.panelBorder,
      borderWidth: 1,
      padding: [8, 10],
      textStyle: { color: COLORS.textMuted, fontSize: 12, fontWeight: 400 },
      extraCssText: 'backdrop-filter:blur(8px);border-radius:6px;box-shadow:none;',
      formatter: (p: { seriesName?: string; data?: { name?: string; id?: string } }) => {
        if (p.seriesName === '120车辆') {
          const v = vehicles.find((x) => x.plate === p.data?.name || x.id === p.data?.id)
          if (!v) return ''
          const eta = v.etaMinutes != null ? `${v.etaMinutes} 分钟到院` : '—'
          return `<span style="color:#c2410c;font-weight:600">${v.plate}</span><br/>${v.status} · 演示 GPS<br/>预计 ${eta}`
        }
        const node = nodes.find((n) => n.name === p.data?.name)
        if (!node) return ''
        return `<span style="color:#0369a1;font-weight:500">${node.name}</span><br/>急诊 ${node.er} · 空床 ${node.bedsFree}${node.tight ? ' · <span style="color:#EF4444">床位紧张</span>' : ''}`
      },
    },
    series: [
      {
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 1,
        silent: true,
        animation: false,
        effect: { show: false, period: 0, trailLength: 0 },
        lineStyle: { cap: 'round', curveness: 0.1, shadowBlur: 0 },
        data: buildLines(nodes, links, sel),
      },
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 2,
        symbol: 'circle',
        animation: false,
        animationDurationUpdate: 650,
        rippleEffect: { scale: 0, period: 0, brushType: 'stroke' },
        data: main,
      },
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 3,
        symbol: 'circle',
        animation: false,
        rippleEffect: { scale: 0 },
        data: tightInner,
        tooltip: { show: false },
      },
      ...(vehicles.length
        ? [
            {
              name: '120车辆',
              type: 'scatter' as const,
              coordinateSystem: 'geo' as const,
              zlevel: 4,
              animation: false,
              data: vehicleScatter(vehicles),
            },
          ]
        : []),
    ],
  }
}

function render() {
  if (!chart || !geoReady) return
  chart.setOption(
    buildOption(props.region, props.nodes, props.links, props.selectedId, breathe, props.vehicles ?? []),
    { notMerge: true },
  )
}

function loop() {
  if (props.selectedId) {
    const t = performance.now() / 1000
    breathe = (Math.sin((t * Math.PI * 2) / 4) + 1) / 2
    render()
  }
  raf = requestAnimationFrame(loop)
}

async function init() {
  if (!root.value) return
  chart = echarts.init(root.value, undefined, { renderer: 'canvas' })
  await ensureGeo(props.region)
  render()
  chart.on('click', (params) => {
    if (params.componentType !== 'series' || params.seriesType !== 'scatter') return
    const raw = params.data as { id?: string } | undefined
    const id = raw?.id
    if (id && !String(id).endsWith('-inner')) emit('select', String(id))
  })
  loop()
}

watch(
  () => [props.region, props.nodes, props.links, props.selectedId, props.vehicles] as const,
  async ([region, , , sel], prev) => {
    if (!chart) return
    if (prev && region !== prev[0]) {
      chart.clear()
      geoReady = false
      await ensureGeo(region)
    }
    if (!sel) breathe = 0
    render()
  },
  { deep: true },
)

onMounted(() => {
  init().catch(console.error)
  window.addEventListener('resize', onResize)
})

function onResize() {
  chart?.resize()
}

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
  chart?.dispose()
})
</script>

<template>
  <div ref="root" class="gis-map" role="img" aria-label="县域协作 GIS 地图" />
</template>

<style scoped>
.gis-map {
  width: 100%;
  height: 100%;
}
</style>
