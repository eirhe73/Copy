import { Building2, Bed, Stethoscope, PieChart, Users } from 'lucide-react'
import type { HomeRegion } from '../../context/HomeRegionContext'

type Props = {
  region: HomeRegion
  bedsOverview?: unknown
}

const FALLBACK: Record<HomeRegion, [string, string | number][]> = {
  dafang: [
    ['示范区院', 15],
    ['住院病人数', 828],
    ['医生护士数', 1195],
    ['剩余床位数', 60],
    ['床位总数', 888],
    ['床位使用率', '93%'],
  ],
  weiyuan: [
    ['协作机构', 12],
    ['住院病人数', 426],
    ['医生护士数', 680],
    ['剩余床位数', 38],
    ['床位总数', 520],
    ['床位使用率', '88%'],
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
  let rows = FALLBACK[region]
  if (bedsOverview && typeof bedsOverview === 'object') {
    const o = bedsOverview as Record<string, unknown>
    const total = num(o, ['totalBeds', 'total', 'bedTotal'])
    const free = num(o, ['freeBeds', 'available', 'remaining'])
    const used = num(o, ['usedBeds', 'occupied'])
    if (total != null) {
      const rate = used != null && total ? `${Math.round((used / total) * 100)}%` : rows[5][1]
      rows = [
        rows[0],
        rows[1],
        rows[2],
        [rows[3][0], free ?? rows[3][1]],
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
