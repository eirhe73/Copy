<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VehicleDesk from '../components/VehicleDesk.vue'
import { buildHash, formatClock, loadEvents, statusLabel, statusTone, type DispatchEvent } from '../context'

type Amb = {
  id: string
  plate: string
  org: string
  boundHospital: string
  crew: string
  status: string
  currentEventId: string | null
}

const rows = ref<Amb[]>([])
const events = ref<DispatchEvent[]>([])
const updated = ref('')
const selectedId = ref('')

onMounted(async () => {
  const [amb, live] = await Promise.all([
    fetch('/api/dispatch-ambulances.json').then((r) => r.json()),
    loadEvents(),
  ])
  updated.value = amb.updatedAt
  rows.value = amb.ambulances
  events.value = live.events
  const q = new URLSearchParams(location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?') + 1) : '')
  selectedId.value = q.get('vehicle') || rows.value[0]?.id || ''
})

const selected = computed(() => rows.value.find((a) => a.id === selectedId.value) || null)
const selectedEvent = computed(() => (selected.value ? eventOf(selected.value) : null))

function eventOf(row: Amb) {
  return events.value.find((e) => e.id === row.currentEventId) || null
}

function liveHref(row: Amb) {
  const ev = eventOf(row)
  return buildHash('live', {
    eventId: ev?.id || '',
    task120Id: ev?.task120Id || '',
    vehicleId: row.id,
    vehiclePlate: row.plate,
  })
}

function registerHref(row: Amb) {
  const ev = eventOf(row)
  return buildHash('register', {
    eventId: ev?.id || '',
    task120Id: ev?.task120Id || '',
    vehicleId: row.id,
    vehiclePlate: row.plate,
    chiefComplaint: ev?.chiefComplaint || '',
  })
}
</script>

<template>
  <div class="dh-page">
    <section class="dh-page-head">
      <div>
        <h2 class="dh-h2">救护车列表</h2>
        <p class="dh-lead">本院绑定车辆、班组和当前出警。</p>
      </div>
      <p class="dh-stats">{{ rows.length }} 辆 · 更新 {{ formatClock(updated) }}</p>
    </section>
    <section class="dh-panel dh-table-wrap">
      <table class="dh-table">
        <thead>
          <tr>
            <th>车牌 / ID</th>
            <th>所属</th>
            <th>绑定医院</th>
            <th>班组</th>
            <th>状态</th>
            <th>关联事件</th>
            <th class="col-act">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in rows" :key="a.id" :class="{ selected: a.id === selectedId }" @click="selectedId = a.id">
            <td><strong>{{ a.plate }}</strong><br /><small>{{ a.id }}</small></td>
            <td>{{ a.org }}</td>
            <td>{{ a.boundHospital }}</td>
            <td>{{ a.crew }}</td>
            <td><span class="dh-status" :class="statusTone(statusLabel(a.status))">{{ statusLabel(a.status) }}</span></td>
            <td>{{ eventOf(a)?.task120Id ?? '—' }}</td>
            <td class="dh-row-actions">
              <a :href="liveHref(a)">出警处理</a>
              <a v-if="a.currentEventId" :href="registerHref(a)">登记</a>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <section v-if="selected" class="dh-panel">
      <VehicleDesk
        :vehicle-id="selected.id"
        :plate="selected.plate"
        :status="selected.status"
        :hospital="selected.boundHospital"
        :crew="selected.crew"
        :destination="selectedEvent?.destination"
        :eta-hospital="selectedEvent?.etaHospitalMinutes"
        :eta-patient="selectedEvent?.etaPatientMinutes"
        :task120-id="selectedEvent?.task120Id"
        :complaint="selectedEvent?.chiefComplaint"
        :score-plan="selectedEvent?.scorePlan"
        :treat-plan="selectedEvent?.treatPlan"
      />
    </section>
  </div>
</template>
