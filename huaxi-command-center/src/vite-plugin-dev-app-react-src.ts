import type { Plugin } from 'vite'

/**
 * 本地 dev：app.html 仍走完整侧栏/enhance，但 React 换为 /src/main.tsx（含 MapScene 四卡面板）。
 * 生产 build 仍使用 manifest 里的 vendor bundle。
 */
export function devAppReactSrcPlugin(): Plugin {
  const vendorRe =
    /<script type="module" crossorigin src="\/assets\/vendor\/index-BA_IO3dC\.js[^"]*"><\/script>/

  return {
    name: 'dev-app-react-src',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename?.replace(/\\/g, '/').endsWith('/app.html')) return html
        if (!vendorRe.test(html)) return html
        return html.replace(
          vendorRe,
          '    <!-- dev: 源码 React（MapScene / 四卡面板）；npm run build 仍用 vendor -->\n' +
            '    <script type="module" src="/src/main.tsx"></script>',
        )
      },
    },
  }
}
