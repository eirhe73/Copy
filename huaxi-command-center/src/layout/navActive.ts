import { IA_PLATES } from './iaNav'

function linkMatches(link: string, pathname: string, search: string): boolean {
  const ref = new URL(link, 'http://local')
  const current = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (ref.pathname !== pathname) return false
  return ['mode', 'view', 'focus'].every(
    (key) => ref.searchParams.get(key) === current.get(key),
  )
}

/** 顶栏五大模块高亮索引（与 bundle 中 r$ 一致） */
export function activePlateIndex(pathname: string, search: string): number {
  if (pathname.startsWith('/episode/')) return 0
  if (pathname.startsWith('/bed/')) return 2
  if (
    pathname.startsWith('/patient/') ||
    pathname.startsWith('/transport/') ||
    pathname.startsWith('/mobile-reception/')
  ) {
    return 0
  }
  if (pathname.startsWith('/medical-quality/')) return 3
  const idx = IA_PLATES.findIndex((plate) =>
    plate.links.some(([link]) => linkMatches(link, pathname, search)),
  )
  if (idx >= 0) return idx
  const byHome = IA_PLATES.findIndex((plate) => {
    const homePath = plate.home.split('?')[0]
    return pathname === homePath || pathname.startsWith(`${homePath}/`)
  })
  return byHome >= 0 ? byHome : -1
}

export function plateSubLinks(pathname: string, search: string): typeof IA_PLATES[0]['links'] {
  const idx = activePlateIndex(pathname, search)
  if (idx < 0) return []
  return IA_PLATES[idx]?.links ?? []
}
