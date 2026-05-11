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
          переключает дизайн и сразу смотрит рабочий вложенный сайт в предпросмотре.
        </p>
        <div class="landing__actions">
          <button class="primary-action" type="button" data-open-panel>
            Открыть выбор сайтов
          </button>
          <a class="secondary-action" href="#preview-panel">Посмотреть структуру</a>
        </div>
      </div>

      <div class="visual" aria-hidden="true">
        <img src="${basePath}showcase/assets/portfolio-window.svg" alt="" />
      </div>
    </section>

    <section class="workspace" id="preview-panel" aria-labelledby="workspace-title">
      <aside class="control-panel">
        <p class="eyebrow">Demo panel</p>
        <h2 id="workspace-title">Выбери нужный тебе сайт</h2>

        <label class="field">
          <span>Тип сайта</span>
          <select data-site-select>
            <option value="">Нейтральный режим</option>
          </select>
        </label>

        <label class="field field--design" data-design-field hidden>
          <span>Дизайн сайта</span>
          <select data-design-select></select>
        </label>

        <div class="selection-card" data-selection-info>
          <strong>Пока ничего не выбрано</strong>
          <span>После выбора сюда загрузится вложенный сайт из файловой структуры портфолио.</span>
        </div>

        <div class="structure">
          <span class="structure__title">Иерархия проекта</span>
          <code>public/showcase/sites/{тип}/{дизайн}/index.html</code>
          <code>components/{block}/section.html</code>
          <code>components/{block}/style.css</code>
          <code>components/{block}/script.js</code>
        </div>
      </aside>

      <section class="preview-area" aria-label="Предпросмотр выбранного сайта">
        <div class="browser-bar">
          <div class="browser-dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <span data-preview-path>/showcase/waiting</span>
          <a data-open-current href="#" target="_blank" rel="noreferrer" hidden>Открыть отдельно</a>
        </div>
        <div class="empty-preview" data-empty-preview>
          <h3>Вложенный сайт появится здесь</h3>
          <p>Сначала выбери тип сайта: визитка, магазин, блог или корпоративный сайт.</p>
        </div>
        <iframe data-preview-frame title="Предпросмотр сайта" hidden></iframe>
      </section>
    </section>
  </main>
`

const siteSelect = app.querySelector('[data-site-select]')
const designSelect = app.querySelector(
  '[data-design-select]'
)
const designField = app.querySelector('[data-design-field]')
const selectionInfo = app.querySelector(
  '[data-selection-info]'
)
const previewPath = app.querySelector('[data-preview-path]')
const previewFrame = app.querySelector(
  '[data-preview-frame]'
)
const emptyPreview = app.querySelector(
  '[data-empty-preview]'
)
const openCurrent = app.querySelector('[data-open-current]')
const openPanelButton = app.querySelector(
  '[data-open-panel]'
)
const panel = app.querySelector('#preview-panel')

let manifest = null

const normalizePath = (path) =>
  `${basePath}${path}`.replace(/\/{2,}/g, '/')

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
  designField.hidden = true
  designSelect.innerHTML = ''
  selectionInfo.innerHTML = `
    <strong>Пока ничего не выбрано</strong>
    <span>После выбора сюда загрузится вложенный сайт из файловой структуры портфолио.</span>
  `
  previewFrame.hidden = true
  previewFrame.removeAttribute('src')
  emptyPreview.hidden = false
  previewPath.textContent = '/showcase/waiting'
  openCurrent.hidden = true
  openCurrent.href = '#'
}

const renderDesignOptions = (site) => {
  designSelect.innerHTML = site.designs
    .map(
      (design) =>
        `<option value="${design.id}">${design.label}</option>`
    )
    .join('')
  designField.hidden = site.designs.length === 0
}

const loadPreview = (siteId, designId) => {
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

  const entry = normalizePath(design.entry)

  selectionInfo.innerHTML = `
    <strong>${site.label}: ${design.label}</strong>
    <span>${design.description}</span>
  `
  previewFrame.src = entry
  previewFrame.hidden = false
  emptyPreview.hidden = true
  previewPath.textContent = design.entry
  openCurrent.href = entry
  openCurrent.hidden = false
}

const handleSiteChange = () => {
  const siteId = siteSelect.value
  const site = manifest.sites.find(
    (item) => item.id === siteId
  )

  if (!site) {
    setNeutralState()
    return
  }

  renderDesignOptions(site)
  loadPreview(site.id, site.designs[0]?.id)
}

const handleDesignChange = () => {
  loadPreview(siteSelect.value, designSelect.value)
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

openPanelButton.addEventListener('click', () => {
  panel.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
  siteSelect.focus({ preventScroll: true })
})

siteSelect.addEventListener('change', handleSiteChange)
designSelect.addEventListener('change', handleDesignChange)

init().catch((error) => {
  selectionInfo.innerHTML = `
    <strong>Не удалось загрузить витрину</strong>
    <span>${error.message}</span>
  `
})
