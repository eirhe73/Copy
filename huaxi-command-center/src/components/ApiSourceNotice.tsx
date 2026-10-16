/** src-shell / dev app.html 统一说明：数据来自 Laravel，非 legacy scenario */
export function ApiSourceNotice({ compact }: { compact?: boolean }) {
  const devSrc = import.meta.env.DEV
  if (compact) {
    return (
      <p className="api-muted" style={{ margin: '0 0 8px' }}>
        数据来自 <strong>/backend-api/v1</strong>，非 index.html 演示 scenario。
      </p>
    )
  }
  return (
    <p className="api-muted api-source-notice" style={{ margin: '8px 12px 0', gridColumn: '1 / -1' }}>
      {devSrc ?
        <>
          本地 <strong>dev</strong> 已启用源码 React 地图（点菱形节点 → 四卡详情；左侧「协作节点」竖条可展开列表）。
        </>
      : <>
          本入口为源码壳：县域地图与四卡节点面板见 <a href="/src-shell.html">src-shell.html</a>。
        </>
      }{' '}
      打包验收 demo 用 <a href="/app.html">app.html</a>（vendor 包）。旧 scenario 演示{' '}
      <a href="/">index.html</a>；若仍见旧演示数，请{' '}
      <a href="/?reset=1">/?reset=1</a> 后强刷。
    </p>
  )
}
