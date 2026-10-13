import { useEffect } from 'react'

const SCRIPTS = [
  '/assets/map-light-3d-enhance.js',
  '/assets/map-medical-overlay.js',
  '/assets/home-panel-enhance.js',
] as const

function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[data-hx-enhance="${src}"]`)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.defer = true
    el.dataset.hxEnhance = src
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`load ${src}`))
    document.head.appendChild(el)
  })
}

/** 与旧版 index.html 一致：首页 3D 样式 + 协作节点侧栏 */
export function useHomeMapEnhancers(active: boolean) {
  useEffect(() => {
    if (!active) return
    let cancelled = false
    ;(async () => {
      for (const src of SCRIPTS) {
        if (cancelled) return
        try {
          await loadScript(src)
        } catch {
          /* 静态资源缺失时不阻塞地图 */
        }
      }
      window.dispatchEvent(new Event('resize'))
    })()
    return () => {
      cancelled = true
    }
  }, [active])
}
