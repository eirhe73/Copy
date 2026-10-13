<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { t: '演示数据已标注，非临床统计', d: false },
  { t: '浅色/动效符合医院环境（无冲击波、无多色 marker）', d: false },
  { t: 'GPS/会诊/床位 失败态有提示', d: false },
  { t: '16:9 大屏无关键控件被裁切', d: false },
  { t: '与 120 任务号字段对齐（若本迭代涉及）', d: false },
  { t: '项目管理部签字', d: false },
])
</script>

<template>
  <div class="page">
    <h2>新功能页面审核清单</h2>
    <p class="lead">每次发版勾选。完整版见 <code>docs/RELEASE-CHECKLIST.md</code></p>
    <ul class="check-list">
      <li v-for="(it, i) in items" :key="i">
        <label><input v-model="it.d" type="checkbox" /> {{ it.t }}</label>
      </li>
    </ul>
  </div>
</template>
