import { afterEach, describe, expect, it } from 'vitest'
import { trapFocus } from './focusTrap'

function buildContainer(html: string): HTMLElement {
  const container = document.createElement('div')
  container.tabIndex = -1
  container.innerHTML = html
  document.body.append(container)
  return container
}

const tab = (shiftKey = false) =>
  new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true })

describe('trapFocus', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('focuses the container when nothing inside can take focus', () => {
    const container = buildContainer('<p>text</p><button disabled>off</button>')
    const event = tab()

    trapFocus(event, container)

    expect(document.activeElement).toBe(container)
    expect(event.defaultPrevented).toBe(true)
  })

  it('wraps from the last control to the first', () => {
    const container = buildContainer('<button id="a">a</button><a id="b" href="#">b</a>')
    container.querySelector<HTMLElement>('#b')?.focus()
    const event = tab()

    trapFocus(event, container)

    expect(document.activeElement?.id).toBe('a')
    expect(event.defaultPrevented).toBe(true)
  })

  it('wraps from the first control back to the last', () => {
    const container = buildContainer('<button id="a">a</button><input id="b" />')
    container.querySelector<HTMLElement>('#a')?.focus()

    trapFocus(tab(true), container)

    expect(document.activeElement?.id).toBe('b')
  })

  it('pulls focus back in when it escaped the container', () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    const container = buildContainer('<button id="a">a</button><button id="b">b</button>')

    trapFocus(tab(), container)
    expect(document.activeElement?.id).toBe('a')

    outside.focus()
    trapFocus(tab(true), container)
    expect(document.activeElement?.id).toBe('b')
  })

  it('leaves normal Tab movement between middle controls alone', () => {
    const container = buildContainer(
      '<button id="a">a</button><button id="b">b</button><button id="c">c</button>',
    )
    container.querySelector<HTMLElement>('#b')?.focus()
    const event = tab()

    trapFocus(event, container)

    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement?.id).toBe('b')
  })
})
