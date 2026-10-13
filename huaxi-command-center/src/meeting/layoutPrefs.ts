export type PanelPrefs = {
  leftPanel: boolean
  rightPanel: boolean
  bottomBar: boolean
  dock: 'left' | 'right'
}

const KEY = 'huaxi-meeting-layout-v1'

export function loadLayoutPrefs(): PanelPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaultPrefs()
}

export function saveLayoutPrefs(prefs: PanelPrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

export function defaultPrefs(): PanelPrefs {
  return { leftPanel: true, rightPanel: true, bottomBar: true, dock: 'left' }
}
