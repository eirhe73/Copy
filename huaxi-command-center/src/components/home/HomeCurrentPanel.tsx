import { BedDouble, HeartPulse, Users } from 'lucide-react'
import { DashboardPanel } from './DashboardPanel'

type Props = {
  erPatients?: number
  erBedsTotal?: number
  erBedsFree?: number
  icuPatients?: number
  icuBedsTotal?: number
  icuBedsFree?: number
}

function fmtCount(n: number | undefined) {
  return n != null && !Number.isNaN(n) ? n : '—'
}

function fmtBeds(total: number | undefined, free: number | undefined) {
  if (total == null && free == null) return '—'
  return `${fmtCount(total)} / 余 ${fmtCount(free)}`
}

export function HomeCurrentPanel({
  erPatients,
  erBedsTotal,
  erBedsFree,
  icuPatients,
  icuBedsTotal,
  icuBedsFree,
}: Props) {
  const items = [
    { label: '急诊病人', value: fmtCount(erPatients), icon: Users },
    { label: '急诊床位', value: fmtBeds(erBedsTotal, erBedsFree), icon: BedDouble },
    { label: '重症病人', value: fmtCount(icuPatients), icon: HeartPulse },
    { label: '重症床位', value: fmtBeds(icuBedsTotal, icuBedsFree), icon: BedDouble },
  ]

  return (
    <DashboardPanel title="当前情况" className="current-panel">
      <div className="current-metrics">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="metric">
            <Icon size={18} />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  )
}
