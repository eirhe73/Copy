/**
 * 床位总览 /beds：将页面替换为后端 /beds/overview 列表
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function isBedsPage() {
    return path() === '/beds'
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
    let overlay = document.getElementById('hx-beds-overview-overlay')
    if (!overlay) {
      overlay = document.createElement('section')
      overlay.id = 'hx-beds-overview-overlay'
      overlay.className = 'hx-beds-overview-overlay'
      overlay.style.cssText =
        'position:relative;width:100%;min-height:400px;background:#fff;border-radius:8px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.08);margin-top:12px;'
      main.appendChild(overlay)
    }
    return overlay
  }

  function removeOverlay() {
    document.getElementById('hx-beds-overview-overlay')?.remove()
  }

  async function loadData() {
    if (!window.hxBackend?.enabled?.()) throw new Error('后端接口未连接，请检查登录状态')
    await window.hxBackend.ensureAuth()
    const [overview, reserved] = await Promise.all([
      window.hxBackend.get('/beds/overview'),
      window.hxBackend.get('/beds/reserved'),
    ])
    return {
      updatedAt: overview?.updatedAt ? new Date(overview.updatedAt).toLocaleString('zh-CN') : '',
      totalBeds: overview?.totalBeds ?? 0,
      occupiedBeds: overview?.occupiedBeds ?? 0,
      reservedBeds: overview?.reservedBeds ?? 0,
      freeBeds: overview?.freeBeds ?? 0,
      occupancyRate: overview?.occupancyRate ?? 0,
      hospitals: Array.isArray(overview?.hospitals) ? overview.hospitals : [],
      reservedList: Array.isArray(reserved?.list) ? reserved.list : [],
      reservedTotal: reserved?.total ?? 0,
    }
  }

  function render(overlay, data) {
    const rate = data.occupancyRate != null ? Math.round(data.occupancyRate) + '%' : '—'
    const rows = data.hospitals
      .map(
        (h, idx) => `
      <tr data-hosp-key="${esc(h.institutionId)}-${idx}">
        <td><strong>${esc(h.institutionName)}</strong></td>
        <td>${esc(h.institutionId)}</td>
        <td>${h.total}</td>
        <td>${h.occupied}</td>
        <td>${h.reserved}</td>
        <td>${h.free}</td>
        <td>${h.occupancyRate != null ? Math.round(h.occupancyRate) + '%' : '—'}</td>
      </tr>`,
      )
      .join('')

    const reservedRows = data.reservedList
      .map(
        (r) => `
      <tr>
        <td><strong>${esc(r.label || r.bedId)}</strong></td>
        <td>${esc(r.institutionName || r.institutionId)}</td>
        <td>${esc(r.departmentName || r.departmentId)}</td>
        <td>${esc(r.reserveReason || '—')}</td>
        <td>${r.reservedUntil ? new Date(r.reservedUntil).toLocaleString('zh-CN', { hour12: false }) : '—'}</td>
      </tr>`,
      )
      .join('')

    overlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;">
        <h2 style="margin:0;font-size:18px;">病床总览</h2>
        <span style="font-size:12px;color:#64748b;">数据来自后端接口 /beds/overview + /beds/reserved</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
        <div style="background:#f8fafc;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">总床位</div>
          <div style="font-size:24px;font-weight:700;color:#0f172a;">${data.totalBeds}</div>
        </div>
        <div style="background:#fdf2f2;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">占用</div>
          <div style="font-size:24px;font-weight:700;color:#c0392b;">${data.occupiedBeds}</div>
        </div>
        <div style="background:#fff7ed;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">预留</div>
          <div style="font-size:24px;font-weight:700;color:#e67e22;">${data.reservedBeds}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">空闲</div>
          <div style="font-size:24px;font-weight:700;color:#27ae60;">${data.freeBeds}</div>
        </div>
        <div style="background:#eff6ff;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">占用率</div>
          <div style="font-size:24px;font-weight:700;color:#1e4b7b;">${rate}</div>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <th style="text-align:left;padding:10px 8px;font-weight:600;">医院名称</th>
              <th style="text-align:left;padding:10px 8px;font-weight:600;">机构编码</th>
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

      <div style="margin-top:24px;">
        <h3 style="margin:0 0 12px;font-size:15px;color:#0f172a;">预留床位（共 ${data.reservedTotal} 条）</h3>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                <th style="text-align:left;padding:10px 8px;font-weight:600;">床位</th>
                <th style="text-align:left;padding:10px 8px;font-weight:600;">医院</th>
                <th style="text-align:left;padding:10px 8px;font-weight:600;">科室</th>
                <th style="text-align:left;padding:10px 8px;font-weight:600;">预留原因</th>
                <th style="text-align:left;padding:10px 8px;font-weight:600;">预留至</th>
              </tr>
            </thead>
            <tbody>${reservedRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#94a3b8;">暂无预留床位</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin-top:12px;text-align:right;">更新于 ${esc(data.updatedAt)}</p>
    `
  }

  function renderError(overlay, msg) {
    overlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
        <h2 style="margin:0;font-size:18px;">病床总览</h2>
      </div>
      <p style="color:#c0392b;font-size:13px;margin:12px 0;">
        加载失败：${esc(msg)}
        <button type="button" id="hx-beds-retry" style="margin-left:8px;padding:4px 12px;border:1px solid #c0392b;background:#fff;color:#c0392b;border-radius:4px;cursor:pointer;font-size:12px;">重试</button>
      </p>
    `
    const btn = overlay.querySelector('#hx-beds-retry')
    if (btn) btn.onclick = () => apply()
  }

  function hideVendorContent() {
    const main = mainEl()
    if (!main) return
    main.querySelectorAll(':scope > *').forEach((child) => {
      if (child.id === 'hx-beds-overview-overlay') return
      child.style.display = 'none'
      child.dataset.hxBedsHidden = '1'
    })
  }

  function restoreVendorContent() {
    const main = mainEl()
    if (!main) return
    main.querySelectorAll('[data-hx-beds-hidden]').forEach((el) => {
      el.style.display = ''
      delete el.dataset.hxBedsHidden
    })
  }

  async function apply() {
    if (!isBedsPage()) {
      restoreVendorContent()
      removeOverlay()
      return
    }

    const overlay = ensureOverlay()
    if (!overlay) return

    hideVendorContent()

    overlay.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;"><h2 style="margin:0;font-size:18px;">病床总览</h2></div><p style="color:#94a3b8;font-size:13px;">正在加载…</p>'

    try {
      const data = await loadData()
      render(overlay, data)
    } catch (e) {
      renderError(overlay, e instanceof Error ? e.message : String(e))
    }
  }

  window.addEventListener('hashchange', apply)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
  else apply()

  const mo = new MutationObserver(() => {
    if (!isBedsPage()) return
    if (!document.getElementById('hx-beds-overview-overlay')) apply()
  })
  mo.observe(document.body, { childList: true, subtree: true })
})()
