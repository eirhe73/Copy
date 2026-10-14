import { Building2, Bed, Stethoscope, PieChart, Users } from 'lucide-react'
import type { HomeRegion } from '../../context/HomeRegionContext'

type Props = {
  region: HomeRegion
  bedsOverview?: unknown
}

const REGION_LABELS: Record<HomeRegion, [string, string | number][]> = {
  dafang: [
    ['示范区院', '—'],
    ['住院病人数', '—'],
    ['医生护士数', '—'],
    ['剩余床位数', '—'],
    ['床位总数', '—'],
    ['床位使用率', '—'],
  ],
  weiyuan: [
    ['协作机构', '—'],
    ['住院病人数', '—'],
    ['医生护士数', '—'],
    ['剩余床位数', '—'],
    ['床位总数', '—'],
    ['床位使用率', '—'],
  ],
}

const ICONS = [Building2, Users, Stethoscope, Bed, Bed, PieChart]

function num(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number') return v
    if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v)
  }
  return undefined
}

export function CenterMetricsBar({ region, bedsOverview }: Props) {
  let rows = REGION_LABELS[region].map(([label, value]) => [label, value] as [string, string | number])
  if (bedsOverview && typeof bedsOverview === 'object') {
    const o = bedsOverview as Record<string, unknown>
    const total = num(o, ['totalBeds', 'total', 'bedTotal'])
    const free = num(o, ['freeBeds', 'available', 'remaining'])
    const used = num(o, ['usedBeds', 'occupiedBeds', 'occupied'])
    const hospitals = Array.isArray(o.hospitals) ? o.hospitals.length : undefined
    if (total != null) {
      const rate =
        used != null && total ? `${Math.round((used / total) * 100)}%` : typeof o.occupancyRate === 'string' ? o.occupancyRate : '—'
      rows = [
        [rows[0][0], hospitals ?? '—'],
        rows[1],
        rows[2],
        [rows[3][0], free ?? '—'],
        ['床位总数', total],
        ['床位使用率', rate],
      ]
    }
  }

  return (
    <div className="center-metrics">
      {rows.map(([label, value], i) => {
        const Icon = ICONS[i] ?? Building2
        return (
          <div key={label} className="metric">
            <Icon size={16} />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        )
      })}
    </div>
  )
}
