import { PageScaffold } from '../components/PageScaffold'
import type { AppRouteMeta } from '../routes/meta'

export function createScaffoldPage(meta: AppRouteMeta) {
  function ScaffoldPage() {
    return <PageScaffold meta={meta} />
  }
  ScaffoldPage.displayName = meta.title
  return ScaffoldPage
}
