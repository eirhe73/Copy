<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import RegisterForm from '../components/RegisterForm.vue'
import VehicleDesk from '../components/VehicleDesk.vue'
import {
  buildHash,
  contextFromHash,
  defaultListDate,
  latestEventDate,
  etaText,
  todayLocalDate,
  eventLocalDate,
  filterEventsByDate,
  formatClock,
  formatDateLabel,
  hashQuery,
  levelLabel,
  loadEvents,
  replaceHashQuery,
  statusLabel,
  statusTone,
  vehicleLabel,
  type DispatchEvent,
  type PatientForm,
} from '../context'
import { startPoll } from '../poll'

const allEvents = ref<DispatchEvent[]>([])
const listDate = ref('')
const updated = ref('')
const activeCount = ref(0)
const selectedId = ref('')
let stop: (() => void) | null = null

const dayEvents = computed(() => filterEventsByDate(allEvents.value, listDate.value))

const selected = computed(() => dayEvents.value.find((e) => e.id === selectedId.value) ?? null)

const running = computed(() => dayEvents.value.filter((e) => e.status.includes('出警')).length)
const onScene = computed(() =>
  dayEvents.value.filter((e) => e.status.includes('现场') || e.status.includes('处置')).length,
)

const boardTitle = computed(() =>
  listDate.value ? `${formatDateLabel(listDate.value)}出警` : '当日出警',
)

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
  const pool = dayEvents.value
  const hit =
    pool.find((e) => e.id === ctx.eventId) ||
    pool.find((e) => e.vehicleId === ctx.vehicleId) ||
    pool.find((e) => e.task120Id === ctx.task120Id)
  selectedId.value = hit?.id || pool[0]?.id || ''
}

function syncDateHash(ymd: string) {
  replaceHashQuery((q) => {
    if (ymd) q.set('date', ymd)
    else q.delete('date')
  })
}

function setListDate(ymd: string) {
  if (!ymd || listDate.value === ymd) return
  listDate.value = ymd
  syncDateHash(ymd)
  pickFromHash()
}

function shiftDay(delta: number) {
  const base = listDate.value || eventLocalDate(updated.value)
  const parts = base.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  d.setDate(d.getDate() + delta)
  const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  setListDate(next)
}

function onHashChange() {
  const d = hashQuery().get('date') || ''
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== listDate.value) listDate.value = d
  pickFromHash()
}

async function load() {
  const data = await loadEvents()
  updated.value = data.updatedAt
  activeCount.value = data.activeCount
  allEvents.value = data.events
  const hashDate = hashQuery().get('date') || ''
  if (!listDate.value) {
    listDate.value = defaultListDate(allEvents.value, data.updatedAt, hashDate)
    if (hashDate !== listDate.value) syncDateHash(listDate.value)
  }
  if (!selectedId.value || !dayEvents.value.some((e) => e.id === selectedId.value)) pickFromHash()
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
  window.addEventListener('hashchange', onHashChange)
})

onUnmounted(() => {
  stop?.()
  window.removeEventListener('hashchange', onHashChange)
})

watch(dayEvents, () => {
  if (!selectedId.value || !dayEvents.value.some((e) => e.id === selectedId.value)) pickFromHash()
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
        · 当日 {{ dayEvents.length }} 条
        · <a href="#events">全部 {{ allEvents.length }}</a>
        · 更新 {{ formatClock(updated) }}
      </p>
    </section>
    <div class="dh-work dh-work--live">
      <section class="dh-panel dh-board">
        <header class="dh-board-head">
          <h3 class="dh-board-title">{{ boardTitle }}</h3>
          <div class="dh-date-toolbar">
            <label class="dh-date-field">
              <span class="sr-only">选择日期</span>
              <input
                type="date"
                class="dh-date-input"
                :value="listDate"
                :max="todayLocalDate()"
                @change="setListDate(($event.target as HTMLInputElement).value)"
              />
            </label>
            <button type="button" class="dh-date-btn" @click="setListDate(todayLocalDate())">今天</button>
            <button
              type="button"
              class="dh-date-btn"
              @click="setListDate(latestEventDate(allEvents, updated))"
            >
              最近有记录
            </button>
            <button type="button" class="dh-date-btn" :disabled="!listDate" @click="shiftDay(-1)">上一日</button>
            <button type="button" class="dh-date-btn" @click="shiftDay(1)">下一日</button>
          </div>
        </header>
        <p v-if="!dayEvents.length" class="dh-day-empty">该日暂无出警记录，请切换日期或查看「全部」急救事件。</p>
        <ul v-else class="dh-event-grid">
          <li
            v-for="ev in dayEvents"
            :key="ev.id"
            class="dh-event-card"
            :class="{ selected: ev.id === selectedId }"
          >
            <button type="button" class="dh-card-hit" @click="select(ev)">
              <header>
                <span class="dh-badge">{{ levelLabel(ev.level) }}</span>
                <strong>{{ ev.task120Id }}</strong>
                <span class="dh-status" :class="statusTone(statusLabel(ev.status))">{{ statusLabel(ev.status) }}</span>
              </header>
              <p class="complaint">{{ ev.chiefComplaint }}</p>
              <dl>
                <div><dt>接车地址</dt><dd>{{ ev.pickupAddress }}</dd></div>
                <div><dt>目标医院</dt><dd>{{ ev.destination }}</dd></div>
                <div><dt>车辆</dt><dd>{{ vehicleLabel(ev.vehiclePlate) }}</dd></div>
                <div><dt>到患者 / 到院</dt><dd>{{ etaText(ev.etaPatientMinutes) }} / {{ etaText(ev.etaHospitalMinutes) }}</dd></div>
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
          <p class="dh-lead dh-lead-tight">
            任务号与车牌随左侧事件带入。可先<strong>发起远程会诊</strong>（需任务号+主诉），也可先<strong>保存草稿/提交登记</strong>再会诊，三者非强制顺序。
          </p>
          <RegisterForm compact :seed="seed" />
        </section>
      </template>
    </div>
  </div>
</template>
