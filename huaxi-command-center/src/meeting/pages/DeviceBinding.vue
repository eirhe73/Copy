<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type Device = {
  deviceId: string
  name: string
  bedId: string | null
  bedLabel: string | null
  patientId?: string | null
  patientName?: string | null
  online: boolean
  alarm?: boolean
  boundAt?: string | null
  unboundAt?: string | null
  previousBedId?: string | null
}
type Bed = { bedId: string; label: string; ward?: string }

const devices = ref<Device[]>([])
const beds = ref<Bed[]>([])
const notice = ref('')

function loadStored(): Device[] | null {
  try {
    const raw = localStorage.getItem('huaxi-device-bindings-demo')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

onMounted(async () => {
  const data = await fetch('/api/device-bindings.json').then((r) => r.json())
  notice.value = data.notice || ''
  beds.value = data.beds || []
  devices.value = loadStored() || data.devices || []
})

const stats = computed(() => ({
  online: devices.value.filter((d) => d.online).length,
  bound: devices.value.filter((d) => d.bedId).length,
  alarm: devices.value.filter((d) => d.alarm).length,
}))

async function bind(device: Device, bedId: string) {
  const prev = device.bedId
  if (prev && prev !== bedId) {
    device.previousBedId = prev
    device.unboundAt = new Date().toISOString()
  }
  const bed = beds.value.find((b) => b.bedId === bedId)
  device.bedId = bedId || null
  device.bedLabel = bed?.label ?? null
  if (bedId) device.boundAt = new Date().toISOString()
  else {
    device.patientId = null
    device.patientName = null
  }
  persist()
  if (window.hxBackend?.enabled?.()) {
    try {
      await window.hxBackend.ensureAuth()
      await window.hxBackend.put(`/devices/${encodeURIComponent(device.deviceId)}/binding`, {
        bedId: bedId || null,
      })
    } catch (e) {
      console.warn('设备改绑 API', e)
    }
  }
}

function persist() {
  localStorage.setItem('huaxi-device-bindings-demo', JSON.stringify(devices.value))
}

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function bedHref(id: string | null) {
  return id ? `/#/bed/${encodeURIComponent(id)}` : ''
}
</script>

<template>
  <div class="page device-page">
    <h2>床旁设备 · 床位动态绑定</h2>
    <p class="lead">
      {{ notice || '演示绑定保存至 localStorage。' }}生产对接医疗设备科资产 / IoT 台账 API；与主站
      <a href="/#/devices">床旁设备</a>、<a href="/#/critical">重症监护</a> 互跳演示。
    </p>
    <div class="device-stats">
      <span>在线 {{ stats.online }} / {{ devices.length }}</span>
      <span>已绑床 {{ stats.bound }}</span>
      <span v-if="stats.alarm" class="warn">告警 {{ stats.alarm }}</span>
    </div>
    <div class="table-scroll">
      <table class="table device-table">
        <thead>
          <tr>
            <th>设备</th>
            <th>状态</th>
            <th>床位 / 患者</th>
            <th>绑定时间</th>
            <th>改绑</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in devices" :key="d.deviceId" :class="{ 'row-alarm': d.alarm }">
            <td>
              <strong>{{ d.name }}</strong>
              <small>{{ d.deviceId }}</small>
            </td>
            <td>
              <span :class="d.online ? 'pill ok' : 'pill off'">{{ d.online ? '在线' : '离线' }}</span>
              <span v-if="d.alarm" class="pill alarm">参数告警</span>
            </td>
            <td>
              <template v-if="d.bedId">
                <a v-if="bedHref(d.bedId)" :href="bedHref(d.bedId)">{{ d.bedLabel }}</a>
                <span v-if="d.patientName"> · {{ d.patientName }}</span>
              </template>
              <span v-else class="muted">未绑定</span>
              <small v-if="d.unboundAt && !d.bedId">上次解绑 {{ fmt(d.unboundAt) }}</small>
            </td>
            <td>
              <div>{{ fmt(d.boundAt) }}</div>
              <small v-if="d.previousBedId && d.unboundAt">自 {{ d.previousBedId }} 改绑</small>
            </td>
            <td>
              <select :value="d.bedId || ''" @change="bind(d, ($event.target as HTMLSelectElement).value)">
                <option value="">— 解绑 —</option>
                <option v-for="b in beds" :key="b.bedId" :value="b.bedId">{{ b.label }}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
