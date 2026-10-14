/**
 * index.html：仅提交表单时 POST /v1/auth/login（走 bridge 原生 fetch，避免被劫持）
 */
;(function () {
  const FRESH_TOKEN_KEY = 'huaxi-jwt-just-logged-in'

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

  function demoCredentials() {
    let username = 'admin'
    let password = '123456'
    try {
      const u = localStorage.getItem('huaxi-api-user')?.trim()
      const p = localStorage.getItem('huaxi-api-pass')
      if (u) username = u
      if (p) password = p
    } catch {
      /* ignore */
    }
    return { username, password }
  }

  function fillDemoCredentials(form) {
    const { username, password } = demoCredentials()
    const userInput = form.querySelector('[name="username"]')
    const passInput = form.querySelector('[name="password"]')
    if (userInput) userInput.value = username
    if (passInput) passInput.value = password
    showError('')
    setStatus('')
    passInput?.focus()
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

  function enterDemoOnly() {
    try {
      localStorage.setItem('huaxi-demo-only', '1')
      localStorage.setItem('huaxi-api-mock', '1')
      localStorage.removeItem('huaxi-jwt-token')
      sessionStorage.removeItem('huaxi-jwt-token')
      sessionStorage.removeItem(FRESH_TOKEN_KEY)
    } catch {
      /* ignore */
    }
    showError('')
    setStatus('演示模式：使用本地数据，不请求远程 API')
    location.replace(nextUrl())
  }

  async function postLogin(username, password) {
    if (!window.hxBackend?.loginWithPassword) {
      throw new Error('登录模块未加载，请刷新页面')
    }
    setStatus('正在登录…')
    console.info('[hx-login] POST auth/login', { username })
    await window.hxBackend.loginWithPassword(username, password)
    try {
      sessionStorage.setItem(FRESH_TOKEN_KEY, '1')
    } catch {
      /* ignore */
    }
    setStatus('')
  }

  function bindForm() {
    const form = document.getElementById('hx-login-form')
    if (!form || form.dataset.bound === '1') return
    form.dataset.bound = '1'

    const userInput = form.querySelector('[name="username"]')
    if (userInput && !userInput.value.trim()) userInput.value = savedUsername()

    document.getElementById('hx-login-fill-demo')?.addEventListener('click', () => fillDemoCredentials(form))
    document.getElementById('hx-login-demo-only')?.addEventListener('click', () => enterDemoOnly())

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
        let msg = String(err.message || err).replace(/^Error:\s*/, '') || '登录失败'
        if (/HTTP\s*404|无法连接/i.test(msg)) {
          msg += '。远程 API 未部署或地址不对，请点下方「演示模式进入」。'
        }
        showError(msg)
        setStatus('')
        btn.disabled = false
      }
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindForm)
  else bindForm()
})()
