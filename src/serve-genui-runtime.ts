/**
 * Serve the Vue GenUI runtime ESM. DSH only exposes `/plugins/<id>/client.js`,
 * so this plugin registers its own route for the split chunk.
 */
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { GENUI_RUNTIME_MAP_URL, GENUI_RUNTIME_URL } from './genui-runtime-url.ts'

export { GENUI_RUNTIME_MAP_URL, GENUI_RUNTIME_URL }

/** Absolute paths of the runtime artifacts next to this module (lib/ after build). */
export function genuiRuntimeArtifactPaths(from = import.meta.url): { js: string; map: string } {
  return {
    js: fileURLToPath(new URL('./genui-runtime.js', from)),
    map: fileURLToPath(new URL('./genui-runtime.js.map', from)),
  }
}

/**
 * GET/HEAD a file from disk. Unknown methods 405; missing files 404.
 * @param filePath - absolute path to the artifact.
 * @param contentType - response Content-Type.
 */
export function serveStaticFile(
  filePath: string,
  contentType: string,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }
    try {
      const body = await readFile(filePath)
      res.writeHead(200, {
        'content-type': contentType,
        'cache-control': 'no-cache',
      })
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  }
}
