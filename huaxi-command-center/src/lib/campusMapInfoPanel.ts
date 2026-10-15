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

function fmt(n: number | undefined, fallback = '—') {
  return n != null && Number.isFinite(n) ? String(n) : fallback
}

export function createCampusInfoPanel(host: HTMLElement, opts?: { onClose?: () => void }) {
  const panel = document.createElement('aside')
  panel.className = 'hx-campus-info-panel'
  panel.hidden = true
  panel.setAttribute('aria-label', '协作节点详情')
  panel.innerHTML = `
    <header class="hx-campus-info-head">
      <span class="hx-campus-info-tier"></span>
      <button type="button" class="hx-campus-info-close" aria-label="关闭">×</button>
    </header>
    <h3 class="hx-campus-info-name"></h3>
    <dl class="hx-campus-info-stats">
      <div><dt>急诊（当前）</dt><dd data-f="er">—</dd></div>
      <div><dt>剩余床位</dt><dd data-f="beds">—</dd></div>
      <div><dt>床位状态</dt><dd data-f="tight">—</dd></div>
    </dl>
    <p class="hx-campus-info-hint">点击地图空白处关闭 · 拖动可旋转地图</p>
  `
  host.appendChild(panel)

  const tierEl = panel.querySelector('.hx-campus-info-tier') as HTMLElement
  const nameEl = panel.querySelector('.hx-campus-info-name') as HTMLElement
  const closeBtn = panel.querySelector('.hx-campus-info-close') as HTMLButtonElement

  const show = (node: CollabNodeDetail) => {
    tierEl.textContent = TIER_LABEL[node.tier] ?? TIER_LABEL[0]
    tierEl.style.color = tierLegendHex(node.tier)
    tierEl.style.borderColor = `${tierLegendHex(node.tier)}44`
    nameEl.textContent = node.name
    const er = panel.querySelector('[data-f="er"]')!
    const beds = panel.querySelector('[data-f="beds"]')!
    const tight = panel.querySelector('[data-f="tight"]')!
    er.textContent = fmt(node.er)
    beds.textContent = fmt(node.bedsFree)
    tight.textContent = node.tight == null ? '—' : node.tight ? '紧张' : '正常'
    tight.classList.toggle('is-tight', node.tight === true)
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
