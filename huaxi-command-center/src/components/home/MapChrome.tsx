/** 与线上一致的地图图例、工具条（样式见 map-presentation.css） */

export function MapLegend() {
  const tiers = [
    { cls: 'legend-0', label: '一级协作节点' },
    { cls: 'legend-1', label: '二级协作节点' },
    { cls: 'legend-2', label: '基层协作节点' },
  ]
  return (
    <div className="map-legend" aria-label="协作节点图例">
      {tiers.map((t) => (
        <button key={t.cls} type="button" className={t.cls}>
          <i /> {t.label}
        </button>
      ))}
    </div>
  )
}

function dispatchMapZoom(dir: 'in' | 'out') {
  window.dispatchEvent(new CustomEvent('hx-map-camera-zoom', { detail: { dir } }))
}

export function MapTools() {
  return (
    <div className="map-tools" aria-label="地图工具">
      <button type="button" className="icon-btn" title="放大" onClick={() => dispatchMapZoom('in')}>
        +
      </button>
      <button type="button" className="icon-btn" title="缩小" onClick={() => dispatchMapZoom('out')}>
        −
      </button>
      <span className="north" aria-hidden="true">
        N
      </span>
    </div>
  )
}
