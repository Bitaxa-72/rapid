import './style.css'

const basePath = import.meta.env.BASE_URL
const manifestUrl = `${basePath}showcase/manifest.json`

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="shell">
    <section class="landing" aria-labelledby="landing-title">
      <div class="landing__content">
        <p class="eyebrow">Portfolio switchboard</p>
        <h1 id="landing-title">Витрина готовых фронтов под разные задачи бизнеса</h1>
        <p class="lead">
          Один проект показывает несколько типов сайтов и их стилевые варианты. Клиент выбирает формат,
          переключает дизайн и сразу смотрит рабочий вложенный сайт прямо на этой странице.
        </p>
        <div class="landing__actions">
          <button class="primary-action" type="button" data-open-widget>
            Выбрать сайт
          </button>
          <a class="secondary-action" href="#site-stage">Посмотреть структуру</a>
        </div>
      </div>

      <div class="visual" aria-hidden="true">
        <img src="${basePath}showcase/assets/portfolio-window.svg" alt="" />
      </div>
    </section>

    <section class="structure-section" aria-labelledby="structure-title">
      <div>
        <p class="eyebrow">Project hierarchy</p>
        <h2 id="structure-title">Верхний уровень управляет витриной, нижний хранит сайты как отдельные шаблоны.</h2>
      </div>
      <div class="structure-grid">
        <code>public/showcase/manifest.json</code>
        <code>public/showcase/sites/{тип}/{дизайн}/index.html</code>
        <code>components/{block}/section.html</code>
        <code>components/{block}/style.css</code>
        <code>components/{block}/script.js</code>
      </div>
    </section>

    <section class="site-stage" id="site-stage" aria-live="polite">
      <div class="empty-site" data-empty-site>
        <p class="eyebrow">Demo area</p>
        <h2>Выбери нужный тебе сайт</h2>
        <p>После выбора шаблон загрузится сюда, в текущую страницу, без iframe и отдельного окна.</p>
      </div>
      <div class="site-mount" data-site-mount></div>
    </section>
  </main>

  <aside class="switcher" data-switcher aria-labelledby="switcher-title">
    <button class="switcher__toggle" type="button" data-toggle-switcher aria-expanded="true">
      Витрина
    </button>
    <div class="switcher__body">
      <p class="eyebrow">Demo panel</p>
      <h2 id="switcher-title">Выбери нужный тебе сайт</h2>

      <label class="field">
        <span>Тип сайта</span>
        <select data-site-select>
          <option value="">Нейтральное положение</option>
        </select>
      </label>

      <label class="field" data-design-field hidden>
        <span>Дизайн сайта</span>
        <select data-design-select></select>
      </label>

      <div class="selection-card" data-selection-info>
        <strong>Пока ничего не выбрано</strong>
        <span>Выбери тип сайта, и шаблон откроется ниже как часть текущей страницы.</span>
      </div>

      <a class="open-current" data-open-current href="#" target="_blank" rel="noreferrer" hidden>
        Открыть шаблон отдельно
      </a>
    </div>
  </aside>
`

const siteSelect = app.querySelector('[data-site-select]')
const designSelect = app.querySelector(
  '[data-design-select]'
)
const designField = app.querySelector('[data-design-field]')
const selectionInfo = app.querySelector(
  '[data-selection-info]'
)
const siteMount = app.querySelector('[data-site-mount]')
const emptySite = app.querySelector('[data-empty-site]')
const openCurrent = app.querySelector('[data-open-current]')
const openWidgetButton = app.querySelector(
  '[data-open-widget]'
)
const switcher = app.querySelector('[data-switcher]')
const switcherToggle = app.querySelector(
  '[data-toggle-switcher]'
)

let manifest = null
let shadowRoot = null
let currentAbortController = null

const normalizePath = (path) =>
  `${basePath}${path}`.replace(/\/{2,}/g, '/')

const fetchText = async (url, signal) => {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`)
  }

  return response.text()
}

const prepareShadowCss = (css) =>
  css.replaceAll(':root', ':host')

const resetShadowRoot = () => {
  if (!shadowRoot) {
    shadowRoot = siteMount.attachShadow({ mode: 'open' })
  }

  shadowRoot.replaceChildren()
  return shadowRoot
}

const createAbsoluteUrl = (path, rootUrl) =>
  new URL(path, rootUrl)

const loadComponent = async ({
  shadow,
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

  const style = document.createElement('style')
  style.textContent = prepareShadowCss(css)
  shadow.append(style)
  mountPoint.innerHTML = html

  const scriptUrl = createAbsoluteUrl(
    'script.js',
    componentRoot
  )
  const module = await import(
    `${scriptUrl.href}?v=${Date.now()}`
  )

  if (typeof module.mount === 'function') {
    module.mount(mountPoint, { root: shadow })
  }
}

const loadTemplateSite = async (design) => {
  currentAbortController?.abort()
  currentAbortController = new AbortController()

  const signal = currentAbortController.signal
  const entryUrl = createAbsoluteUrl(
    normalizePath(design.entry),
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

  const root = resetShadowRoot()
  const baseStyle = document.createElement('style')
  baseStyle.textContent = `
    :host {
      display: block;
      width: 100%;
      min-height: 100%;
      background: transparent;
    }
  `
  root.append(baseStyle)

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

  stylesheetTexts.forEach((css) => {
    const style = document.createElement('style')
    style.textContent = prepareShadowCss(css)
    root.append(style)
  })

  root.append(siteShell)

  const componentMounts = [
    ...root.querySelectorAll('[data-component]')
  ]
  await Promise.all(
    componentMounts.map((mountPoint) =>
      loadComponent({
        shadow: root,
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
      const module = await import(
        `${scriptUrl.href}?v=${Date.now()}`
      )

      if (typeof module.mount === 'function') {
        module.mount(root)
      }
    })
  )
}

const renderSiteOptions = (sites) => {
  const options = sites
    .map(
      (site) =>
        `<option value="${site.id}">${site.label}</option>`
    )
    .join('')

  siteSelect.insertAdjacentHTML('beforeend', options)
}

const setNeutralState = () => {
  currentAbortController?.abort()
  designField.hidden = true
  designSelect.innerHTML = ''
  siteMount.innerHTML = ''
  shadowRoot?.replaceChildren()
  emptySite.hidden = false
  openCurrent.hidden = true
  openCurrent.href = '#'
  selectionInfo.innerHTML = `
    <strong>Пока ничего не выбрано</strong>
    <span>Выбери тип сайта, и шаблон откроется ниже как часть текущей страницы.</span>
  `
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

const showSelection = (site, design) => {
  selectionInfo.innerHTML = `
    <strong>${site.label}: ${design.label}</strong>
    <span>${design.description}</span>
  `
  openCurrent.href = normalizePath(design.entry)
  openCurrent.hidden = false
}

const loadSelectedSite = async (siteId, designId) => {
  const site = manifest.sites.find(
    (item) => item.id === siteId
  )

  if (!site) {
    setNeutralState()
    return
  }

  const design =
    site.designs.find((item) => item.id === designId) ??
    site.designs[0]

  if (!design) {
    setNeutralState()
    return
  }

  showSelection(site, design)
  emptySite.hidden = true
  siteMount.setAttribute('aria-busy', 'true')

  try {
    await loadTemplateSite(design)
    siteMount.removeAttribute('aria-busy')
    document.querySelector('#site-stage').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      return
    }

    siteMount.removeAttribute('aria-busy')
    emptySite.hidden = false
    emptySite.innerHTML = `
      <p class="eyebrow">Loading error</p>
      <h2>Не удалось открыть шаблон</h2>
      <p>${error.message}</p>
    `
  }
}

const handleSiteChange = () => {
  const site = manifest.sites.find(
    (item) => item.id === siteSelect.value
  )

  if (!site) {
    setNeutralState()
    return
  }

  renderDesignOptions(site)
  loadSelectedSite(site.id, site.designs[0]?.id)
}

const handleDesignChange = () => {
  loadSelectedSite(siteSelect.value, designSelect.value)
}

const init = async () => {
  const response = await fetch(manifestUrl)

  if (!response.ok) {
    throw new Error(
      `Manifest loading failed: ${response.status}`
    )
  }

  manifest = await response.json()
  renderSiteOptions(manifest.sites)
  setNeutralState()
}

openWidgetButton.addEventListener('click', () => {
  switcher.classList.remove('is-collapsed')
  switcherToggle.setAttribute('aria-expanded', 'true')
  siteSelect.focus({ preventScroll: true })
})

switcherToggle.addEventListener('click', () => {
  const isCollapsed =
    switcher.classList.toggle('is-collapsed')
  switcherToggle.setAttribute(
    'aria-expanded',
    String(!isCollapsed)
  )
})

siteSelect.addEventListener('change', handleSiteChange)
designSelect.addEventListener('change', handleDesignChange)

init().catch((error) => {
  selectionInfo.innerHTML = `
    <strong>Не удалось загрузить витрину</strong>
    <span>${error.message}</span>
  `
})
