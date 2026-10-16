/**
 * #/patients：React 会优先合并 huaxi-final-demo-v1，旧存档里的姓名不会被子 scenario 覆盖。
 * 本脚本从 GET /patients 拉真实姓名/主诉，刷新表格单元格（与 transfer-api-enhance 同类 DOM 补丁）。
 */
;(function () {
  const DEMO_STORE = 'huaxi-final-demo-v1'
  /** @type {Map<string, { name: string, symptoms: string[] }>} */
  let byId = new Map()
  let inflight = null

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function mapRow(p) {
    return typeof window.hxMapPatientFromApi === 'function' ? window.hxMapPatientFromApi(p) : null
  }

  async function loadPatients() {
    if (!window.hxBackend?.strict?.()) return
    if (!(await window.hxBackend.ensureAuth(false))) return
    if (inflight) return inflight
    inflight = window.hxBackend
      .list('/patients', { pageSize: 100, pageNum: 1 })
      .then((rows) => {
        byId = new Map()
        ;(rows || []).forEach((p) => {
          const row = mapRow(p)
          if (row?.id) byId.set(String(row.id), row)
        })
      })
      .catch(() => {})
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  function patchTable() {
    if (!byId.size) return
    const table = document.querySelector('main.workspace .business-table table')
    if (!table) return
    table.querySelectorAll('tbody tr').forEach((tr) => {
      const first = tr.querySelector('td:first-child')
      if (!first) return
      const strong = first.querySelector('strong')
      const small = first.querySelector('small')
      const id = (small?.textContent || '').trim()
      if (!id) return
      const hit = byId.get(id)
      if (!hit) return
      if (strong && hit.name && strong.textContent !== hit.name) {
        strong.textContent = hit.name
      }
      const tds = tr.querySelectorAll('td')
      const chiefCell = tds[3]
      if (chiefCell && hit.symptoms?.length) {
        const txt = hit.symptoms.join('、')
        if (!chiefCell.textContent.trim() || chiefCell.textContent.trim() === '未填写') {
          chiefCell.textContent = txt
        }
      }
    })
  }

  async function apply() {
    if (path() !== '/patients') return
    await loadPatients()
    patchTable()
  }

  window.hxEnhance(apply, { wait: 180, afterNav: 100 })
})()
