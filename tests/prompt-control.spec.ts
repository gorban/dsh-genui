import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import {
  createGenuiPromptControl,
  createGenuiPromptControlHandler,
} from '../src/prompt-control.ts'

const section = { name: 'genui:cards', order: 80, text: 'GenUI prompt' }

function mockRes(): ServerResponse & {
  statusCodeOut: number
  headersOut: Record<string, string>
  bodyOut: unknown
} {
  const rec = {
    statusCodeOut: 0,
    headersOut: {} as Record<string, string>,
    bodyOut: undefined as unknown,
    writeHead(statusCode: number, headers?: Record<string, string>) {
      rec.statusCodeOut = statusCode
      rec.headersOut = headers ?? {}
      return rec
    },
    end(body?: unknown) {
      rec.bodyOut = body
      return rec
    },
  }
  return rec as unknown as ServerResponse & typeof rec
}

function mockReq(method: string, chunks: readonly string[] = []): IncomingMessage {
  const buffers = chunks.map((chunk) => Buffer.from(chunk))
  return {
    method,
    async *[Symbol.asyncIterator]() {
      yield* buffers
    },
  } as IncomingMessage
}

function parseBody(response: ServerResponse & { bodyOut: unknown }): Record<string, unknown> {
  return JSON.parse(String(response.bodyOut)) as Record<string, unknown>
}

describe('createGenuiPromptControl', () => {
  it('registers and releases the prompt section on demand', () => {
    const dispose = vi.fn()
    const registered: Array<Record<string, unknown>> = []
    const control = createGenuiPromptControl(section, {
      section(values) {
        registered.push(values)
        return dispose
      },
    })

    expect(control.isEnabled()).toBe(false)
    expect(control.set(true)).toBe(true)
    expect(control.set(true)).toBe(true)
    expect(control.isEnabled()).toBe(true)
    expect(registered).toEqual([section])

    expect(control.set(false)).toBe(false)
    expect(control.set(false)).toBe(false)
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(control.isEnabled()).toBe(false)
  })
})

describe('createGenuiPromptControlHandler', () => {
  it('reads the initial state and updates it with POST', async () => {
    const control = createGenuiPromptControl(section, {
      section: () => () => {},
    })
    const handler = createGenuiPromptControlHandler(control)

    const read = mockRes()
    await handler(mockReq('GET'), read)
    expect(read.statusCodeOut).toBe(200)
    expect(parseBody(read)).toEqual({ enabled: false })

    const enable = mockRes()
    await handler(mockReq('POST', [JSON.stringify({ enabled: true })]), enable)
    expect(enable.statusCodeOut).toBe(200)
    expect(parseBody(enable)).toEqual({ enabled: true })
    expect(control.isEnabled()).toBe(true)

    const disable = mockRes()
    await handler(mockReq('POST', [JSON.stringify({ enabled: false })]), disable)
    expect(disable.statusCodeOut).toBe(200)
    expect(parseBody(disable)).toEqual({ enabled: false })
    expect(control.isEnabled()).toBe(false)
  })

  it('rejects unsupported methods and malformed bodies', async () => {
    const control = createGenuiPromptControl(section, {
      section: () => () => {},
    })
    const handler = createGenuiPromptControlHandler(control)

    const put = mockRes()
    await handler(mockReq('PUT'), put)
    expect(put.statusCodeOut).toBe(405)

    const invalidJson = mockRes()
    await handler(mockReq('POST', ['{']), invalidJson)
    expect(invalidJson.statusCodeOut).toBe(400)

    const missingEnabled = mockRes()
    await handler(mockReq('POST', [JSON.stringify({})]), missingEnabled)
    expect(missingEnabled.statusCodeOut).toBe(400)
    expect(control.isEnabled()).toBe(false)
  })
})
