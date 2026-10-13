import fs from 'fs'
const css = fs.readFileSync('public/assets/index-BRuArrdm.css', 'utf8')
for (const cls of [
  'home-header',
  'compact-header',
  'header-rail',
  'panel-title',
  'event-feed',
  'center-metrics',
  'main-map',
  'map-kpi',
  'segmented',
  'detail-trail',
  'login-page',
  'meeting',
]) {
  const re = new RegExp(`\\.${cls.replace(/-/g, '\\-')}[^{]*\\{[^}]{0,500}`)
  const m = css.match(re)
  console.log('\n===', cls, '===\n', m ? m[0] : 'NOT FOUND')
}
