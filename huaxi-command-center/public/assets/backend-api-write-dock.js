/**
 * 严格模式下展示当前路由相关模块的全部写接口（POST/PUT/PATCH/DELETE），可试调用
 */
;(function () {
  const ROUTE_TAG = {
    '/': 'gis',
    '/dispatch': 'dispatch',
    '/monitoring': 'monitor',
    '/warning': 'warning',
    '/critical': 'critical',
    '/transport': 'transfer',
    '/beds': 'bed',
    '/bed': 'bed',
    '/patients': 'patient',
    '/patient': 'patient',
    '/register': 'dispatch',
    '/transfers': 'transfer',
    '/consultations': 'consult',
    '/room': 'consult',
    '/join': 'consult',
    '/coordination': 'coord',
    '/episode': 'dispatch',
    '/dr': 'dr',
    '/medical-quality': 'qc',
    '/quality': 'qc',
    '/organizations': 'org',
    '/centers': 'center',
    '/devices': 'device',
    '/messages': 'message',
    '/settings': 'settings',
    '/mobile-reception': 'mobile',
  }

  function routeTag() {
    const raw = (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
    const seg = raw.split('/').filter(Boolean)[0] || ''
    const key = seg ? `/${seg}` : '/'
    return ROUTE_TAG[key] || null
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  async function tryWrite(item) {
    await window.hxEnsureApiSamples?.()
    const path = window.hxResolveApiPath(item.path, {})
    const m = item.method
    if (m === 'DELETE') return window.hxBackend.delete(path)
    const body = window.HX_API_WRITE_BODY?.[item.path]
    if (m === 'GET') return window.hxBackend.get(path)
    return window.hxBackend.request(m, path, body)
  }

  function render() {
    if (!window.hxBackend?.strict?.() || !window.HX_API_CATALOG) return
    const tag = routeTag()
    if (!tag) return
    const writes = window.HX_API_CATALOG.filter(
      (x) => x.tag === tag && x.method !== 'GET' && !x.path.includes('/auth/login'),
    )
    if (!writes.length) return

    let box = document.getElementById('hx-api-write-dock')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-api-write-dock'
      document.body.appendChild(box)
    }
    const rows = writes
      .map(
        (w, i) =>
          `<tr><td>${esc(w.method)}</td><td>${esc(w.path)}</td><td><button type="button" class="hx-api-write-try" data-i="${i}">试调用</button></td></tr>`,
      )
      .join('')
    box.innerHTML = `<details class="hx-api-route-dock hx-api-write-dock">
      <summary>写接口 · 模块 ${esc(tag)} · ${writes.length} 个</summary>
      <p class="muted">试调用使用 HX_API_WRITE_BODY 或空 body；部分接口会 422，属预期。</p>
      <div class="hx-api-route-scroll"><table><thead><tr><th>方法</th><th>路径</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    </details>`

    box.querySelectorAll('.hx-api-write-try').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const w = writes[Number(btn.getAttribute('data-i'))]
        btn.disabled = true
        try {
          await tryWrite(w)
          btn.textContent = 'OK'
        } catch (e) {
          btn.textContent = String(e.message || e).slice(0, 40)
        }
      })
    })
  }

  window.addEventListener('hashchange', () => {
    document.getElementById('hx-api-write-dock')?.remove()
    setTimeout(render, 400)
  })

  window.hxEnhance(render, { wait: 800, observeRoot: false, afterNav: 200 })
})()
