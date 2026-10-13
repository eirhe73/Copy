<script setup lang="ts">
const items = [
  { id: 'layout', title: '1. 动态调控面板', desc: '隐藏/停靠/持久化布局偏好', href: '#layout' },
  { id: 'gps', title: '2. 120 GPS + ETA', desc: '实时位置模拟、预计到达', href: '#gps' },
  { id: 'consult', title: '3. 入院远程会诊', desc: '独立运行 + 120 任务号兼容', href: '#consult' },
  { id: 'beds', title: '4. 重症床位监控', desc: '科室床位轮询更新', href: '#beds' },
  { id: 'devices', title: '5. 设备-床位绑定', desc: '动态绑定与在线状态', href: '#devices' },
  { id: 'qc', title: '6. 统一质控标准', desc: '标准版本与合规率', href: '#qc' },
  { id: 'register', title: '7. 医生快速录入', desc: '少字段、草稿保存', href: '#register' },
  { id: 'checklist', title: '8. 页面审核清单', desc: '发版前勾选', href: '#checklist' },
  { id: 'video', title: '9. 介绍视频脚本', desc: '录屏镜头与旁白要点', href: '#video' },
  { id: 'gis', title: 'GIS 协同地图', desc: '大方/威远 2D 圆环（独立页）', href: '/gis-command.html', external: true },
  { id: 'grassroots', title: '基层调度演示链', desc: '威远 → 会诊 → 转诊（主站）', href: '/#/consultations', external: true },
]
</script>

<template>
  <div class="portal">
    <header class="portal-head">
      <h1>会议九项需求 · 本地 MVP 交付</h1>
      <p>
        以下为<strong>可演示、可联调</strong>实现（Mock API + 独立页）。真实 GPS / HIS / 120 / RTC 需院方接口，不在此包内假装完成。
      </p>
    </header>
    <ul class="portal-grid">
      <li v-for="it in items" :key="it.id">
        <a :href="it.href" :target="it.external ? '_blank' : undefined" class="card">
          <strong>{{ it.title }}</strong>
          <span>{{ it.desc }}</span>
        </a>
      </li>
    </ul>
    <p class="portal-foot">
      数据接口目录：<code>public/api/</code> · 说明文档：<code>docs/MEETING-ROADMAP.md</code>
    </p>
  </div>
</template>
