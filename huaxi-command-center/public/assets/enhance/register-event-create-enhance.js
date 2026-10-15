/**
 * 「患者接入登记」页（#/register）追加「创建事件」区块。
 *
 * 字段与「事件列表」一致（后端 POST /dispatch/events，StoreDispatchEventRequest）：
 *   task120Id      120 任务号（必填）
 *   level          事件等级（CRITICAL 重症 / ACUTE 急症 / GENERAL 一般）
 *   chiefComplaint 主诉（必填）
 *   pickupAddress  接车地址（必填）
 *   destination    送达地点（选填）
 *   startedAt      出警时间（选填）
 *
 * 事件编号 / 车辆 / 状态 / 预计到院由系统生成或后续关联，创建时不录入。
 */
;(function () {
  const ROOT_ID = 'hx-event-create-root'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function isRegisterPage() {
    return path() === '/register'
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function buildHtml() {
    return (
      '<section id="' + ROOT_ID + '" class="hx-event-create">' +
      '<header class="hx-event-create-head">' +
      '<h2>创建事件</h2>' +
      '<p>120 接警建档 · 字段与「事件列表」一致，初始状态为出警中</p>' +
      '</header>' +
      '<form class="hx-event-create-form" novalidate>' +
      '<label>120 任务号<input name="task120Id" required placeholder="如 120-WY-88421" /></label>' +
      '<label>事件等级<select name="level">' +
      '<option value="CRITICAL">重症</option>' +
      '<option value="ACUTE">急症</option>' +
      '<option value="GENERAL" selected>一般</option>' +
      '</select></label>' +
      '<label>主诉<input name="chiefComplaint" required placeholder="患者主要症状" /></label>' +
      '<label>接车地址<input name="pickupAddress" required placeholder="现场地址 / 接车地点" /></label>' +
      '<label>送达地点<input name="destination" placeholder="目标医院（选填）" /></label>' +
      '<label>出警时间<input name="startedAt" type="datetime-local" /></label>' +
      '<div class="hx-event-create-actions">' +
      '<button type="submit" class="hx-event-create-submit">创建事件</button>' +
      '</div>' +
      '<p class="hx-event-create-msg" role="status" aria-live="polite"></p>' +
      '</form>' +
      '</section>'
    )
  }

  function setMsg(root, text, kind) {
    const el = root.querySelector('.hx-event-create-msg')
    if (!el) return
    el.textContent = text
    el.className = 'hx-event-create-msg ' + (kind === 'warn' ? 'hx-event-create-msg--warn' : 'hx-event-create-msg--ok')
  }

  function values(form) {
    function field(name) {
      const el = form.querySelector('[name="' + name + '"]')
      return el ? String(el.value || '').trim() : ''
    }
    return {
      task120Id: field('task120Id'),
      level: field('level') || 'GENERAL',
      chiefComplaint: field('chiefComplaint'),
      pickupAddress: field('pickupAddress'),
      destination: field('destination'),
      startedAt: field('startedAt'),
    }
  }

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const root = form.closest('#' + ROOT_ID)
    const v = values(form)

    if (!v.task120Id) return setMsg(root, '请填写 120 任务号后再创建事件', 'warn')
    if (!v.chiefComplaint) return setMsg(root, '请填写主诉后再创建事件', 'warn')
    if (!v.pickupAddress) return setMsg(root, '请填写接车地址后再创建事件', 'warn')

    const submitBtn = form.querySelector('.hx-event-create-submit')
    if (submitBtn) submitBtn.disabled = true

    try {
      const payload = {
        task120Id: v.task120Id,
        level: v.level,
        chiefComplaint: v.chiefComplaint,
        pickupAddress: v.pickupAddress,
        destination: v.destination || undefined,
        startedAt: v.startedAt ? new Date(v.startedAt).toISOString() : undefined,
      }

      if (window.hxBackend?.enabled?.()) {
        await window.hxBackend.ensureAuth()
        const res = await window.hxBackend.post('/dispatch/events', payload)
        setMsg(root, '已创建事件 · 编号 ' + (res?.eventId || v.task120Id) + ' · 状态 出警中', 'ok')
        form.reset()
      } else {
        const key = 'huaxi-dispatch-created-events'
        const created = JSON.parse(localStorage.getItem(key) || '[]')
        created.unshift({
          ...payload,
          eventId: 'EVT-LOCAL-' + Date.now(),
          status: 'DISPATCHING',
          statusLabel: '出警中',
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem(key, JSON.stringify(created))
        setMsg(root, '已创建事件（本地演示）· 任务 ' + v.task120Id, 'ok')
        form.reset()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setMsg(root, '创建失败：' + msg, 'warn')
    } finally {
      if (submitBtn) submitBtn.disabled = false
    }
  }

  function inject() {
    if (!isRegisterPage()) return
    const main = document.querySelector('main.workspace.register-page')
    if (!main) return
    if (document.getElementById(ROOT_ID)) return

    const layout = main.querySelector('.register-layout')
    const wrap = document.createElement('section')
    wrap.innerHTML = buildHtml()
    const node = wrap.firstElementChild

    // 插到 .register-layout 之后，作为整页宽度的独立卡片
    if (layout && layout.parentNode) {
      layout.insertAdjacentElement('afterend', node)
    } else {
      main.appendChild(node)
    }

    node.querySelector('form').addEventListener('submit', submit)
  }

  function injectStyle() {
    if (document.getElementById('hx-event-create-style')) return
    const s = document.createElement('style')
    s.id = 'hx-event-create-style'
    s.textContent =
      '#hx-event-create-root{margin:0 0 20px;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:12px}' +
      '#hx-event-create-root .hx-event-create-head{margin-bottom:14px}' +
      '#hx-event-create-root .hx-event-create-head h2{margin:0;font-size:16px;font-weight:600;color:#0f172a}' +
      '#hx-event-create-root .hx-event-create-head p{margin:4px 0 0;font-size:13px;color:#64748b}' +
      '#hx-event-create-root .hx-event-create-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
      '#hx-event-create-root .hx-event-create-form label{display:block;font-size:13px;font-weight:600;color:#334155}' +
      '#hx-event-create-root .hx-event-create-form input,' +
      '#hx-event-create-root .hx-event-create-form select{display:block;width:100%;margin-top:6px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit;background:#fff;color:#1e293b}' +
      '#hx-event-create-root .hx-event-create-form input:focus,' +
      '#hx-event-create-root .hx-event-create-form select:focus{outline:none;border-color:#0284c7}' +
      '#hx-event-create-root .hx-event-create-actions{grid-column:1 / -1;display:flex;gap:10px}' +
      '#hx-event-create-root .hx-event-create-submit{padding:8px 18px;border:1px solid #0284c7;background:#0284c7;color:#fff;border-radius:8px;font:inherit;font-size:14px;font-weight:500;cursor:pointer}' +
      '#hx-event-create-root .hx-event-create-submit:hover{background:#0369a1;border-color:#0369a1}' +
      '#hx-event-create-root .hx-event-create-submit:disabled{opacity:.6;cursor:not-allowed}' +
      '#hx-event-create-root .hx-event-create-msg{grid-column:1 / -1;margin:0;font-size:13px;font-weight:500}' +
      '#hx-event-create-root .hx-event-create-msg--ok{color:#047857}' +
      '#hx-event-create-root .hx-event-create-msg--warn{color:#b45309}' +
      '@media (max-width:760px){#hx-event-create-root .hx-event-create-form{grid-template-columns:1fr}}'
    document.head.appendChild(s)
  }

  let observer = null
  function startObserver() {
    if (observer) return
    const root = document.querySelector('#root') || document.body
    observer = new MutationObserver(() => {
      if (isRegisterPage() && !document.getElementById(ROOT_ID)) inject()
    })
    observer.observe(root, { childList: true, subtree: true })
  }

  injectStyle()
  startObserver()
  window.hxEnhance(inject, { wait: 320, afterNav: 120, observeRoot: true })
})()
