/**
 * 板块 3 基层调度 · 4 医院质控 · 5 基层 Dr. — 展示 Laravel v1 实时数据（与 mock 演示并存）
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function fmtTime(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('zh-CN', { hour12: false })
    } catch {
      return iso
    }
  }

  const STATUS_LABEL = {
    TRANSFER_PENDING: '待确认',
    TRANSFER_CONFIRMED: '已确认',
    TRANSFER_REJECTED: '已驳回',
    TRANSFER_IN_TRANSIT: '转运中',
    TRANSFER_COMPLETED: '已完成',
  }

  function mountPanel(host, id, html) {
    if (!host) return
    let box = document.getElementById(id)
    if (!box) {
      box = document.createElement('div')
      box.id = id
      box.className = 'hx-plate-api-wrap'
      const anchor =
        host.querySelector('.workspace-heading') ||
        host.querySelector('.hx-grassroots-story') ||
        host.querySelector('.dr-playlist') ||
        host.firstElementChild
      if (anchor) anchor.insertAdjacentElement('afterend', box)
      else host.insertBefore(box, host.firstChild)
    }
    if (box.dataset.html === html) return
    box.dataset.html = html
    box.innerHTML = html
  }

  function header(title, meta, ok) {
    const badge = ok
      ? '<span class="hx-plate-api-badge hx-plate-api-badge--live">后端已连接</span>'
      : '<span class="hx-plate-api-badge hx-plate-api-badge--mock">演示数据 · 后端未达</span>'
    return `<section class="hx-plate-api" aria-label="${escapeHtml(title)}">
      <header><strong>${escapeHtml(title)}</strong>${badge}<span class="hx-plate-api-meta">${escapeHtml(meta || '')}</span></header>`
  }

  async function backendOk() {
    if (!window.hxBackend?.enabled?.()) return false
    const h = await window.hxBackend.health()
    if (!h?.status) return false
    return window.hxBackend.ensureAuth()
  }

  async function renderOrganizations() {
    const host = document.querySelector('main.workspace') || document.querySelector('.workspace')
    if (!host) return
    const live = await backendOk()
    let rows = []
    let deptCount = 0
    if (live) {
      try {
        const [orgs, depts] = await Promise.all([
          window.hxBackend.list('/organizations', { per_page: 100 }),
          window.hxBackend.list('/departments', { per_page: 200 }),
        ])
        rows = orgs
        deptCount = depts.length
      } catch {
        /* keep empty */
      }
    }
    const table =
      rows.length === 0
        ? '<p class="hx-plate-api-empty">暂无机构数据；请在后端执行 seed 并启动 <code>php artisan serve</code>。</p>'
        : `<div class="hx-plate-api-scroll"><table><thead><tr>
            <th>机构</th><th>类型</th><th>县域</th><th>联系电话</th><th>地址</th>
          </tr></thead><tbody>${rows
            .map(
              (o) => `<tr>
              <td><b>${escapeHtml(o.org_name || o.id)}</b><small>${escapeHtml(o.org_code || '')}</small></td>
              <td>${escapeHtml(o.org_type || '—')}</td>
              <td>${escapeHtml(o.county_name || '—')}</td>
              <td>${escapeHtml(o.contact_phone || '—')}</td>
              <td>${escapeHtml(o.address || '—')}</td>
            </tr>`,
            )
            .join('')}</tbody></table></div>`
    mountPanel(
      host,
      'hx-plate-api-orgs',
      `${header('3.3 基层机构管理 · API', live ? `科室 ${deptCount} 条 · GET /v1/organizations` : 'GET /v1/organizations', live && rows.length)}${table}</section>`,
    )
  }

  async function renderTransfers() {
    const host = document.querySelector('main.workspace') || document.querySelector('.workspace')
    if (!host) return
    const live = await backendOk()
    let rows = []
    if (live) {
      try {
        rows = await window.hxBackend.list('/transfers', { per_page: 30 })
      } catch {
        /* ignore */
      }
    }
    const table =
      rows.length === 0
        ? '<p class="hx-plate-api-empty">暂无转诊单；下方列表仍为 scenario 演示。</p>'
        : `<div class="hx-plate-api-scroll"><table><thead><tr>
            <th>转诊单</th><th>患者</th><th>自 → 至</th><th>紧急度</th><th>状态</th><th>更新时间</th>
          </tr></thead><tbody>${rows
            .map((t) => {
              const from = t.from_org?.org_name || t.from_org_id || '—'
              const to = t.to_org?.org_name || t.to_org_id || '—'
              const patient = t.patient?.name || t.patient_id || '—'
              const st = STATUS_LABEL[t.transfer_status] || t.transfer_status || '—'
              return `<tr>
                <td><b>${escapeHtml(t.transfer_code || t.id)}</b></td>
                <td>${escapeHtml(patient)}</td>
                <td>${escapeHtml(from)} → ${escapeHtml(to)}</td>
                <td>${escapeHtml(t.urgency_level || '—')}</td>
                <td>${escapeHtml(st)}${t.confirm_status ? `<small>${escapeHtml(t.confirm_status)}</small>` : ''}</td>
                <td>${fmtTime(t.updated_at)}</td>
              </tr>`
            })
            .join('')}</tbody></table></div>`
    mountPanel(
      host,
      'hx-plate-api-transfers',
      `${header('3.2 医院转诊 · API', 'GET /v1/transfers · 确认/驳回 POST …/confirm|reject', live && rows.length)}${table}</section>`,
    )
  }

  async function renderConsultBanner() {
    const host = document.querySelector('main.workspace') || document.querySelector('.workspace')
    if (!host) return
    const live = await backendOk()
    mountPanel(
      host,
      'hx-plate-api-consult',
      `${header(
        '3.1 基层会诊',
        live ? 'GET /consultations · 见上方 hx-wire-consult 面板' : '后端未连接 · 全部为演示存档',
        live,
      )}<p class="hx-plate-api-note">会诊意见写接口：/#/room/:token 保存时 POST /rooms/{token}/opinions。</p></section>`,
    )
  }

  async function renderQcReport() {
    const host = document.querySelector('main.workspace') || document.querySelector('.quality-workspace')
    if (!host) return
    const live = await backendOk()
    let report = null
    if (live) {
      try {
        report = await window.hxBackend.get('/qc-issues-report')
      } catch {
        /* ignore */
      }
    }
    let body = '<p class="hx-plate-api-empty">无法加载 qc-issues-report。</p>'
    if (report) {
      const sev = report.by_severity || {}
      const st = report.by_status || {}
      const orgRows = (report.by_org || []).slice(0, 8)
      body = `<div class="hx-plate-api-kpis">
          <div><b>${report.total ?? 0}</b><span>整改单总数</span></div>
          <div><b>${sev.HIGH ?? sev.high ?? 0}</b><span>高严重度</span></div>
          <div><b>${st.QC_OPEN ?? 0}</b><span>待整改</span></div>
        </div>
        ${
          orgRows.length
            ? `<div class="hx-plate-api-scroll"><table><thead><tr><th>督查对象</th><th>总数</th><th>已销号</th><th>超期</th><th>按期率</th></tr></thead><tbody>${orgRows
                .map(
                  (o) => `<tr>
                  <td>${escapeHtml(o.supervise_target)}</td>
                  <td>${o.total}</td>
                  <td>${o.closed}</td>
                  <td>${o.overdue}</td>
                  <td>${o.on_time_rate != null ? `${Math.round(o.on_time_rate * 100)}%` : '—'}</td>
                </tr>`,
                )
                .join('')}</tbody></table></div>`
            : ''
        }
        <p class="hx-plate-api-foot"><a href="/backend-api/v1/qc-issues-export" download>导出 CSV</a> · GET /v1/qc-issues-report</p>`
    }
    mountPanel(
      host,
      'hx-plate-api-qc-report',
      `${header('4.2 质控统计 · API', report ? `更新 ${fmtTime(report.updatedAt)}` : 'GET /v1/qc-issues-report', !!report)}${body}</section>`,
    )
  }

  async function renderMedicalQualityBanner() {
    const host = document.querySelector('.quality-workspace') || document.querySelector('main.workspace')
    if (!host) return
    const live = await backendOk()
    mountPanel(
      host,
      'hx-plate-api-qc-banner',
      `${header(
        '4 医院质控',
        live
          ? '环节时限 / 标准：qc-sla、qc-standards 已走 /v1；下方整改台账仍为演示存档'
          : '未连接后端 · 环节时限读本地 JSON',
        live,
      )}<p class="hx-plate-api-note">4.1 智能监控：见上方环节时限块；4.3 质控提醒：超期行与 SLA 表联动演示。接全量整改单可扩展 sync qc-issues → scenario。</p></section>`,
    )
  }

  async function renderDr() {
    if (!document.querySelector('.dr-page')) return
    const host = document.querySelector('.dr-page')
    const live = await backendOk()
    let doctors = []
    let records = []
    if (live) {
      try {
        ;[doctors, records] = await Promise.all([
          window.hxBackend.list('/doctors', { per_page: 20 }),
          window.hxBackend.list('/clinical-records', { per_page: 15 }),
        ])
      } catch {
        /* ignore */
      }
    }
    const docList = doctors.length
      ? doctors
          .map(
            (d) =>
              `<li><b>${escapeHtml(d.real_name || d.username)}</b> · ${escapeHtml(d.org?.org_name || d.org_id || '—')} · ${escapeHtml(d.user_status || '')}</li>`,
          )
          .join('')
      : '<li class="hx-plate-api-empty">暂无医生档案</li>'
    const recList = records.length
      ? records
          .map(
            (r) =>
              `<li><b>${escapeHtml(r.record_code || r.id)}</b> ${escapeHtml(r.diagnosis || r.chief_complaint || '—')} <small>${fmtTime(r.visit_at)} · ${escapeHtml(r.doctor_name || '')}</small></li>`,
          )
          .join('')
      : '<li class="hx-plate-api-empty">暂无诊疗记录（可用于 3.4 远程监护摘要）</li>'
    mountPanel(
      host,
      'hx-plate-api-dr',
      `${header('5 基层医生 Dr. · API', 'GET /v1/doctors · /v1/clinical-records', live && (doctors.length || records.length))}
        <div class="hx-plate-api-cols">
          <div><h3>医生</h3><ul>${docList}</ul></div>
          <div><h3>近期诊疗 / 监护记录</h3><ul>${recList}</ul></div>
        </div>
        <p class="hx-plate-api-foot">5.1 视频展示仍为本页播放列表（Bilibili 增强）；业务数据来自后端。</p>
      </section>`,
    )
  }

  function clearPanels() {
    ;[
      'hx-plate-api-orgs',
      'hx-plate-api-transfers',
      'hx-plate-api-consult',
      'hx-plate-api-qc-report',
      'hx-plate-api-qc-banner',
      'hx-plate-api-dr',
    ].forEach((id) => document.getElementById(id)?.remove())
  }

  async function render() {
    const p = path()
    clearPanels()
    if (p === '/organizations') await renderOrganizations()
    else if (p === '/transfers') await renderTransfers()
    else if (p === '/consultations') await renderConsultBanner()
    else if (p === '/medical-quality/reports') await renderQcReport()
    else if (p === '/medical-quality') await renderMedicalQualityBanner()
    else if (p === '/dr') await renderDr()
  }

  window.addEventListener('hashchange', () => {
    clearPanels()
  })

  window.hxEnhance(render, { wait: 450, observeRoot: true, afterNav: 100 })
})()
