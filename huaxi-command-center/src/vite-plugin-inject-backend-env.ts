import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

const MARKER = '<!-- INJECT_BACKEND_ENV -->'

function buildEnvScript(mode: string): string {
  const env = loadEnv(mode, process.cwd(), '')
  const stmts: string[] = []

  const base = env.VITE_API_BASE?.trim()
  const user = env.VITE_API_USER?.trim()
  const pass = env.VITE_API_PASS?.trim()
  const fullBackend = env.VITE_FULL_BACKEND?.trim()

  if (base) stmts.push(`localStorage.setItem('huaxi-api-origin',${JSON.stringify(base)})`)
  if (user) stmts.push(`localStorage.setItem('huaxi-api-user',${JSON.stringify(user)})`)
  if (pass) stmts.push(`localStorage.setItem('huaxi-api-pass',${JSON.stringify(pass)})`)
  if (fullBackend === '1') {
    stmts.push(`localStorage.setItem('huaxi-full-backend','1')`)
    stmts.push(`localStorage.removeItem('huaxi-api-mock')`)
  }
  if (fullBackend === '0') stmts.push(`localStorage.setItem('huaxi-full-backend','0')`)
  if (mode === 'development' && fullBackend !== '1') {
    stmts.push(`if(localStorage.getItem('huaxi-full-backend')!=='1')localStorage.setItem('huaxi-full-backend','0')`)
    stmts.push(`if(localStorage.getItem('huaxi-backend-live')!=='0')localStorage.setItem('huaxi-backend-live','1')`)
  }

  if (!stmts.length) return MARKER

  return `<script>(function(){try{${stmts.join(';')}}catch(e){}})();</script>`
}

export function injectBackendEnvPlugin(): Plugin {
  let mode = 'production'
  return {
    name: 'inject-backend-env',
    configResolved(config) {
      mode = config.mode
    },
    transformIndexHtml(html) {
      if (!html.includes(MARKER)) return html
      return html.replace(MARKER, buildEnvScript(mode))
    },
  }
}
