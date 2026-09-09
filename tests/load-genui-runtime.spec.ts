// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GENUI_RUNTIME_URL } from '../src/genui-runtime-url.ts'

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  document.head.replaceChildren()
})

describe('loadGenuiRuntime', () => {
  it('appends one module script and shares the in-flight promise', async () => {
    vi.spyOn(customElements, 'get').mockReturnValue(undefined)
    const { loadGenuiRuntime } = await import('../src/client/load-genui-runtime.ts')
    const first = loadGenuiRuntime()
    const second = loadGenuiRuntime()
    expect(first).toBe(second)
    const scripts = [...document.head.querySelectorAll('script')]
    expect(scripts).toHaveLength(1)
    expect(scripts[0]?.type).toBe('module')
    expect(scripts[0]?.getAttribute('src')).toBe(GENUI_RUNTIME_URL)
  })

  it('resolves after the script loads and the custom element is defined', async () => {
    const get = vi.spyOn(customElements, 'get').mockReturnValue(undefined)
    const { loadGenuiRuntime } = await import('../src/client/load-genui-runtime.ts')
    const pending = loadGenuiRuntime()
    get.mockReturnValue(class extends HTMLElement {})
    document.head.querySelector('script')?.dispatchEvent(new Event('load'))
    await expect(pending).resolves.toBeUndefined()
  })

  it('rejects on script error and allows a retry', async () => {
    vi.spyOn(customElements, 'get').mockReturnValue(undefined)
    const { loadGenuiRuntime } = await import('../src/client/load-genui-runtime.ts')
    const pending = loadGenuiRuntime()
    document.head.querySelector('script')?.dispatchEvent(new Event('error'))
    await expect(pending).rejects.toThrow(/failed to load/)
    expect(document.head.querySelectorAll('script')).toHaveLength(0)

    const retry = loadGenuiRuntime()
    expect(document.head.querySelectorAll('script')).toHaveLength(1)
    document.head.querySelector('script')?.dispatchEvent(new Event('error'))
    await expect(retry).rejects.toThrow(/failed to load/)
  })
})
