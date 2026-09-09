import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it } from 'vitest'
import { serveStaticFile } from '../src/serve-genui-runtime.ts'

function mockRes(): ServerResponse & { statusCodeOut: number; headersOut: Record<string, string>; bodyOut: unknown } {
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

describe('serveStaticFile', () => {
  it('serves GET with no-cache javascript headers', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-genui-'))
    const file = join(dir, 'runtime.js')
    await writeFile(file, 'export {}\n')
    const res = mockRes()
    await serveStaticFile(file, 'text/javascript; charset=utf-8')(
      { method: 'GET' } as IncomingMessage,
      res,
    )
    expect(res.statusCodeOut).toBe(200)
    expect(res.headersOut['content-type']).toBe('text/javascript; charset=utf-8')
    expect(res.headersOut['cache-control']).toBe('no-cache')
    expect(Buffer.isBuffer(res.bodyOut) ? res.bodyOut.toString() : res.bodyOut).toBe('export {}\n')
  })

  it('answers HEAD without a body', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-genui-'))
    const file = join(dir, 'runtime.js')
    await writeFile(file, 'export {}\n')
    const res = mockRes()
    await serveStaticFile(file, 'text/javascript; charset=utf-8')(
      { method: 'HEAD' } as IncomingMessage,
      res,
    )
    expect(res.statusCodeOut).toBe(200)
    expect(res.bodyOut).toBeUndefined()
  })

  it('returns 405 for POST and 404 for a missing file', async () => {
    const resPost = mockRes()
    await serveStaticFile('/no/such/file.js', 'text/javascript; charset=utf-8')(
      { method: 'POST' } as IncomingMessage,
      resPost,
    )
    expect(resPost.statusCodeOut).toBe(405)

    const resMissing = mockRes()
    await serveStaticFile('/no/such/file.js', 'text/javascript; charset=utf-8')(
      { method: 'GET' } as IncomingMessage,
      resMissing,
    )
    expect(resMissing.statusCodeOut).toBe(404)
  })
})
