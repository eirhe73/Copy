import { tierLegendHex } from './hospitalCampusStyle'

export type CollabNodeDetail = {
  id: string
  name: string
  tier: 0 | 1 | 2
  lng: number
  lat: number
  er?: number
  bedsFree?: number
  tight?: boolean
}

const TIER_LABEL = ['一级协作', '二级协作', '基层协作'] as const
const TIER_ROLE = ['县域枢纽', '乡镇节点', '基层触点'] as const

function fmt(n: number | undefined, fallback = '—') {
  return n != null && Number.isFinite(n) ? String(n) : fallback
}

function fmtCoord(n: number) {
  return Number.isFinite(n) ? n.toFixed(3) : '—'
}

function erLevel(er: number | undefined) {
  const v = er ?? 0
  if (v >= 8) return { text: '负荷偏高', warn: true }
  if (v >= 4) return { text: '运行繁忙', warn: true }
  if (v > 0) return { text: '平稳运行', warn: false }
  return { text: '暂无急诊', warn: false }
}

export function createCampusInfoPanel(host: HTMLElement, opts?: { onClose?: () => void }) {
  const panel = document.createElement('aside')
  panel.className = 'hx-campus-info-panel hx-map-node-hub'
  panel.hidden = true
  panel.setAttribute('aria-label', '协作节点详情')
  panel.innerHTML = `
    <header class="hx-campus-info-head">
      <span class="hx-campus-info-tier"></span>
      <button type="button" class="hx-campus-info-close" aria-label="关闭">×</button>
    </header>
    <h3 class="hx-campus-info-name"></h3>
    <p class="hx-map-node-hub-id">编码 <code data-f="id"></code></p>
    <div class="hx-map-node-cards">
      <article class="hx-map-node-card">
        <span class="hx-map-node-card-kicker">急诊（当前）</span>
        <strong class="hx-map-node-card-value" data-f="er">—</strong>
        <span class="hx-map-node-card-unit">例</span>
        <span class="hx-map-node-card-sub" data-f="er-sub">—</span>
      </article>
      <article class="hx-map-node-card">
        <span class="hx-map-node-card-kicker">剩余床位</span>
        <strong class="hx-map-node-card-value" data-f="beds">—</strong>
        <span class="hx-map-node-card-unit">床</span>
        <span class="hx-map-node-card-sub" data-f="beds-sub">—</span>
      </article>
      <article class="hx-map-node-card">
        <span class="hx-map-node-card-kicker">协作层级</span>
        <strong class="hx-map-node-card-value hx-map-node-card-value--sm" data-f="tier">—</strong>
        <span class="hx-map-node-card-unit" data-f="tier-role">—</span>
      </article>
      <article class="hx-map-node-card">
        <span class="hx-map-node-card-kicker">地理坐标</span>
        <strong class="hx-map-node-card-value hx-map-node-card-value--coord" data-f="coord">—</strong>
        <span class="hx-map-node-card-unit">经度 · 纬度</span>
      </article>
    </div>
    <p class="hx-campus-info-hint">点击空白处关闭 · 拖动可旋转地图</p>
  `
  host.appendChild(panel)

  const tierEl = panel.querySelector('.hx-campus-info-tier') as HTMLElement
  const nameEl = panel.querySelector('.hx-campus-info-name') as HTMLElement
  const closeBtn = panel.querySelector('.hx-campus-info-close') as HTMLButtonElement
  const q = (sel: string) => panel.querySelector(sel) as HTMLElement

  const show = (node: CollabNodeDetail) => {
    const tierIdx = Math.min(2, Math.max(0, node.tier ?? 0))
    const tierColor = tierLegendHex(tierIdx)
    tierEl.textContent = TIER_LABEL[tierIdx] ?? TIER_LABEL[0]
    tierEl.style.color = tierColor
    tierEl.style.borderColor = `${tierColor}66`
    tierEl.style.background = `${tierColor}14`
    panel.style.setProperty('--hx-node-accent', tierColor)

    nameEl.textContent = node.name
    q('[data-f="id"]').textContent = node.id

    const er = node.er
    const erMeta = erLevel(er)
    q('[data-f="er"]').textContent = fmt(er)
    q('[data-f="er"]').classList.toggle('is-warn', erMeta.warn)
    q('[data-f="er-sub"]').textContent = erMeta.text

    q('[data-f="beds"]').textContent = fmt(node.bedsFree)
    const bedsSub = q('[data-f="beds-sub"]')
    if (node.tight == null) {
      bedsSub.textContent = '床位数据同步中'
      bedsSub.classList.remove('is-warn')
    } else if (node.tight) {
      bedsSub.textContent = '占用率 ≥90% · 紧张'
      bedsSub.classList.add('is-warn')
    } else {
      bedsSub.textContent = '占用正常 · 可接收'
      bedsSub.classList.remove('is-warn')
    }

    q('[data-f="tier"]').textContent = TIER_LABEL[tierIdx]
    q('[data-f="tier-role"]').textContent = TIER_ROLE[tierIdx]

    q('[data-f="coord"]').textContent = `${fmtCoord(node.lng)}, ${fmtCoord(node.lat)}`

    panel.hidden = false
    panel.dataset.nodeId = node.id
  }

  const hide = () => {
    panel.hidden = true
    delete panel.dataset.nodeId
  }

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    hide()
    opts?.onClose?.()
  })

  return { panel, show, hide, isVisible: () => !panel.hidden }
}
