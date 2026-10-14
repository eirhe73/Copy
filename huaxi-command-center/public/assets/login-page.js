/**
 * index.html：点击登录时用原生 fetch POST /v1/auth/login（Network 可见 auth/login）
 */
;(function () {
  function apiLoginUrl() {
    if (window.hxBackend?.loginUrl) return window.hxBackend.loginUrl()
    const base = window.HX_API_CONFIG?.base || '/backend-api'
    return String(base).replace(/\/$/, '') + '/v1/auth/login'
  }

  function nextUrl() {
    try {
      const q = new URLSearchParams(location.search).get('next')
      if (q && q.startsWith('/') && !/index\.html|login\.html/i.test(q)) return q
    } catch {
      /* ignore */
    }
    return '/app.html'
  }

  function savedUsername() {
    try {
      return localStorage.getItem('huaxi-api-user') || ''
    } catch {
      return ''
    }
  }

  function showError(msg) {
    const el = document.getElementById('hx-login-error')
    if (!el) return
    if (msg) {
      el.textContent = msg
      el.hidden = false
    } else {
      el.textContent = ''
      el.hidden = true
    }
  }

  function setStatus(msg) {
    const el = document.getElementById('hx-login-status')
    if (el) el.textContent = msg || ''
  }

  async function postLogin(username, password) {
    const url = apiLoginUrl()
    setStatus('正在请求 ' + url)
    console.info('[hx-login] POST', url, { username })

    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    let json = null
    try {
      json = await res.json()
    } catch {
      /* ignore */
    }

    const msg = json?.message || json?.msg || ''
    if (!res.ok) {
      throw new Error(msg || 'HTTP ' + res.status)
    }

    let data = json
    if (json && typeof json === 'object' && json.code === 200 && json.data) data = json.data
    const token = data?.token
    if (!token) throw new Error('响应无 token')

    if (window.hxBackend?.saveTokenFromLogin) {
      window.hxBackend.saveTokenFromLogin(token)
    } else {
      sessionStorage.setItem('huaxi-jwt-token', token)
      localStorage.setItem('huaxi-jwt-token', token)
    }

    setStatus('登录成功')
    return token
  }

  function bindForm() {
    const form = document.getElementById('hx-login-form')
    if (!form || form.dataset.bound === '1') return
    form.dataset.bound = '1'

    const userInput = form.querySelector('[name="username"]')
    if (userInput) userInput.value = savedUsername()

    const apiHint = document.getElementById('hx-login-api-hint')
    if (apiHint) apiHint.textContent = '接口：POST ' + apiLoginUrl()

    document.getElementById('hx-login-demo-link')?.addEventListener('click', () => {
      try {
        localStorage.setItem('huaxi-demo-only', '1')
      } catch {
        /* ignore */
      }
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      showError('')
      const fd = new FormData(form)
      const username = String(fd.get('username') || '').trim()
      const password = String(fd.get('password') || '')
      const remember = fd.get('remember') === 'on'
      if (!username || !password) return

      try {
        if (remember) localStorage.setItem('huaxi-api-user', username)
        else localStorage.removeItem('huaxi-api-user')
        localStorage.removeItem('huaxi-api-pass')
        localStorage.removeItem('huaxi-demo-only')
      } catch {
        /* ignore */
      }

      const btn = form.querySelector('button[type="submit"]')
      btn.disabled = true
      try {
        await postLogin(username, password)
        location.replace(nextUrl())
      } catch (err) {
        console.error('[hx-login]', err)
        showError(String(err.message || err))
        setStatus('')
        btn.disabled = false
      }
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindForm)
  else bindForm()
})()
