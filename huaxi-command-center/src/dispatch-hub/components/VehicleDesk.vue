<script setup lang="ts">
import { consultHref } from '../context'
import VehicleMonitor from '../pages/VehicleMonitor.vue'

const props = defineProps<{
  vehicleId: string
  plate: string
  status?: string
  destination?: string
  etaHospital?: number | null
  etaPatient?: number | null
  task120Id?: string
  complaint?: string
  crew?: string
  hospital?: string
  scorePlan?: string
  treatPlan?: string
}>()
</script>

<template>
  <div class="dh-desk">
    <header class="dh-desk-head">
      <div>
        <h2 class="dh-h2">{{ plate }} · {{ status || '车辆' }}</h2>
        <p class="dh-lead">
          <span v-if="hospital">绑定 {{ hospital }} · </span>
          <span v-if="crew">{{ crew }} · </span>
          <span v-if="task120Id">任务 {{ task120Id }}</span>
        </p>
      </div>
      <a class="dh-btn primary" :href="consultHref(props)">发起会诊</a>
    </header>
    <dl class="dh-desk-meta">
      <div v-if="destination"><dt>去向</dt><dd>{{ destination }}</dd></div>
      <div v-if="etaPatient != null"><dt>到患者</dt><dd>{{ etaPatient }} 分钟</dd></div>
      <div v-if="etaHospital != null"><dt>到院</dt><dd>{{ etaHospital }} 分钟</dd></div>
      <div v-if="complaint"><dt>主诉</dt><dd>{{ complaint }}</dd></div>
    </dl>
    <VehicleMonitor embedded :focus-id="vehicleId" />
    <section class="dh-plan">
      <h3 class="dh-h3">评分 / 救治方案</h3>
      <p><strong>{{ scorePlan || '院前评分待补' }}</strong></p>
      <p>{{ treatPlan || '车上先稳定生命体征，到院后按科室方案执行。' }}</p>
    </section>
  </div>
</template>
