import { useEffect, useRef } from 'react'
import type { MapThemeId } from '../mapTheme'
import { mountMapScene } from './mountMapScene'

export type MapSceneProps = {
  themeId: MapThemeId
  region?: 'weiyuan' | 'dafang'
  /** 指挥首页：机构名 + 十字锚点标签（与线上一致） */
  variant?: 'default' | 'command'
}

export function MapScene({ themeId, region = 'weiyuan', variant = 'default' }: MapSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    return mountMapScene(mount, { themeId, region, variant })
  }, [themeId, region, variant])

  return (
    <div
      className={variant === 'command' ? 'command-map-canvas map-stage' : 'sc-map-canvas'}
      ref={mountRef}
      aria-label="3D 态势地图"
    />
  )
}
