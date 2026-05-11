export function mount(element) {
  element
    .querySelector('[data-request]')
    .addEventListener('click', (event) => {
      event.currentTarget.textContent =
        'Заявка подготовлена'
    })
}
