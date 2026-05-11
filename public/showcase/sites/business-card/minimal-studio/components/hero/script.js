export function mount(element) {
  element
    .querySelector('.bc-nav a')
    .addEventListener('click', (event) => {
      event.preventDefault()
      document
        .querySelector('#contact')
        ?.scrollIntoView({ behavior: 'smooth' })
    })
}
