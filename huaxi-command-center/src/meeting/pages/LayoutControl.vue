<script setup lang="ts">
import { ref, watch } from 'vue'
import { defaultPrefs, loadLayoutPrefs, saveLayoutPrefs, type PanelPrefs } from '../layoutPrefs'

const prefs = ref<PanelPrefs>(loadLayoutPrefs())

watch(
  prefs,
  (v) => saveLayoutPrefs(v),
  { deep: true },
)

function reset() {
  prefs.value = defaultPrefs()
}
</script>

<template>
  <div class="page layout-page">
    <h2>动态调控面板（概念 + 已落地部分）</h2>
    <p class="lead">
      主站指挥中枢已支持<strong>面板勾选隐藏</strong>与<strong>汇报布局</strong>（localStorage
      <code>huaxi-home-panels</code>）。GIS 大屏支持侧栏 / 图例 / 急诊数收起。下方为<strong>中后期拖拽 dock</strong>的概念预览，刷新后选项仍保留。
    </p>
    <div class="layout-links">
      <a href="/#/">打开指挥中枢 →</a>
      <a href="/gis-command.html">GIS 协同大屏 →</a>
    </div>
    <div class="toolbar">
      <label><input v-model="prefs.leftPanel" type="checkbox" /> 协作侧栏</label>
      <label><input v-model="prefs.rightPanel" type="checkbox" /> 指标轨</label>
      <label><input v-model="prefs.bottomBar" type="checkbox" /> 底栏摘要</label>
      <label>
        停靠
        <select v-model="prefs.dock">
          <option value="left">左侧</option>
          <option value="right">右侧</option>
        </select>
      </label>
      <button type="button" class="btn" @click="reset">恢复默认</button>
    </div>
    <div class="demo-stage" :class="{ dockRight: prefs.dock === 'right' }">
      <aside v-show="prefs.leftPanel && prefs.dock === 'left'" class="demo-panel">协作列表 / 节点</aside>
      <main class="demo-map">地图 / 业务主区（16:9）</main>
      <aside v-show="prefs.leftPanel && prefs.dock === 'right'" class="demo-panel">协作列表</aside>
      <aside v-show="prefs.rightPanel" class="demo-rail">KPI 轨</aside>
      <footer v-show="prefs.bottomBar" class="demo-bottom">演示免责声明 · 底栏摘要</footer>
    </div>
    <p class="muted layout-foot">
      汇报话术：「面板能藏、GIS 能清屏；全站拖拽需 React 布局层源码化，排期中后期。」
    </p>
  </div>
</template>
