/** 3D 大屏与 2D GIS 共用配色；改此处或 URL `?theme=` 即可换肤 */

export type MapThemeId = 'mono' | 'cyber' | 'jade' | 'amber' | 'light'

export type MapTheme3D = {
  terrainTop: number
  terrainSide: number
  terrainEmissiveTop: number
  terrainEmissiveSide: number
  edgeGlow: number
  gridPrimary: number
  gridSecondary: number
  flowLine: number
  ambient: number
  keyLight: number
  rimLight: number
  markerByTier: [number, number, number]
  markerGlow: number
  pulse: number
  labelCss: string
  accentCss: string
}

export type MapThemeEcharts = {
  primary: string
  alert: string
  text: string
  textMuted: string
  geoFill: string
  geoHover: string
  geoBorder: string
  line: string
  panelBg: string
  panelBorder: string
}

export type MapTheme = {
  id: MapThemeId
  label: string
  swatch: string
  three: MapTheme3D
  echarts: MapThemeEcharts
}

export function hexToThree(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16)
}

const mono: MapTheme = {
  id: 'mono',
  label: '黑白',
  swatch: '#e5e5e5',
  three: {
    terrainTop: hexToThree('#525252'),
    terrainSide: hexToThree('#262626'),
    terrainEmissiveTop: hexToThree('#171717'),
    terrainEmissiveSide: hexToThree('#0a0a0a'),
    edgeGlow: hexToThree('#fafafa'),
    gridPrimary: hexToThree('#404040'),
    gridSecondary: hexToThree('#141414'),
    flowLine: hexToThree('#d4d4d4'),
    ambient: hexToThree('#737373'),
    keyLight: hexToThree('#f5f5f5'),
    rimLight: hexToThree('#e5e5e5'),
    markerByTier: [hexToThree('#ffffff'), hexToThree('#d4d4d4'), hexToThree('#a3a3a3')],
    markerGlow: hexToThree('#e5e5e5'),
    pulse: hexToThree('#ffffff'),
    labelCss: '#f5f5f5',
    accentCss: '#a3a3a3',
  },
  echarts: {
    primary: '#E5E5E5',
    alert: '#FAFAFA',
    text: '#525252',
    textMuted: '#737373',
    geoFill: '#404040',
    geoHover: 'rgba(255, 255, 255, 0.12)',
    geoBorder: '#d4d4d4',
    line: 'rgba(212, 212, 212, 0.35)',
    panelBg: 'rgba(23, 23, 23, 0.82)',
    panelBorder: 'rgba(163, 163, 163, 0.35)',
  },
}

const cyber: MapTheme = {
  id: 'cyber',
  label: '科技蓝',
  swatch: '#0ea5e9',
  three: {
    terrainTop: hexToThree('#1d4ed8'),
    terrainSide: hexToThree('#1e3a8a'),
    terrainEmissiveTop: hexToThree('#0c4a6e'),
    terrainEmissiveSide: hexToThree('#172554'),
    edgeGlow: hexToThree('#67e8f9'),
    gridPrimary: hexToThree('#1e3a5f'),
    gridSecondary: hexToThree('#0f172a'),
    flowLine: hexToThree('#67e8f9'),
    ambient: hexToThree('#4a7ab0'),
    keyLight: hexToThree('#9fe8ff'),
    rimLight: hexToThree('#22d3ee'),
    markerByTier: [hexToThree('#22d3ee'), hexToThree('#e879f9'), hexToThree('#f87171')],
    markerGlow: hexToThree('#22d3ee'),
    pulse: hexToThree('#ffffff'),
    labelCss: '#f1f5f9',
    accentCss: '#67e8f9',
  },
  echarts: {
    primary: '#38BDF8',
    alert: '#EF4444',
    text: '#475569',
    textMuted: '#64748B',
    geoFill: '#1e40af',
    geoHover: 'rgba(56, 189, 248, 0.22)',
    geoBorder: '#67e8f9',
    line: 'rgba(103, 232, 249, 0.45)',
    panelBg: 'rgba(15, 23, 42, 0.72)',
    panelBorder: 'rgba(56, 189, 248, 0.35)',
  },
}

const jade: MapTheme = {
  id: 'jade',
  label: '翡翠',
  swatch: '#10b981',
  three: {
    terrainTop: hexToThree('#047857'),
    terrainSide: hexToThree('#064e3b'),
    terrainEmissiveTop: hexToThree('#022c22'),
    terrainEmissiveSide: hexToThree('#14532d'),
    edgeGlow: hexToThree('#6ee7b7'),
    gridPrimary: hexToThree('#134e4a'),
    gridSecondary: hexToThree('#042f2e'),
    flowLine: hexToThree('#5eead4'),
    ambient: hexToThree('#3d6b5a'),
    keyLight: hexToThree('#a7f3d0'),
    rimLight: hexToThree('#34d399'),
    markerByTier: [hexToThree('#2dd4bf'), hexToThree('#a78bfa'), hexToThree('#fb7185')],
    markerGlow: hexToThree('#34d399'),
    pulse: hexToThree('#ecfdf5'),
    labelCss: '#ecfdf5',
    accentCss: '#6ee7b7',
  },
  echarts: {
    primary: '#34D399',
    alert: '#F87171',
    text: '#475569',
    textMuted: '#64748B',
    geoFill: '#065f46',
    geoHover: 'rgba(52, 211, 153, 0.2)',
    geoBorder: '#6ee7b7',
    line: 'rgba(94, 234, 212, 0.4)',
    panelBg: 'rgba(6, 46, 35, 0.75)',
    panelBorder: 'rgba(52, 211, 153, 0.35)',
  },
}

const amber: MapTheme = {
  id: 'amber',
  label: '琥珀',
  swatch: '#f59e0b',
  three: {
    terrainTop: hexToThree('#b45309'),
    terrainSide: hexToThree('#78350f'),
    terrainEmissiveTop: hexToThree('#451a03'),
    terrainEmissiveSide: hexToThree('#292524'),
    edgeGlow: hexToThree('#fcd34d'),
    gridPrimary: hexToThree('#44403c'),
    gridSecondary: hexToThree('#1c1917'),
    flowLine: hexToThree('#fbbf24'),
    ambient: hexToThree('#6b5344'),
    keyLight: hexToThree('#fde68a'),
    rimLight: hexToThree('#f59e0b'),
    markerByTier: [hexToThree('#fbbf24'), hexToThree('#c084fc'), hexToThree('#f87171')],
    markerGlow: hexToThree('#f59e0b'),
    pulse: hexToThree('#fffbeb'),
    labelCss: '#fef3c7',
    accentCss: '#fcd34d',
  },
  echarts: {
    primary: '#FBBF24',
    alert: '#EF4444',
    text: '#57534e',
    textMuted: '#78716c',
    geoFill: '#92400e',
    geoHover: 'rgba(251, 191, 36, 0.18)',
    geoBorder: '#fcd34d',
    line: 'rgba(251, 191, 36, 0.42)',
    panelBg: 'rgba(28, 25, 23, 0.78)',
    panelBorder: 'rgba(251, 191, 36, 0.35)',
  },
}

/** 首页指挥 3D 地图 · 浅蓝指挥 */
const lightThree: MapTheme3D = {
  terrainTop: hexToThree('#6eb5ea'),
  terrainSide: hexToThree('#1e4b7b'),
  terrainEmissiveTop: hexToThree('#1a4480'),
  terrainEmissiveSide: hexToThree('#0f2847'),
  edgeGlow: hexToThree('#38bdf8'),
  gridPrimary: hexToThree('#94a3b8'),
  gridSecondary: hexToThree('#e2e8f0'),
  flowLine: hexToThree('#38bdf8'),
  ambient: hexToThree('#64748b'),
  keyLight: hexToThree('#e0f2fe'),
  rimLight: hexToThree('#38bdf8'),
  markerByTier: [hexToThree('#1e4b7b'), hexToThree('#2563eb'), hexToThree('#38bdf8')],
  markerGlow: hexToThree('#38bdf8'),
  pulse: hexToThree('#f0f9ff'),
  labelCss: '#334155',
  accentCss: '#1e4b7b',
}

const light: MapTheme = {
  id: 'light',
  label: '浅色 GIS',
  swatch: '#38bdf8',
  three: lightThree,
  echarts: {
    primary: '#38BDF8',
    alert: '#EF4444',
    text: '#475569',
    textMuted: '#64748B',
    geoFill: '#F7FBFF',
    geoHover: 'rgba(56, 189, 248, 0.04)',
    geoBorder: '#CBD5E1',
    line: 'rgba(56, 189, 248, 0.22)',
    panelBg: 'rgba(255, 255, 255, 0.55)',
    panelBorder: '#E2E8F0',
  },
}

export const MAP_THEMES: Record<MapThemeId, MapTheme> = {
  mono,
  cyber,
  jade,
  amber,
  light,
}

export const MAP_THEME_LIST: MapTheme[] = [mono, cyber, jade, amber, light]

export function isMapThemeId(id: string | null | undefined): id is MapThemeId {
  return !!id && id in MAP_THEMES
}

export function resolveMapThemeId(fallback: MapThemeId = 'mono'): MapThemeId {
  const raw = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('theme')
  return isMapThemeId(raw) ? raw : fallback
}

export function getMapTheme(id: MapThemeId = resolveMapThemeId()): MapTheme {
  return MAP_THEMES[id]
}

export function setMapThemeInUrl(id: MapThemeId) {
  const url = new URL(location.href)
  url.searchParams.set('theme', id)
  history.replaceState(null, '', url.toString())
}
