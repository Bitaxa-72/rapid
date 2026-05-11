export function mount(element) {
  element
    .querySelector('button')
    .addEventListener('click', () => {
      element.querySelector('button').textContent =
        'Заявка отмечена'
    })
}
