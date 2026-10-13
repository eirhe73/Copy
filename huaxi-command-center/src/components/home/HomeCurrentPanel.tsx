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

export function HomeCurrentPanel({
  erPatients = 0,
  erBedsTotal = 0,
  erBedsFree = 0,
  icuPatients = 0,
  icuBedsTotal = 0,
  icuBedsFree = 0,
}: Props) {
  const items = [
    { label: '急诊病人', value: erPatients, icon: Users },
    { label: '急诊床位', value: `${erBedsTotal} / 余 ${erBedsFree}`, icon: BedDouble },
    { label: '重症病人', value: icuPatients, icon: HeartPulse },
    { label: '重症床位', value: `${icuBedsTotal} / 余 ${icuBedsFree}`, icon: BedDouble },
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
