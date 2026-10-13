<template>
  <div class="page video-brief">
    <h2>介绍视频 · 镜头与旁白要点（约 8～10 分钟素材）</h2>
    <p class="lead">
      AI 成片由视频团队制作；技术侧按下列路径录屏，每段 10～30 秒。旁白统一加：「演示数据，非实时 HIS / 120。」
    </p>
    <ol class="shots">
      <li>
        <strong>片头 5s</strong> — 指挥中枢 <code>/#/</code>，四块 KPI；点<strong>汇报布局</strong>藏重症。
      </li>
      <li>
        <strong>20s</strong> — 院前 <code>/dispatch.html#live</code>：选 <code>120-WY-88421</code>，三列（事件 · 车辆/GPS · 就地登记），保存提示。
      </li>
      <li>
        <strong>20s</strong> — GIS <code>/gis-command.html?region=weiyuan</code>：节点列表联动、120 橙色针脚、<strong>汇报布局</strong>隐藏列表。
      </li>
      <li>
        <strong>15s</strong> — 预警 <code>/#/warning</code>：趋势预测（演示）表 + 闭环；点环节时限进质控。
      </li>
      <li>
        <strong>15s</strong> — 重症 <code>/#/critical</code>：点床位卡片进单床；顶栏床 / 患者 / 设备互跳。
      </li>
      <li>
        <strong>15s</strong> — 基层链 <code>/#/consultations</code> 顶栏三步演示；<code>/#/transfers</code> 高亮上转患者。
      </li>
      <li>
        <strong>10s</strong> — 质控 <code>/#/medical-quality</code>：环节时限超时行 + 整改台账列。
      </li>
      <li>
        <strong>10s</strong> — 会诊门户 <code>meeting-portal.html#consult</code> + 主站会诊房间占位提示。
      </li>
      <li>
        <strong>10s</strong> — 设备绑定 <code>meeting-portal.html#devices</code> 改绑演示。
      </li>
      <li><strong>片尾 5s</strong> — 全站免责声明口播 + 会议九项门户 <code>meeting-portal.html</code>。</li>
    </ol>
    <p class="muted">可选：单床页放置 <code>public/assets/demo/bed-demo.mp4</code> 后点「播放演示片」。禁用「已接入真实 GPS/HIS/WebRTC」除非验收签字。</p>
  </div>
</template>
