/**
 * 侧栏：分组标题 + 子菜单常显，子项直接点击（无折叠）
 */
;(function () {
  const HOME = {
    id: 'home',
    title: '指挥中枢',
    links: [
      ['/', '县域指挥概览'],
      ['/map', '协作三维地图'],
    ],
  }

  const PLATES = [
    {
      id: 'dispatch',
      title: '智慧急救调度',
      links: [
        ['/dispatch', '实时出警'],
        ['/dispatch/list', '出警列表'],
        ['/ambulances', '救护车列表'],
        ['/patients', '急救事件'],
        ['/register', '患者登记'],
        ['/consultations', '远程会诊'],
        ['/consultations?tab=grassroots', '基层会诊'],
        ['/transfers?scope=grassroots', '医院转诊'],
        ['/critical?mode=grassroots-remote', '基层远程监护'],
      ],
    },
    {
      id: 'warning',
      title: '院内早期预警',
      links: [
        ['/warning', '预警总览'],
        ['/warning?view=departments', '科室监控'],
        ['/patients?focus=1', '重点关注'],
        ['/messages', '预警通知'],
        ['/quality', '运行统计'],
      ],
    },
    {
      id: 'critical',
      title: '县域智慧重症',
      links: [
        ['/critical', '重症监护'],
        ['/critical?view=wards', '床位全景'],
        ['/critical?mode=town', '乡镇监护'],
        ['/devices', '床旁设备'],
        ['/centers', '五大中心'],
        ['/organizations', '协作机构'],
      ],
    },
    {
      id: 'quality',
      title: '智能医疗质控',
      links: [
        ['/medical-quality', '质控整改看板'],
        ['/medical-quality/reports', '业务统计'],
      ],
    },
    {
      id: 'dr',
      title: '基层医声Dr.',
      links: [
        ['/dr?view=videos', '视频展示'],
        ['/dr?view=saved', '我的收藏'],
      ],
    },
  ]

  const GROUPS = [HOME, ...PLATES]

  function hashPath() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function hashQuery() {
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q)
  }

  function isHome() {
    const p = hashPath()
    if (p === '/map' || document.body.classList.contains('hx-page-map-only')) return true
    return p === '/' || p === ''
  }

  function isMapPage() {
    return hashPath() === '/map' || document.body.classList.contains('hx-page-map-only')
  }

  function skipShell() {
    const p = hashPath()
    return /^\/(phone|room|join)/.test(p) || !document.querySelector('.app-shell')
  }

  function hrefToHash(link) {
    return `#${link.startsWith('/') ? link : `/${link}`}`
  }

  function isGrassrootsConsult() {
    const q = hashQuery()
    return q.get('tab') === 'grassroots' || q.get('scope') === 'grassroots'
  }

  /** 顶栏标题：以当前 hash 为准，避免仍显示上一页「实时出警」 */
  function pageNavLabel() {
    const p = hashPath()
    if (p === '/consultations/pick') return '选择患者 · 发起远程会诊'
    if (p === '/consultations') return isGrassrootsConsult() ? '基层会诊' : '远程会诊'
    const labels = {
      '/dispatch': '实时出警',
      '/dispatch/list': '出警列表',
      '/ambulances': '救护车列表',
      '/patients': '急救事件',
      '/register': '患者登记',
      '/transfers': '医院转诊',
      '/critical': '重症监护',
      '/warning': '预警总览',
      '/map': '协作三维地图',
      '/': '县域指挥概览',
    }
    if (labels[p]) return labels[p]
    if (p.startsWith('/critical')) return '重症监护'
    if (p.startsWith('/warning')) return '预警总览'
    if (p.startsWith('/medical-quality')) return '质控整改看板'
    if (p.startsWith('/dr')) return '基层医声Dr.'
    if (p.startsWith('/room/') || p.startsWith('/join/')) return '远程会诊室'
    return null
  }

  function linkMatches(link) {
    const [pathPart, queryPart] = link.split('?')
    const wantPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`
    const cur = hashPath()
    const curPath = cur.startsWith('/') ? cur : `/${cur}`
    if (link === '/map') return isMapPage()
    if (link === '/') return (curPath === '/' || curPath === '') && !isMapPage()
    if (link === '/dispatch') return curPath === '/dispatch'
    if (link === '/dispatch/list') return curPath === '/dispatch/list'

    if (link === '/consultations?tab=grassroots' || (wantPath === '/consultations' && queryPart && queryPart.includes('tab=grassroots'))) {
      return (
        isGrassrootsConsult() &&
        (curPath === '/consultations' || curPath === '/consultations/pick')
      )
    }

    if (link === '/consultations' || wantPath === '/consultations') {
      if (isGrassrootsConsult()) return false
      return curPath === '/consultations' || curPath === '/consultations/pick'
    }

    if (wantPath !== curPath && wantPath.replace(/^\//, '') !== curPath.replace(/^\//, '')) return false

    if (!queryPart) {
      return !hashQuery().toString()
    }
    const want = new URLSearchParams(queryPart)
    for (const [k, v] of want.entries()) {
      if (hashQuery().get(k) !== v) return false
    }
    return true
  }

  function activeGroupId() {
    if (isHome() || hashPath() === '/map') return HOME.id
    const path = hashPath()
    if (path.startsWith('/medical-quality')) return 'quality'
    if (path.startsWith('/dr')) return 'dr'
    if (path.startsWith('/warning') || path === '/messages' || path === '/quality') return 'warning'
    if (path.startsWith('/critical') && hashQuery().get('mode') === 'grassroots-remote') return 'dispatch'
    if (
      path.startsWith('/critical') ||
      path.startsWith('/devices') ||
      path.startsWith('/centers') ||
      path.startsWith('/organizations')
    )
      return 'critical'
    if (
      path.startsWith('/dispatch') ||
      path.startsWith('/ambulances') ||
      path.startsWith('/patients') ||
      path.startsWith('/register') ||
      path.startsWith('/consultations') ||
      path.startsWith('/transfers') ||
      path.startsWith('/coordination')
    )
      return 'dispatch'
    return HOME.id
  }

  function syncHeaderTitle(menu) {
    const header = document.querySelector('.command-header')
    if (!header) return
    let el = header.querySelector('#hx-sidebar-page-title')
    if (!el) {
      el = document.createElement('p')
      el.id = 'hx-sidebar-page-title'
      el.className = 'hx-sidebar-page-title'
      const right = header.querySelector('.header-right')
      if (right) header.insertBefore(el, right)
      else header.appendChild(el)
    }
    if (isHome()) {
      el.textContent = hashPath() === '/map' ? '协作三维地图' : '县域指挥概览'
      return
    }
    const fromPath = pageNavLabel()
    if (fromPath) {
      el.textContent = fromPath
      return
    }
    const active = menu.querySelector('.hx-nav-l2__link.active')
    el.textContent = active?.dataset.navLabel || active?.textContent?.trim() || ''
  }

  function syncRouteBodyClasses() {
    const p = hashPath()
    const consult =
      p === '/consultations' || p === '/consultations/pick' || p.startsWith('/consultations/')
    document.body.dataset.hxRoute = consult ? 'consultations' : p.replace(/^\//, '') || 'home'
    document.body.classList.toggle('hx-route-consultations', consult)
    document.body.classList.toggle(
      'hx-route-grassroots-consult',
      consult && isGrassrootsConsult() && p !== '/consultations/pick',
    )
  }

  /** hash 与 React 重渲染后仍锁定会诊顶栏标题与侧栏高亮 */
  function pinConsultRouteChrome(menu) {
    syncRouteBodyClasses()
    const p = hashPath()
    if (!p.startsWith('/consultations')) return

    const label = pageNavLabel()
    if (label) syncHeaderTitle(menu)

    menu.querySelectorAll('.hx-nav-l2__link').forEach((a) => {
      a.classList.remove('active')
      a.removeAttribute('aria-current')
    })
    let key = '/consultations'
    if (p !== '/consultations/pick' && isGrassrootsConsult()) {
      key = '/consultations?tab=grassroots'
    }
    const hit = menu.querySelector(`.hx-nav-l2__link[data-nav-href="${key}"]`)
    if (hit) {
      hit.classList.add('active')
      hit.setAttribute('aria-current', 'page')
    }
  }

  function syncActive(menu) {
    const activeId = activeGroupId()
    menu.querySelectorAll('.hx-nav-group').forEach((wrap) => {
      wrap.classList.toggle('is-active-group', wrap.dataset.groupId === activeId)
    })
    menu.querySelectorAll('.hx-nav-l2__link').forEach((a) => {
      a.classList.toggle('active', linkMatches(a.dataset.navHref || ''))
    })
    pinConsultRouteChrome(menu)
    syncHeaderTitle(menu)
  }

  let headerWatch = null
  function watchHeaderTitle(menu) {
    if (headerWatch) return
    const header = document.querySelector('.command-header')
    if (!header || typeof MutationObserver === 'undefined') return
    headerWatch = new MutationObserver(() => {
      if (!hashPath().startsWith('/consultations')) return
      syncHeaderTitle(menu)
      pinConsultRouteChrome(menu)
    })
    headerWatch.observe(header, { childList: true, subtree: true, characterData: true })
  }

  function clonePlateIcon(shell, index) {
    const src = shell.querySelectorAll('header .main-nav[aria-label="五个业务模块"] a')
    const svg = src[index]?.querySelector('svg')
    return svg ? svg.cloneNode(true) : null
  }

  function fillIcons(menu, shell) {
    PLATES.forEach((plate, index) => {
      const slot = menu.querySelector(`.hx-nav-group[data-group-id="${plate.id}"] .hx-nav-l1__icon`)
      if (!slot || slot.dataset.filled === '1') return
      const icon = clonePlateIcon(shell, index)
      if (icon) {
        slot.textContent = ''
        slot.appendChild(icon)
        slot.dataset.filled = '1'
      }
    })
  }

  function buildMenu(menu) {
    if (menu.dataset.built === '9') return
    menu.dataset.built = '9'
    menu.innerHTML = ''

    GROUPS.forEach((group, index) => {
      const wrap = document.createElement('div')
      wrap.className = 'hx-nav-group'
      wrap.dataset.groupId = group.id

      const head = document.createElement('div')
      head.className = 'hx-nav-l1 hx-nav-l1--label'
      head.setAttribute('role', 'presentation')

      const iconSlot = document.createElement('span')
      iconSlot.className = 'hx-nav-l1__icon'
      if (group.id === HOME) {
        iconSlot.innerHTML =
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>'
      }

      const title = document.createElement('span')
      title.className = 'hx-nav-l1__title'
      title.textContent = group.title

      head.append(iconSlot, title)

      const sub = document.createElement('div')
      sub.className = 'hx-nav-l2'

      group.links.forEach(([link, label]) => {
        const a = document.createElement('a')
        a.className = 'hx-nav-l2__link'
        a.href = hrefToHash(link)
        a.textContent = label
        a.dataset.navLabel = label
        a.dataset.navHref = link
        sub.appendChild(a)
      })

      wrap.append(head, sub)
      menu.appendChild(wrap)
    })

  }

  function apply() {
    const shell = document.querySelector('.app-shell')
    if (!shell || skipShell()) {
      document.body.classList.remove('hx-sidebar-shell')
      shell?.classList.remove('hx-sidebar-ready')
      return
    }

    document.body.classList.add('hx-sidebar-shell')
    shell.classList.add('hx-sidebar-ready')
    try {
      localStorage.setItem('huaxi-integrated-nav', '1')
    } catch {
      /* ignore */
    }
    document.body.classList.toggle('hx-sidebar-home', isHome())
    document.body.classList.toggle('hx-sidebar-map-view', isMapPage())

    let aside = shell.querySelector(':scope > aside.hx-sidebar')
    if (!aside) {
      aside = document.createElement('aside')
      aside.className = 'hx-sidebar'
      aside.setAttribute('aria-label', '业务导航')
      aside.innerHTML =
        '<div class="hx-sidebar-brand">' +
        '<div class="hx-sidebar-brand__mark" aria-hidden="true"></div>' +
        '<div class="hx-sidebar-brand__text"><strong>华西指挥</strong><small>县域急危重症</small></div></div>' +
        '<nav class="hx-sidebar-menu" aria-label="模块菜单"></nav>'
      shell.insertBefore(aside, shell.firstChild)
    }

    const menu = aside.querySelector('.hx-sidebar-menu')
    if (!menu) return

    buildMenu(menu)
    fillIcons(menu, shell)
    syncActive(menu)
    watchHeaderTitle(menu)
  }

  window.hxEnhance(() => apply(), { wait: 200, afterNav: 100 })
  window.addEventListener('hashchange', () => apply())
  setInterval(() => {
    if (!document.body.classList.contains('hx-sidebar-shell')) return
    if (!hashPath().startsWith('/consultations')) return
    const menu = document.querySelector('.hx-sidebar-menu')
    if (menu) pinConsultRouteChrome(menu)
  }, 800)
  setTimeout(() => apply(), 600)
})()
