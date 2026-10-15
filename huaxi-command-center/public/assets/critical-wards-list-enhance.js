/**
 * 床位全景 /critical?view=wards：将卡片网格替换为科室床位统计列表，数据来自 /beds/by-dept
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function query() {
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q)
  }

  function isWardsPage() {
    return path() === '/critical' && query().get('view') === 'wards'
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function mainEl() {
    return document.querySelector('.app-shell > main') || document.querySelector('main')
  }

  function ensureOverlay() {
    const main = mainEl()
    if (!main) return null
    let overlay = document.getElementById('hx-wards-list-overlay')
    if (!overlay) {
      overlay = document.createElement('section')
      overlay.id = 'hx-wards-list-overlay'
      overlay.className = 'hx-wards-list-overlay'
      overlay.style.cssText =
        'position:relative;width:100%;min-height:400px;background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);margin-top:12px;'
      main.appendChild(overlay)
    }
    return overlay
  }

  function removeOverlay() {
    document.getElementById('hx-wards-list-overlay')?.remove()
  }

  async function loadData() {
    if (!window.hxBackend?.enabled?.()) throw new Error('后端接口未连接，请检查登录状态')
    await window.hxBackend.ensureAuth()
    const data = await window.hxBackend.get('/beds/by-dept')
    return {
      updatedAt: data?.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : '',
      hospitalId: data?.hospitalId || '',
      departments: Array.isArray(data?.departments) ? data.departments : [],
    }
  }

  function renderTable(overlay, depts) {
    const total = depts.reduce((s, d) => s + d.total, 0)
    const occupied = depts.reduce((s, d) => s + d.occupied, 0)
    const reserved = depts.reduce((s, d) => s + d.reserved, 0)
    const free = depts.reduce((s, d) => s + d.free, 0)

    const rows = depts
      .map(
        (d, idx) => `
      <tr data-dept-key="${esc(d.id)}-${idx}">
        <td><strong>${esc(d.name)}</strong></td>
        <td>${esc(d.id)}</td>
        <td>${d.total}</td>
        <td>${d.occupied}</td>
        <td>${d.reserved}</td>
        <td>${d.free}</td>
        <td>${d.total ? Math.round((d.occupied / d.total) * 100) + '%' : '—'}</td>
      </tr>`,
      )
      .join('')

    overlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
        <h2 style="margin:0;font-size:16px;">科室床位统计</h2>
        <span style="font-size:12px;color:#64748b;">数据来自后端接口 /beds/by-dept</span>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:16px;font-size:13px;">
        <span>总床 <b>${total}</b></span>
        <span>占用 <b style="color:#c0392b;">${occupied}</b></span>
        <span>预留 <b style="color:#e67e22;">${reserved}</b></span>
        <span>空闲 <b style="color:#27ae60;">${free}</b></span>
        <span style="color:#64748b;margin-left:auto;" id="hx-wards-updated"></span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <th style="text-align:left;padding:10px 8px;font-weight:600;">科室</th>
              <th style="text-align:left;padding:10px 8px;font-weight:600;">科室编码</th>
              <th style="text-align:right;padding:10px 8px;font-weight:600;">总床</th>
              <th style="text-align:right;padding:10px 8px;font-weight:600;">占用</th>
              <th style="text-align:right;padding:10px 8px;font-weight:600;">预留</th>
              <th style="text-align:right;padding:10px 8px;font-weight:600;">空闲</th>
              <th style="text-align:right;padding:10px 8px;font-weight:600;">占用率</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="padding:20px;text-align:center;color:#94a3b8;">暂无数据</td></tr>'}</tbody>
        </table>
      </div>
    `
    const upEl = overlay.querySelector('#hx-wards-updated')
    if (upEl) upEl.textContent = '更新于 ' + (window.__hxWardsUpdated || '—')
  }

  function renderError(overlay, msg) {
    overlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
        <h2 style="margin:0;font-size:16px;">科室床位统计</h2>
      </div>
      <p style="color:#c0392b;font-size:13px;margin:12px 0;">
        加载失败：${esc(msg)}
        <button type="button" id="hx-wards-retry" style="margin-left:8px;padding:2px 10px;border:1px solid #c0392b;background:#fff;color:#c0392b;border-radius:4px;cursor:pointer;font-size:12px;">重试</button>
      </p>
    `
    const btn = overlay.querySelector('#hx-wards-retry')
    if (btn) btn.onclick = () => apply()
  }

  function hideVendorCards() {
    const main = mainEl()
    if (!main) return
    // 隐藏所有可能包含床位卡片的容器（保留 overlay）
    main.querySelectorAll(':scope > *').forEach((child) => {
      if (child.id === 'hx-wards-list-overlay') return
      const cls = child.className || ''
      const text = child.textContent || ''
      // 隐藏标题、筛选栏、卡片网格等非 overlay 内容
      if (
        cls.includes('workspace-heading') ||
        cls.includes('filter-bar') ||
        cls.includes('panel-grid') ||
        cls.includes('critical') ||
        cls.includes('bed') ||
        text.includes('威远县人民医院') ||
        text.includes('四川大学华西医院') ||
        text.includes('内江市第一人民医院') ||
        child.querySelector('.critical-bed, .bed-card, .card')
      ) {
        child.style.display = 'none'
        child.dataset.hxWardsHidden = '1'
      }
    })
  }

  function restoreVendorCards() {
    const main = mainEl()
    if (!main) return
    main.querySelectorAll('[data-hx-wards-hidden]').forEach((el) => {
      el.style.display = ''
      delete el.dataset.hxWardsHidden
    })
  }

  async function apply() {
    if (!isWardsPage()) {
      restoreVendorCards()
      removeOverlay()
      return
    }

    const overlay = ensureOverlay()
    if (!overlay) return

    hideVendorCards()

    overlay.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;"><h2 style="margin:0;font-size:16px;">科室床位统计</h2></div><p style="color:#94a3b8;font-size:13px;">正在加载…</p>'

    try {
      const data = await loadData()
      window.__hxWardsUpdated = data.updatedAt
      renderTable(overlay, data.departments)
    } catch (e) {
      renderError(overlay, e instanceof Error ? e.message : String(e))
    }
  }

  window.addEventListener('hashchange', apply)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
  else apply()

  // vendor 可能异步渲染，用 MutationObserver 兜底
  const mo = new MutationObserver(() => {
    if (!isWardsPage()) return
    if (!document.getElementById('hx-wards-list-overlay')) apply()
  })
  mo.observe(document.body, { childList: true, subtree: true })
})()
