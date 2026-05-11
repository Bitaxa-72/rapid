export function mount(element) {
  element
    .querySelector('.bc-nav a')
    .addEventListener('click', (event) => {
      event.preventDefault()
      element
        .getRootNode()
        .querySelector('#contact')
        ?.scrollIntoView({ behavior: 'smooth' })
    })
}
