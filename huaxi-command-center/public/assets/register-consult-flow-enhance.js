/**
 * 院前就地登记 · 发起远程会诊：任务号+主诉必填；无姓名时 confirm 后可继续
 */
;(function () {
  function readDhForm(form) {
    if (!form) return null
    const labels = [...form.querySelectorAll('label')]
    function field(match) {
      const lab = labels.find((l) => (l.textContent || '').includes(match))
      const el = lab?.querySelector('input, textarea, select')
      return (el && 'value' in el ? String(el.value) : '').trim()
    }
    return {
      task120Id: field('120') || field('任务'),
      eventId: '',
      name: field('姓名'),
      chiefComplaint: field('主诉'),
      vehiclePlate: field('车牌'),
      vehicleId: '',
    }
  }

  function blockReason(ctx) {
    const task = (ctx.task120Id || ctx.eventId || '').trim()
    if (!task) return '请先选择出警任务或填写 120 任务号，再发起远程会诊。'
    if (!(ctx.chiefComplaint || '').trim()) return '请填写主诉（可从左侧任务带入），再发起远程会诊。'
    return null
  }

  function consultUrl(ctx) {
    const q = new URLSearchParams()
    if (ctx.task120Id) q.set('task', ctx.task120Id)
    if (ctx.eventId) q.set('event', ctx.eventId)
    if (ctx.vehiclePlate) q.set('plate', ctx.vehiclePlate)
    if (ctx.vehicleId) q.set('vehicle', ctx.vehicleId)
    if (ctx.chiefComplaint) q.set('complaint', ctx.chiefComplaint)
    const s = q.toString()
    return s ? `/app.html#/consultations?${s}&launch=1` : '/app.html#/consultations?tab=grassroots'
  }

  function dialog(opts) {
    if (typeof window.__hxConsultDialog === 'function') {
      return window.__hxConsultDialog(opts)
    }
    if (opts.variant === 'alert') {
      window.alert([opts.body, opts.lead].filter(Boolean).join('\n\n'))
      return Promise.resolve(true)
    }
    return Promise.resolve(window.confirm([opts.body, opts.lead].filter(Boolean).join('\n\n')))
  }

  async function tryLaunch(ctx) {
    const block = blockReason(ctx)
    if (block) {
      await dialog({
        variant: 'alert',
        title: '暂无法发起远程会诊',
        body: block,
        confirmText: '知道了',
      })
      return false
    }
    if (!(ctx.name || '').trim()) {
      const ok = await dialog({
        variant: 'confirm',
        title: '发起远程会诊',
        body: '建议先保存草稿或填写姓名，便于会诊队列关联患者。',
        lead: '仍要现在发起远程会诊吗？',
        confirmText: '仍要发起',
        cancelText: '返回填写',
      })
      if (!ok) return false
    }
    var href = consultUrl(ctx)
    var topWin = window.top || window
    if (window.parent !== window && topWin !== window) {
      topWin.location.href = location.origin + href
    } else {
      window.location.href = href
    }
    return true
  }

  window.__hxTryConsultLaunch = tryLaunch

  document.addEventListener(
    'click',
    (event) => {
      const t = event.target
      if (!(t instanceof Element)) return
      const link = t.closest('a[href*="consultations"], a[href*="#/consultations"]')
      const btn = t.closest('button')
      const isConsultBtn =
        btn &&
        /发起远程会诊|发起会诊/.test(btn.textContent || '') &&
        !btn.closest('.modal')
      if (!link && !isConsultBtn) return

      const form = (link || btn)?.closest('.dh-form, form')
      if (!form) return
      if (form.classList.contains('dh-form') && btn && /发起远程会诊|发起会诊/.test(btn.textContent || '')) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      const ctx = readDhForm(form)
      if (ctx) void tryLaunch(ctx)
    },
    true,
  )
})()
