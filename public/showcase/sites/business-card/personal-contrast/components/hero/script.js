const accents = ['#ef6a3a', '#8bd3dd', '#f7c948']

export function mount(element) {
  let index = 0
  const root = element.getRootNode()
  const accentTarget = root.host ?? document.documentElement

  element
    .querySelector('button')
    .addEventListener('click', () => {
      index = (index + 1) % accents.length
      accentTarget.style.setProperty(
        '--accent',
        accents[index]
      )
    })
}
