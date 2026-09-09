/**
 * Host half: injects the GenUI card-authoring system-prompt section so the
 * model emits ```schemaJson fences alongside normal markdown.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { genPrompt } from '@opentiny/genui-sdk-core'
import { materialsMeta } from '@opentiny/genui-sdk-materials-vue-opentiny-vue/meta'
import {
  GENUI_RUNTIME_MAP_URL,
  GENUI_RUNTIME_URL,
  genuiRuntimeArtifactPaths,
  serveStaticFile,
} from './serve-genui-runtime.ts'

export const name = 'dsh-genui'
export const inject = ['systemPrompt', 'webServer']

interface WebServer {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** Tunables for the GenUI prompt section. */
export interface Config {
  /** Registry order among system-prompt sections (higher = later). */
  sectionOrder: number
  /** Stable section name in the prompt registry. */
  sectionName: string
}

export const Config: z<Config> = z.object({
  sectionOrder: z.number().default(80),
  sectionName: z.string().default('genui:cards'),
})

/**
 * Register the GenUI authoring guidance on the host system-prompt registry.
 * @param ctx - Cordis context with `systemPrompt` injected.
 * @param config - validated plugin config.
 */
export function apply(ctx: Context, config: Config): void {
  const text = genPrompt('Vue', materialsMeta, {
    customActions: [
      {
        name: 'continueChat',
        description:
          'Continue the conversation (e.g. form submit). Pass a short message only; the host appends the card state (formData, etc.) automatically.',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Short follow-up text (button label or summary). Do not put form fields here.',
            },
          },
          required: ['message'],
        },
      },
    ],
  })
  // systemPrompt is provided by the web/base profile; typed loosely for out-of-tree builds.
  const systemPrompt = (ctx as Context & {
    systemPrompt: { section: (section: { name: string; order: number; text: string }) => () => void }
  }).systemPrompt
  systemPrompt.section({
    name: config.sectionName,
    order: config.sectionOrder,
    text,
  })

  const artifacts = genuiRuntimeArtifactPaths()
  const webServer = (ctx as Context & { webServer: WebServer }).webServer
  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: GENUI_RUNTIME_URL,
      handler: serveStaticFile(artifacts.js, 'text/javascript; charset=utf-8'),
    }),
    'dsh-genui: runtime.js',
  )
  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: GENUI_RUNTIME_MAP_URL,
      handler: serveStaticFile(artifacts.map, 'application/json; charset=utf-8'),
    }),
    'dsh-genui: runtime.js.map',
  )
}
