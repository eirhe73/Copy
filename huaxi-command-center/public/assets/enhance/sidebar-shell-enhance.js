/**
 * 渚ф爮锛氬垎缁勬爣棰?+ 瀛愯彍鍗曞父鏄撅紝瀛愰」鐩存帴鐐瑰嚮锛堟棤鎶樺彔锛? */
;(function () {
  const HOME = {
    id: 'home',
    title: '鎸囨尌涓灑',
    links: [
      ['/', '鍘垮煙鎸囨尌姒傝'],
      ['/map', '鍗忎綔涓夌淮鍦板浘'],
    ],
  }

  const PLATES = [
    {
      id: 'dispatch',
      title: '鏅烘収鎬ユ晳璋冨害',
      links: [
        ['/dispatch', '瀹炴椂鍑鸿'],
        ['/dispatch/list', '鍑鸿鍒楄〃'],
        ['/ambulances', '鏁戞姢杞﹀垪琛?],
        ['/patients', '鎬ユ晳浜嬩欢'],
        ['/register', '鎮ｈ€呯櫥璁?],
        ['/consultations', '杩滅▼浼氳瘖'],
        ['/consultations?tab=grassroots', '鍩哄眰浼氳瘖'],
        ['/transfers?scope=grassroots', '鍖婚櫌杞瘖'],
        ['/critical?mode=grassroots-remote', '鍩哄眰杩滅▼鐩戞姢'],
      ],
    },
    {
      id: 'warning',
      title: '闄㈠唴鏃╂湡棰勮',
      links: [
        ['/warning', '棰勮鎬昏'],
        ['/warning?view=departments', '绉戝鐩戞帶'],
        ['/patients?focus=1', '閲嶇偣鍏虫敞'],
        ['/messages', '棰勮閫氱煡'],
        ['/quality', '杩愯缁熻'],
      ],
    },
    {
      id: 'critical',
      title: '鍘垮煙鏅烘収閲嶇棁',
      links: [
        ['/critical', '閲嶇棁鐩戞姢'],
        ['/critical?view=wards', '搴婁綅鍏ㄦ櫙'],
        ['/critical?mode=town', '涔￠晣鐩戞姢'],
        ['/devices', '搴婃梺璁惧'],
        ['/centers', '浜斿ぇ涓績'],
        ['/organizations', '鍗忎綔鏈烘瀯'],
      ],
    },
    {
      id: 'quality',
      title: '鏅鸿兘鍖荤枟璐ㄦ帶',
      links: [
        ['/medical-quality', '璐ㄦ帶鏁存敼鐪嬫澘'],
        ['/medical-quality/reports', '涓氬姟缁熻'],
      ],
    },
    {
      id: 'dr',
      title: '鍩哄眰鍖诲０Dr.',
      links: [
        ['/dr?view=videos', '瑙嗛灞曠ず'],
        ['/dr?view=saved', '鎴戠殑鏀惰棌'],
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
    if (document.body.classList.contains('hx-page-map-only')) return true
    const p = hashPath()
    return p === '/' || p === '' || p === '/map'
  }

  function isMapPage() {
    return document.body.classList.contains('hx-page-map-only')
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

  /** 椤舵爮鏍囬锛氫互褰撳墠 hash 涓哄噯锛岄伩鍏嶄粛鏄剧ず涓婁竴椤点€屽疄鏃跺嚭璀︺€?*/
  function pageNavLabel() {
    const p = hashPath()
    if (p === '/consultations/pick') return '閫夋嫨鎮ｈ€?路 鍙戣捣杩滅▼浼氳瘖'
    if (p === '/consultations') return isGrassrootsConsult() ? '鍩哄眰浼氳瘖' : '杩滅▼浼氳瘖'
    const labels = {
      '/dispatch': '瀹炴椂鍑鸿',
      '/dispatch/list': '鍑鸿鍒楄〃',
      '/ambulances': '鏁戞姢杞﹀垪琛?,
      '/patients': '鎬ユ晳浜嬩欢',
      '/register': '鎮ｈ€呯櫥璁?,
      '/transfers': '鍖婚櫌杞瘖',
      '/critical': '閲嶇棁鐩戞姢',
      '/warning': '棰勮鎬昏',
      '/map': '鍗忎綔涓夌淮鍦板浘',
      '/': '鍘垮煙鎸囨尌姒傝',
    }
    if (labels[p]) return labels[p]
    if (p.startsWith('/critical')) return '閲嶇棁鐩戞姢'
    if (p.startsWith('/warning')) return '棰勮鎬昏'
    if (p.startsWith('/medical-quality')) return '璐ㄦ帶鏁存敼鐪嬫澘'
    if (p.startsWith('/dr')) return '鍩哄眰鍖诲０Dr.'
    if (p.startsWith('/room/') || p.startsWith('/join/')) return '杩滅▼浼氳瘖瀹?
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
    if (isHome()) return HOME.id
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
    let next = ''
    if (isHome()) {
      next = isMapPage() ? '鍗忎綔涓夌淮鍦板浘' : '鍘垮煙鎸囨尌姒傝'
    } else {
      const fromPath = pageNavLabel()
      if (fromPath) next = fromPath
      else {
        const active = menu.querySelector('.hx-nav-l2__link.active')
        next = active?.dataset.navLabel || active?.textContent?.trim() || ''
      }
    }
    if (el.textContent !== next) el.textContent = next
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

  /** hash 涓?React 閲嶆覆鏌撳悗浠嶉攣瀹氫細璇婇《鏍忔爣棰樹笌渚ф爮楂樹寒 */
  function pinConsultRouteChrome(menu) {
    syncRouteBodyClasses()
    const p = hashPath()
    if (!p.startsWith('/consultations')) return

    let key = '/consultations'
    if (p !== '/consultations/pick' && isGrassrootsConsult()) {
      key = '/consultations?tab=grassroots'
    }
    menu.querySelectorAll('.hx-nav-l2__link').forEach((a) => {
      const on = a.dataset.navHref === key
      a.classList.toggle('active', on)
      if (on) a.setAttribute('aria-current', 'page')
      else a.removeAttribute('aria-current')
    })
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

  function clonePlateIcon(shell, index) {
    const src = shell.querySelectorAll('header .main-nav[aria-label="浜斾釜涓氬姟妯″潡"] a')
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

  function navigateSidebarHash(href) {
    let target = href || ''
    if (window.hxConsultEpisodeNav?.normalizeHash) {
      target = window.hxConsultEpisodeNav.normalizeHash(target) || target
    } else if (target.indexOf('/#/') === 0) {
      target = target.slice(1)
    }
    if (!target.startsWith('#')) return
    if (location.hash !== target) location.hash = target
    else window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  function bindSidebarNav(menu) {
    if (menu.dataset.navBound === '1') return
    menu.dataset.navBound = '1'
    menu.addEventListener(
      'click',
      (e) => {
        const a = e.target instanceof Element ? e.target.closest('a.hx-nav-l2__link') : null
        if (!a || !menu.contains(a)) return
        const href = a.getAttribute('href') || ''
        if (!href.startsWith('#') && href.indexOf('/#/') !== 0) return
        e.preventDefault()
        e.stopImmediatePropagation()
        navigateSidebarHash(href)
      },
      true,
    )
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
      aside.setAttribute('aria-label', '涓氬姟瀵艰埅')
      aside.innerHTML =
        '<div class="hx-sidebar-brand">' +
        '<div class="hx-sidebar-brand__mark" aria-hidden="true"></div>' +
        '<div class="hx-sidebar-brand__text"><strong>鍗庤タ鎸囨尌</strong><small>鍘垮煙鎬ュ嵄閲嶇棁</small></div></div>' +
        '<nav class="hx-sidebar-menu" aria-label="妯″潡鑿滃崟"></nav>'
      shell.insertBefore(aside, shell.firstChild)
    }

    const menu = aside.querySelector('.hx-sidebar-menu')
    if (!menu) return

    buildMenu(menu)
    bindSidebarNav(menu)
    fillIcons(menu, shell)
    syncActive(menu)
  }

  window.hxEnhance(() => apply(), { wait: 200, afterNav: 100 })
  window.addEventListener('hashchange', () => apply())
  window.addEventListener('hx-map-page', () => apply())
  setTimeout(() => apply(), 600)
})()
