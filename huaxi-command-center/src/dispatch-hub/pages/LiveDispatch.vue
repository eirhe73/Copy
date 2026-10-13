<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import RegisterForm from '../components/RegisterForm.vue'
import VehicleDesk from '../components/VehicleDesk.vue'
import {
  buildHash,
  contextFromHash,
  formatClock,
  loadEvents,
  statusTone,
  type DispatchEvent,
  type PatientForm,
} from '../context'
import { startPoll } from '../poll'

const events = ref<DispatchEvent[]>([])
const updated = ref('')
const activeCount = ref(0)
const selectedId = ref('')
let stop: (() => void) | null = null

const selected = computed(() => events.value.find((e) => e.id === selectedId.value) ?? null)

const running = computed(() => events.value.filter((e) => e.status.includes('出警')).length)
const onScene = computed(() => events.value.filter((e) => e.status.includes('现场') || e.status.includes('处置')).length)

const seed = computed<Partial<PatientForm>>(() => {
  const ev = selected.value
  if (!ev) return {}
  return {
    eventId: ev.id,
    task120Id: ev.task120Id,
    vehicleId: ev.vehicleId,
    vehiclePlate: ev.vehiclePlate,
    chiefComplaint: ev.chiefComplaint,
  }
})

function pickFromHash() {
  const ctx = contextFromHash()
  const hit =
    events.value.find((e) => e.id === ctx.eventId) ||
    events.value.find((e) => e.vehicleId === ctx.vehicleId) ||
    events.value.find((e) => e.task120Id === ctx.task120Id)
  selectedId.value = hit?.id || events.value[0]?.id || ''
}

async function load() {
  const data = await loadEvents()
  updated.value = data.updatedAt
  activeCount.value = data.activeCount
  events.value = data.events
  if (!selectedId.value || !events.value.some((e) => e.id === selectedId.value)) pickFromHash()
}

function select(ev: DispatchEvent) {
  selectedId.value = ev.id
  const next = buildHash('live', {
    eventId: ev.id,
    task120Id: ev.task120Id,
    vehicleId: ev.vehicleId,
    vehiclePlate: ev.vehiclePlate,
  })
  if (location.hash !== next) history.replaceState(null, '', next)
}

onMounted(() => {
  load()
  stop = startPoll(async () => {
    await load()
    return null
  }, () => {}, 10000)
  window.addEventListener('hashchange', pickFromHash)
})

onUnmounted(() => {
  stop?.()
  window.removeEventListener('hashchange', pickFromHash)
})

watch(events, () => {
  if (!selectedId.value) pickFromHash()
})
</script>

<template>
  <div class="dh-page">
    <section class="dh-page-head">
      <div>
        <h2 class="dh-h2">实时出警</h2>
        <p class="dh-lead">只处理重症出诊。选中一条后，右侧看车并登记。</p>
      </div>
      <p class="dh-stats">
        进行中 {{ activeCount }} · 出警 {{ running }} · 现场 {{ onScene }}
        · <a href="#events">全部 {{ events.length }}</a>
        · 更新 {{ formatClock(updated) }}
      </p>
    </section>
    <div class="dh-work dh-work--live">
      <section class="dh-panel dh-board">
        <h3 class="dh-board-title">今日出警</h3>
        <ul class="dh-event-grid">
          <li
            v-for="ev in events"
            :key="ev.id"
            class="dh-event-card"
            :class="{ selected: ev.id === selectedId }"
          >
            <button type="button" class="dh-card-hit" @click="select(ev)">
              <header>
                <span class="dh-badge">{{ ev.level }}</span>
                <strong>{{ ev.task120Id }}</strong>
                <span class="dh-status" :class="statusTone(ev.status)">{{ ev.status }}</span>
              </header>
              <p class="complaint">{{ ev.chiefComplaint }}</p>
              <dl>
                <div><dt>接车地址</dt><dd>{{ ev.pickupAddress }}</dd></div>
                <div><dt>目标医院</dt><dd>{{ ev.destination }}</dd></div>
                <div><dt>车辆</dt><dd>{{ ev.vehiclePlate }}</dd></div>
                <div><dt>到患者 / 到院</dt><dd>{{ ev.etaPatientMinutes ?? '—' }} / {{ ev.etaHospitalMinutes }} 分钟</dd></div>
              </dl>
            </button>
          </li>
        </ul>
      </section>
      <template v-if="selected">
        <section class="dh-panel dh-col-vehicle">
          <VehicleDesk
            :vehicle-id="selected.vehicleId"
            :plate="selected.vehiclePlate"
            :status="selected.status"
            :destination="selected.destination"
            :eta-hospital="selected.etaHospitalMinutes"
            :eta-patient="selected.etaPatientMinutes"
            :task120-id="selected.task120Id"
            :complaint="selected.chiefComplaint"
            :score-plan="selected.scorePlan"
            :treat-plan="selected.treatPlan"
          />
        </section>
        <section class="dh-panel dh-col-register">
          <h3 class="dh-h3">就地登记</h3>
          <p class="dh-lead dh-lead-tight">危急时在此直接填写并提交，任务号与车牌随左侧事件带入。</p>
          <RegisterForm compact :seed="seed" />
        </section>
      </template>
    </div>
  </div>
</template>
