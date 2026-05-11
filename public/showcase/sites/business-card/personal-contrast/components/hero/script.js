const accents = ['#ef6a3a', '#8bd3dd', '#f7c948']

export function mount(element) {
  let index = 0
  const root = element.getRootNode()

  element
    .querySelector('button')
    .addEventListener('click', () => {
      index = (index + 1) % accents.length
      root.host.style.setProperty(
        '--accent',
        accents[index]
      )
    })
}
