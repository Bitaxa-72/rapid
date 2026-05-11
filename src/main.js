import './style.css'

const basePath = import.meta.env.BASE_URL
const manifestUrl = `${basePath}showcase/manifest.json`
const designStoragePrefix = 'rapid:design:'
const widgetPositionKey = 'rapid:switcher-position'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="page-root" data-page-root></div>

  <aside class="switcher" data-switcher aria-labelledby="switcher-title">
    <div class="switcher__handle" data-drag-handle>
      <span>Витрина</span>
      <button class="switcher__toggle" type="button" data-toggle-switcher aria-expanded="true">
        Свернуть
      </button>
    </div>
    <div class="switcher__body">
      <p class="eyebrow">Demo panel</p>
      <h2 id="switcher-title">Выбери нужный тебе сайт</h2>

      <label class="field">
        <span>Тип сайта</span>
        <select data-site-select>
          <option value="">Главная витрины</option>
        </select>
      </label>

      <label class="field" data-design-field hidden>
        <span>Дизайн сайта</span>
        <select data-design-select></select>
      </label>

      <div class="selection-card" data-selection-info>
        <strong>Пока открыт лендинг</strong>
        <span>Выбери тип сайта, и откроется отдельный route: /shop, /blog, /card или /corporate.</span>
      </div>
    </div>
  </aside>
`

const pageRoot = app.querySelector('[data-page-root]')
const switcher = app.querySelector('[data-switcher]')
const dragHandle = app.querySelector('[data-drag-handle]')
const switcherToggle = app.querySelector(
  '[data-toggle-switcher]'
)
const siteSelect = app.querySelector('[data-site-select]')
const designSelect = app.querySelector(
  '[data-design-select]'
)
const designField = app.querySelector('[data-design-field]')
const selectionInfo = app.querySelector(
  '[data-selection-info]'
)

let manifest = null
let currentAbortController = null
let isDragging = false
let dragOffset = { x: 0, y: 0 }

const siteStyles = new Set()

const normalizeBase = () =>
  basePath.endsWith('/') ? basePath : `${basePath}/`

const toRouteUrl = (route) => {
  const cleanRoute = route.replace(/^\/+/, '')
  return cleanRoute
    ? `${normalizeBase()}${cleanRoute}`
    : normalizeBase()
}

const toAssetUrl = (path) =>
  `${normalizeBase()}${path}`.replace(/\/{2,}/g, '/')

const getCurrentRoute = () => {
  const redirectedRoute = new URLSearchParams(
    window.location.search
  ).get('route')

  if (redirectedRoute) {
    const cleanUrl = toRouteUrl(redirectedRoute)
    window.history.replaceState({}, '', cleanUrl)
    return redirectedRoute
  }

  const base = normalizeBase()
  const pathname = window.location.pathname
  const route = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\/+/, '')

  return route ? `/${route.replace(/\/$/, '')}` : '/'
}

const fetchText = async (url, signal) => {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`)
  }

  return response.text()
}

const createAbsoluteUrl = (
  path,
  rootUrl = window.location.origin
) => new URL(path, rootUrl)

const clearSiteAssets = () => {
  siteStyles.forEach((node) => node.remove())
  siteStyles.clear()
  document.documentElement.removeAttribute('data-template')
}

const addSiteStyle = (css) => {
  const style = document.createElement('style')
  style.dataset.siteStyle = 'true'
  style.textContent = css
  document.head.append(style)
  siteStyles.add(style)
}

const getSiteByRoute = (route) => {
  const segment = route.split('/').filter(Boolean)[0]

  return manifest.sites.find(
    (site) => site.route === segment
  )
}

const getPageByRoute = (site, route) =>
  site.pages.find((page) => page.path === route) ??
  site.pages[0]

const getSavedDesign = (site) => {
  const savedId = window.localStorage.getItem(
    `${designStoragePrefix}${site.id}`
  )
  return (
    site.designs.find((design) => design.id === savedId) ??
    site.designs[0]
  )
}

const renderLanding = () => {
  clearSiteAssets()
  document.title = 'Rapid portfolio showcase'
  pageRoot.innerHTML = `
    <main class="shell">
      <section class="landing" aria-labelledby="landing-title">
        <div class="landing__content">
          <p class="eyebrow">Portfolio switchboard</p>
          <h1 id="landing-title">Витрина готовых фронтов под разные задачи бизнеса</h1>
          <p class="lead">
            Здесь собраны разные сайты внутри одного проекта Rapid. Клиент выбирает формат
            в плавающем виджете и переходит на отдельный раздел: /shop, /blog, /card или /corporate.
          </p>
          <div class="landing__actions">
            <button class="primary-action" type="button" data-focus-widget>
              Выбрать сайт
            </button>
            <a class="secondary-action" href="${toRouteUrl('/shop')}" data-route>Открыть магазин</a>
          </div>
        </div>

        <div class="visual" aria-hidden="true">
          <img src="${toAssetUrl('showcase/assets/portfolio-window.svg')}" alt="" />
        </div>
      </section>

      <section class="structure-section" aria-labelledby="structure-title">
        <div>
          <p class="eyebrow">Routes</p>
          <h2 id="structure-title">Каждый сайт открывается как самостоятельный раздел проекта.</h2>
        </div>
        <div class="structure-grid">
          <code>/rapid/shop + /rapid/shop/catalog</code>
          <code>/rapid/blog + /rapid/blog/articles</code>
          <code>/rapid/card + /rapid/card/services</code>
          <code>/rapid/corporate + /rapid/corporate/services</code>
        </div>
      </section>
    </main>
  `
  pageRoot
    .querySelector('[data-focus-widget]')
    .addEventListener('click', () => {
      switcher.classList.remove('is-collapsed')
      switcherToggle.setAttribute('aria-expanded', 'true')
      siteSelect.focus({ preventScroll: true })
    })
}

const buildSiteNav = (site, currentRoute) => `
  <nav class="site-route-nav" aria-label="Навигация сайта ${site.label}">
    <a href="${toRouteUrl('/')}" data-route>Rapid</a>
    ${site.pages
      .map(
        (page) => `
          <a
            href="${toRouteUrl(page.path)}"
            data-route
            ${page.path === currentRoute ? 'aria-current="page"' : ''}
          >
            ${page.label}
          </a>
        `
      )
      .join('')}
  </nav>
`

const renderRoutePageContent = (site, page) => {
  if (page.path === `/${site.route}`) {
    return ''
  }

  return `
    <section class="site-subpage">
      <p>${site.label}</p>
      <h2>${page.label}</h2>
      <span>
        Это отдельная вложенная страница раздела ${page.path}. Сейчас здесь символический контент,
        дальше можно раскладывать ее на такие же компоненты section.html, style.css и script.js.
      </span>
    </section>
  `
}

const loadComponent = async ({
  siteRoot,
  componentName,
  mountPoint,
  signal
}) => {
  const componentRoot = createAbsoluteUrl(
    `components/${componentName}/`,
    siteRoot
  )
  const [html, css] = await Promise.all([
    fetchText(
      createAbsoluteUrl('section.html', componentRoot),
      signal
    ),
    fetchText(
      createAbsoluteUrl('style.css', componentRoot),
      signal
    )
  ])

  addSiteStyle(css)
  mountPoint.innerHTML = html

  const scriptUrl = createAbsoluteUrl(
    'script.js',
    componentRoot
  )
  const module = await import(
    `${scriptUrl.href}?v=${Date.now()}`
  )

  if (typeof module.mount === 'function') {
    module.mount(mountPoint)
  }
}

const renderSite = async (route) => {
  currentAbortController?.abort()
  currentAbortController = new AbortController()

  const signal = currentAbortController.signal
  const site = getSiteByRoute(route)

  if (!site) {
    renderLanding()
    updateWidgetState('/')
    return
  }

  const design = getSavedDesign(site)
  const page = getPageByRoute(site, route)
  const entryUrl = createAbsoluteUrl(
    toAssetUrl(design.entry),
    window.location.origin
  )
  const siteRoot = createAbsoluteUrl('.', entryUrl)
  const html = await fetchText(entryUrl, signal)
  const documentFragment = new DOMParser().parseFromString(
    html,
    'text/html'
  )
  const siteShell =
    documentFragment.querySelector('.site-shell')

  if (!siteShell) {
    throw new Error('В шаблоне не найден .site-shell')
  }

  clearSiteAssets()
  document.title = `${site.label} | ${page.label}`
  pageRoot.innerHTML = `
    <main class="site-page" data-site-page>
      ${buildSiteNav(site, page.path)}
      <div class="site-document" data-site-document></div>
    </main>
  `

  const stylesheetLinks = [
    ...documentFragment.querySelectorAll(
      'link[rel="stylesheet"]'
    )
  ]

  const stylesheetTexts = await Promise.all(
    stylesheetLinks.map((link) =>
      fetchText(
        createAbsoluteUrl(
          link.getAttribute('href'),
          siteRoot
        ),
        signal
      )
    )
  )

  stylesheetTexts.forEach(addSiteStyle)

  const documentNode = pageRoot.querySelector(
    '[data-site-document]'
  )
  documentNode.append(siteShell)
  documentNode.insertAdjacentHTML(
    'beforeend',
    renderRoutePageContent(site, page)
  )

  const componentMounts = [
    ...documentNode.querySelectorAll('[data-component]')
  ]
  await Promise.all(
    componentMounts.map((mountPoint) =>
      loadComponent({
        siteRoot,
        componentName: mountPoint.dataset.component,
        mountPoint,
        signal
      })
    )
  )

  const siteScripts = [
    ...documentFragment.querySelectorAll(
      'script[type="module"][src]'
    )
  ].filter(
    (script) =>
      !script
        .getAttribute('src')
        .includes('component-loader.js')
  )

  await Promise.all(
    siteScripts.map(async (script) => {
      const scriptUrl = createAbsoluteUrl(
        script.getAttribute('src'),
        siteRoot
      )
      await import(`${scriptUrl.href}?v=${Date.now()}`)
    })
  )

  updateWidgetState(route)
  window.scrollTo({ top: 0 })
}

const navigateTo = (route) => {
  window.history.pushState({}, '', toRouteUrl(route))
  renderCurrentRoute()
}

const renderCurrentRoute = () => {
  const route = getCurrentRoute()

  if (route === '/') {
    renderLanding()
    updateWidgetState(route)
    return
  }

  renderSite(route).catch((error) => {
    pageRoot.innerHTML = `
      <main class="route-error">
        <p class="eyebrow">Route error</p>
        <h1>Не удалось открыть страницу</h1>
        <p>${error.message}</p>
        <a href="${toRouteUrl('/')}" data-route>Вернуться на главную</a>
      </main>
    `
  })
}

const renderSiteOptions = () => {
  siteSelect.insertAdjacentHTML(
    'beforeend',
    manifest.sites
      .map(
        (site) =>
          `<option value="${site.id}">${site.label}</option>`
      )
      .join('')
  )
}

const renderDesignOptions = (site) => {
  designSelect.innerHTML = site.designs
    .map(
      (design) =>
        `<option value="${design.id}">${design.label}</option>`
    )
    .join('')
  designField.hidden = site.designs.length <= 1
}

const updateWidgetState = (route) => {
  const site = route === '/' ? null : getSiteByRoute(route)

  if (!site) {
    siteSelect.value = ''
    designSelect.innerHTML = ''
    designField.hidden = true
    selectionInfo.innerHTML = `
      <strong>Открыт лендинг</strong>
      <span>Выбери сайт, чтобы перейти на отдельный раздел проекта.</span>
    `
    return
  }

  const design = getSavedDesign(site)
  siteSelect.value = site.id
  renderDesignOptions(site)
  designSelect.value = design.id
  selectionInfo.innerHTML = `
    <strong>${site.label}: ${design.label}</strong>
    <span>${design.description}</span>
  `
}

const clampWidgetPosition = (x, y) => {
  const rect = switcher.getBoundingClientRect()
  const maxX = window.innerWidth - rect.width - 10
  const maxY = window.innerHeight - rect.height - 10

  return {
    x: Math.max(10, Math.min(x, maxX)),
    y: Math.max(10, Math.min(y, maxY))
  }
}

const saveWidgetPosition = () => {
  const rect = switcher.getBoundingClientRect()
  window.localStorage.setItem(
    widgetPositionKey,
    JSON.stringify({ x: rect.left, y: rect.top })
  )
}

const applyWidgetPosition = () => {
  const stored = window.localStorage.getItem(
    widgetPositionKey
  )

  if (!stored) {
    return
  }

  let position

  try {
    position = JSON.parse(stored)
  } catch {
    window.localStorage.removeItem(widgetPositionKey)
    return
  }

  const clamped = clampWidgetPosition(
    position.x,
    position.y
  )
  switcher.style.left = `${clamped.x}px`
  switcher.style.top = `${clamped.y}px`
  switcher.style.right = 'auto'
}

const initDrag = () => {
  dragHandle.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) {
      return
    }

    const rect = switcher.getBoundingClientRect()
    isDragging = true
    dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    dragHandle.setPointerCapture(event.pointerId)
  })

  dragHandle.addEventListener('pointermove', (event) => {
    if (!isDragging) {
      return
    }

    const position = clampWidgetPosition(
      event.clientX - dragOffset.x,
      event.clientY - dragOffset.y
    )

    switcher.style.left = `${position.x}px`
    switcher.style.top = `${position.y}px`
    switcher.style.right = 'auto'
  })

  dragHandle.addEventListener('pointerup', (event) => {
    if (!isDragging) {
      return
    }

    isDragging = false
    dragHandle.releasePointerCapture(event.pointerId)
    saveWidgetPosition()
  })
}

siteSelect.addEventListener('change', () => {
  const site = manifest.sites.find(
    (item) => item.id === siteSelect.value
  )

  if (!site) {
    navigateTo('/')
    return
  }

  navigateTo(`/${site.route}`)
})

designSelect.addEventListener('change', () => {
  const site = manifest.sites.find(
    (item) => item.id === siteSelect.value
  )

  if (!site) {
    return
  }

  window.localStorage.setItem(
    `${designStoragePrefix}${site.id}`,
    designSelect.value
  )
  renderCurrentRoute()
})

switcherToggle.addEventListener('click', () => {
  const isCollapsed =
    switcher.classList.toggle('is-collapsed')
  switcherToggle.textContent = isCollapsed
    ? 'Открыть'
    : 'Свернуть'
  switcherToggle.setAttribute(
    'aria-expanded',
    String(!isCollapsed)
  )
  saveWidgetPosition()
})

document.addEventListener('click', (event) => {
  const routeLink = event.target.closest('[data-route]')

  if (!routeLink) {
    return
  }

  event.preventDefault()
  navigateTo(
    new URL(routeLink.href).pathname.replace(
      normalizeBase(),
      '/'
    )
  )
})

window.addEventListener('popstate', renderCurrentRoute)
window.addEventListener('resize', applyWidgetPosition)

const init = async () => {
  const response = await fetch(manifestUrl)

  if (!response.ok) {
    throw new Error(
      `Manifest loading failed: ${response.status}`
    )
  }

  manifest = await response.json()
  renderSiteOptions()
  initDrag()
  renderCurrentRoute()
  requestAnimationFrame(applyWidgetPosition)
}

init().catch((error) => {
  pageRoot.innerHTML = `
    <main class="route-error">
      <p class="eyebrow">Loading error</p>
      <h1>Не удалось загрузить витрину</h1>
      <p>${error.message}</p>
    </main>
  `
})
