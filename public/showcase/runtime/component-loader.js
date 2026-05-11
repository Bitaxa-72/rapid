const siteRoot = new URL('.', document.baseURI)

const loadText = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `${url.pathname} returned ${response.status}`
    )
  }

  return response.text()
}

const loadStyle = async (url, id) => {
  if (
    document.querySelector(
      `style[data-component-style="${id}"]`
    )
  ) {
    return
  }

  const style = document.createElement('style')
  style.dataset.componentStyle = id
  style.textContent = await loadText(url)
  document.head.append(style)
}

const loadScript = async (url, mountPoint) => {
  const module = await import(url.href)

  if (typeof module.mount === 'function') {
    module.mount(mountPoint)
  }
}

const mountComponent = async (mountPoint) => {
  const name = mountPoint.dataset.component
  const componentRoot = new URL(
    `components/${name}/`,
    siteRoot
  )
  const htmlUrl = new URL('section.html', componentRoot)
  const cssUrl = new URL('style.css', componentRoot)
  const scriptUrl = new URL('script.js', componentRoot)

  await loadStyle(cssUrl, `${siteRoot.pathname}:${name}`)
  mountPoint.innerHTML = await loadText(htmlUrl)
  await loadScript(scriptUrl, mountPoint)
}

const mountAll = async () => {
  const mountPoints = [
    ...document.querySelectorAll('[data-component]')
  ]

  await Promise.all(mountPoints.map(mountComponent))
  document.documentElement.dataset.componentsReady = 'true'
}

mountAll().catch((error) => {
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<pre class="component-error">${error.message}</pre>`
  )
})
