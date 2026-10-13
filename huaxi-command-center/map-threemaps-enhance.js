/**
 * 地图只留一句标题和图例，去掉飞线、角卡、扫描。
 */
;(function () {
  const ID = 'tm-hud'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/') || '/'
  }

  function mount(mainMap) {
    if (mainMap.querySelector('#' + ID)) return
    mainMap.classList.add('tm-map')
    const box = document.createElement('div')
    box.id = ID
    box.className = 'tm-hud tm-hud-quiet'
    box.innerHTML = `
      <header class="tm-title">
        <strong>县域急危重症</strong>
      </header>
      <footer class="tm-legend">
        <i class="hub"></i>县级
        <i class="town"></i>乡镇
        <i class="car"></i>出警
      </footer>
    `
    mainMap.appendChild(box)
  }

  function tick() {
    const home = path() === '/' || path() === ''
    const mainMap = document.querySelector('.dashboard-center .main-map')
    if (!home || !mainMap) {
      document.getElementById(ID)?.remove()
      return
    }
    mount(mainMap)
  }

  window.addEventListener('hashchange', () => setTimeout(tick, 80))
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick)
  else tick()
  const root = document.getElementById('root')
  if (root) new MutationObserver(() => tick()).observe(root, { childList: true, subtree: true })
})()
