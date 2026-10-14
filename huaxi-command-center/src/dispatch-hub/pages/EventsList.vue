<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { buildHash, etaText, formatClock, levelLabel, loadEvents, statusLabel, statusTone, vehicleLabel, type DispatchEvent } from '../context'

const events = ref<DispatchEvent[]>([])
const updated = ref('')

onMounted(async () => {
  const data = await loadEvents()
  updated.value = data.updatedAt
  events.value = data.events
})

function liveHref(ev: DispatchEvent) {
  return buildHash('live', {
    eventId: ev.id,
    task120Id: ev.task120Id,
    vehicleId: ev.vehicleId,
    vehiclePlate: ev.vehiclePlate,
  })
}

function registerHref(ev: DispatchEvent) {
  return buildHash('register', {
    eventId: ev.id,
    task120Id: ev.task120Id,
    vehicleId: ev.vehicleId,
    vehiclePlate: ev.vehiclePlate,
    chiefComplaint: ev.chiefComplaint,
  })
}
</script>

<template>
  <div class="dh-page">
    <section class="dh-page-head">
      <div>
        <h2 class="dh-h2">急救事件</h2>
        <p class="dh-lead">一次出车对应一条急救事件。</p>
      </div>
      <p class="dh-stats">{{ events.length }} 条 · 更新 {{ formatClock(updated) }}</p>
    </section>
    <section class="dh-panel dh-table-wrap">
      <table class="dh-table">
        <thead>
          <tr>
            <th class="col-task">任务号</th>
            <th>主诉</th>
            <th>车辆</th>
            <th>状态</th>
            <th>预计到院</th>
            <th class="col-act">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ev in events" :key="ev.id">
            <td>
              <strong>{{ ev.task120Id }}</strong><br />
              <small>{{ levelLabel(ev.level) }} · {{ ev.pickupAddress }}</small>
            </td>
            <td>{{ ev.chiefComplaint }}</td>
            <td>{{ vehicleLabel(ev.vehiclePlate) }}</td>
            <td><span class="dh-status" :class="statusTone(statusLabel(ev.status))">{{ statusLabel(ev.status) }}</span></td>
            <td>{{ etaText(ev.etaHospitalMinutes) }}</td>
            <td class="dh-row-actions">
              <a :href="liveHref(ev)">出警处理</a>
              <a :href="registerHref(ev)">登记</a>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
