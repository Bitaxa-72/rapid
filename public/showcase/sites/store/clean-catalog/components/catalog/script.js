export function mount(element) {
  let count = 0
  const label = element.querySelector('[data-cart-count]')

  element.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      count += 1
      label.textContent = `${count} в корзине`
    })
  })
}
