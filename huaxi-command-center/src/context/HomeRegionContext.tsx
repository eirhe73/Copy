import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type HomeRegion = 'weiyuan' | 'dafang'

type Value = {
  region: HomeRegion
  setRegion: (r: HomeRegion) => void
  countyLabel: string
}

const HomeRegionContext = createContext<Value | null>(null)

export function HomeRegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<HomeRegion>('dafang')
  const value = useMemo(
    () => ({
      region,
      setRegion,
      countyLabel: region === 'dafang' ? '大方' : '威远',
    }),
    [region],
  )
  return <HomeRegionContext.Provider value={value}>{children}</HomeRegionContext.Provider>
}

export function useHomeRegion() {
  const ctx = useContext(HomeRegionContext)
  if (!ctx) {
    return {
      region: 'weiyuan' as HomeRegion,
      setRegion: () => {},
      countyLabel: '威远',
    }
  }
  return ctx
}
