export function mount(element) {
  let filtered = false
  const button = element.querySelector('[data-filter]')

  button.addEventListener('click', () => {
    filtered = !filtered
    button.textContent = filtered
      ? 'Показать все'
      : 'Показать только кейсы'

    element
      .querySelectorAll('article')
      .forEach((article) => {
        article.classList.toggle(
          'is-hidden',
          filtered && article.dataset.kind !== 'case'
        )
      })
  })
}
