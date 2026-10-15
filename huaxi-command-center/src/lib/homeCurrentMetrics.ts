function num(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v)
  }
  return undefined
}

function asRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  return payload as Record<string, unknown>
}

export type HomeCurrentMetrics = {
  erPatients?: number
  erBedsTotal?: number
  erBedsFree?: number
  icuPatients?: number
  icuBedsTotal?: number
  icuBedsFree?: number
}

/** 从 beds/overview、critical/beds 等接口拼「当前情况」指标 */
export function homeCurrentMetricsFromResults(
  bedsPayload: unknown,
  criticalBedsPayload: unknown,
  livePayload?: unknown,
): HomeCurrentMetrics {
  const beds = asRecord(bedsPayload)
  const critical = asRecord(criticalBedsPayload)
  const live = asRecord(livePayload)
  const icuSummary =
    critical?.summary && typeof critical.summary === 'object'
      ? (critical.summary as Record<string, unknown>)
      : critical

  const erPatients =
    num(beds ?? {}, ['erPatients', 'emergencyPatients', 'erPatientCount']) ??
    num(live ?? {}, ['activeCount', 'emergencyToday']) ??
    num(beds ?? {}, ['occupiedBeds', 'occupied'])

  const erBedsTotal = num(beds ?? {}, ['erBedsTotal', 'emergencyBedsTotal', 'totalBeds', 'total'])
  const erBedsFree = num(beds ?? {}, ['erBedsFree', 'emergencyBedsFree', 'freeBeds', 'free'])

  const icuPatients =
    num(icuSummary ?? {}, ['occupied', 'icuPatients', 'patientCount']) ??
    num(beds ?? {}, ['icuPatients', 'icuOccupied'])

  const icuBedsTotal = num(icuSummary ?? {}, ['total', 'icuBedsTotal', 'bedTotal'])
  const icuBedsFree =
    num(icuSummary ?? {}, ['available', 'free', 'icuBedsFree']) ??
    (icuBedsTotal != null && icuPatients != null ? Math.max(icuBedsTotal - icuPatients, 0) : undefined)

  return {
    erPatients,
    erBedsTotal,
    erBedsFree,
    icuPatients,
    icuBedsTotal,
    icuBedsFree,
  }
}
