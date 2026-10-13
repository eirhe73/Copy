import { getMapTheme, resolveMapThemeId, type MapThemeEcharts } from '../mapTheme'

function themeColors(): MapThemeEcharts {
  return getMapTheme(resolveMapThemeId('light')).echarts
}

/** GIS 页默认 light；URL `?theme=cyber|jade|amber` 同步深色大屏配色 */
export const COLORS = new Proxy({} as MapThemeEcharts, {
  get(_t, prop: keyof MapThemeEcharts) {
    return themeColors()[prop]
  },
})

export const TIER_LABEL = ['一级', '二级', '基层'] as const

/** 一级 3 / 二级 2 / 基层 1 */
export const TIER_RING = [3, 2, 1] as const

export function ringSize(er: number) {
  return Math.min(52, Math.max(12, 8 + er * 3.5))
}

export function lineWidth(flow: number) {
  return Math.min(4, Math.max(1, 0.6 + flow * 0.35))
}
