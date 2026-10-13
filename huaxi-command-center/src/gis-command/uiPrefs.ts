export type GisUiPrefs = {
  leftPanel: boolean
  legend: boolean
  erCard: boolean
}

const KEY = 'huaxi-gis-ui-v1'

export function loadGisUiPrefs(): GisUiPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaults()
}

export function saveGisUiPrefs(p: GisUiPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

function defaults(): GisUiPrefs {
  return { leftPanel: true, legend: true, erCard: true }
}
