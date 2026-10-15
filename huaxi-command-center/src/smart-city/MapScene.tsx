import { memo, useEffect, useMemo, useRef } from 'react'
import type { CollabNodeDetail } from '../lib/campusMapInfoPanel'
import type { MapThemeId } from '../mapTheme'
import { mountMapScene } from './mountMapScene'

type CollabLink = { from: string; to: string }

export type MapSceneProps = {
  themeId: MapThemeId
  region?: 'weiyuan' | 'dafang'
  /** 指挥首页：机构名 + 十字锚点标签（与线上一致） */
  variant?: 'default' | 'command'
  layout?: 'dashboard' | 'fullscreen'
  useCampusGlb?: boolean
  collabPack?: { nodes: CollabNodeDetail[]; links?: CollabLink[] }
}

function MapSceneView({
  themeId,
  region = 'weiyuan',
  variant = 'default',
  layout = 'dashboard',
  useCampusGlb = false,
  collabPack,
}: MapSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const collabSig = useMemo(
    () =>
      collabPack?.nodes?.length ?
        collabPack.nodes
          .map((n) => `${n.id}|${n.er ?? ''}|${n.bedsFree ?? ''}|${n.tight ?? ''}`)
          .join(';')
      : '',
    [collabPack],
  )

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    return mountMapScene(mount, {
      themeId,
      region,
      variant,
      layout,
      useCampusGlb,
      collabPack: collabPack?.nodes?.length ? collabPack : undefined,
    })
  }, [themeId, region, variant, layout, useCampusGlb, collabSig, collabPack])

  useEffect(() => {
    const bump = () => window.dispatchEvent(new Event('resize'))
    window.addEventListener('hx-glb-map-layout', bump)
    window.addEventListener('hx-map-page', bump)
    return () => {
      window.removeEventListener('hx-glb-map-layout', bump)
      window.removeEventListener('hx-map-page', bump)
    }
  }, [])

  const commandCls =
    variant === 'command' ?
      `command-map-canvas map-stage${useCampusGlb ? '' : ' hx-map-diamond-nodes'}`
    : 'sc-map-canvas'

  return (
    <div className={commandCls} ref={mountRef} aria-label="3D 态势地图" />
  )
}

/** 全屏只改 body class。此组件若跟着重渲染，React 会拆掉 Three 画布并导致整页崩溃。 */
export const MapScene = memo(MapSceneView)
