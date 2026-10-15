/**
 * 实时出警 · 车内监控弹窗「发起会诊」→ P3 远程会诊工作台（带 task/plate/complaint&launch=1）
 * React 默认 R("/consultations") 无参数，且 register-consult-flow 排除了 .modal 内按钮。
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function readCtxFromDispatchUi() {
    const sel = document.querySelector(
      '.dispatch-active article.on, .dispatch-active article.selected, .dispatch-active article[aria-current="true"]',
    )
    const article = sel || document.querySelector('.dispatch-active article')
    let task120Id = new URLSearchParams(location.hash.split('?')[1] || '').get('task') || ''
    let chiefComplaint = ''
    let vehiclePlate = ''
    let name = ''

    if (article) {
      const text = article.textContent || ''
      if (!task120Id) {
        const m = text.match(/120[-\w]+/i)
        if (m) task120Id = m[0]
      }
      chiefComplaint =
        (article.querySelector('p, .complaint, [class*="complaint"]')?.textContent || '').trim().slice(0, 200) ||
        ''
      vehiclePlate =
        (article.querySelector('header button, .hx-dispatch-vehicle-name')?.textContent || '').trim() ||
        ''
    }

    const dialog =
      document.querySelector('[role="dialog"]:not([hidden])') ||
      document.querySelector('.modal:not([hidden])') ||
      document.querySelector('main.workspace [class*="modal"]')
    if (dialog) {
      const head = (dialog.querySelector('h1, h2, header')?.textContent || '').trim()
      const plateFromTitle = head.match(/([川渝][A-Z·]?\d{4,}|[A-Z]{1,2}\d{4,})/)
      if (plateFromTitle) vehiclePlate = plateFromTitle[1].replace(/·.*$/, '').trim()
      const aside = dialog.querySelector('aside, .vehicle-sidebar')
      if (aside) {
        aside.querySelectorAll('dt, dd, p, li').forEach(function (node) {
          const t = (node.textContent || '').trim()
          if (!task120Id && /120[-\w]+/i.test(t)) {
            const m = t.match(/120[-\w]+/i)
            if (m) task120Id = m[0]
          }
          if (!chiefComplaint && (t.includes('主诉') || t.length > 4)) {
            const m2 = t.match(/主诉[：:]\s*(.+)/)
            if (m2) chiefComplaint = m2[1].trim().slice(0, 200)
          }
        })
        const patientLink = aside.querySelector('a[href*="/patient/"], button')
        if (patientLink && /[\u4e00-\u9fa5]{2,4}/.test(patientLink.textContent || '')) {
          name = (patientLink.textContent || '').trim().slice(0, 20)
        }
      }
    }

    if (!vehiclePlate && article) {
      vehiclePlate = (article.querySelector('header > button')?.textContent || '').trim()
    }

    return {
      task120Id,
      eventId: '',
      vehiclePlate,
      vehicleId: '',
      name,
      chiefComplaint,
    }
  }

  document.addEventListener(
    'click',
    function (event) {
      if (path() !== '/dispatch') return
      const t = event.target
      if (!(t instanceof Element)) return
      const btn = t.closest('button')
      if (!btn) return
      const label = (btn.textContent || '').replace(/\s+/g, '')
      if (!/发起远程会诊|发起会诊/.test(label)) return

      const inVehicleModal =
        btn.closest('[role="dialog"]') ||
        btn.closest('.modal') ||
        btn.closest('.remote-summary') ||
        btn.closest('.vehicle-cameras')
      if (!inVehicleModal && !btn.closest('.dispatch-actions, .huaxi-dispatch-consult')) return

      if (typeof window.__hxTryConsultLaunch !== 'function') return

      event.preventDefault()
      event.stopImmediatePropagation()

      const ctx = readCtxFromDispatchUi()
      void window.__hxTryConsultLaunch(ctx)
    },
    true,
  )
})()
