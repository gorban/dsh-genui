/**
 * Host half: injects the GenUI card-authoring system-prompt section so the
 * model emits ```schemaJson fences alongside normal markdown.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { materialsMeta } from '@opentiny/genui-sdk-materials-vue-opentiny-vue/meta'
import { genPrompt } from '@opentiny/genui-sdk-core'
import { createGenuiPromptControl, createGenuiPromptControlHandler } from './prompt-control.ts'
import { GENUI_PROMPT_CONTROL_URL } from './prompt-control-url.ts'
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
 * Create the GenUI authoring guidance for the host system-prompt registry.
 * @returns The prompt text to register while the composer toggle is enabled.
 */
function genuiPromptText(): string {
  return genPrompt('Vue', materialsMeta, {
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
}

/**
 * Register the GenUI runtime and the on-demand authoring prompt toggle.
 * @param ctx - Cordis context with `systemPrompt` injected.
 * @param config - validated plugin config.
 */
export function apply(ctx: Context, config: Config): void {
  // systemPrompt is provided by the web/base profile; typed loosely for out-of-tree builds.
  const systemPrompt = (ctx as Context & {
    systemPrompt: { section: (section: { name: string; order: number; text: string }) => () => void }
  }).systemPrompt
  const promptControl = createGenuiPromptControl({
    name: config.sectionName,
    order: config.sectionOrder,
    text: genuiPromptText(),
  }, systemPrompt)

  // A disabled prompt must not survive plugin unload and re-enable.
  ctx.effect(() => () => promptControl.set(false), 'dsh-genui: prompt toggle state')

  const artifacts = genuiRuntimeArtifactPaths()
  const webServer = (ctx as Context & { webServer: WebServer }).webServer
  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: GENUI_PROMPT_CONTROL_URL,
      handler: createGenuiPromptControlHandler(promptControl),
    }),
    'dsh-genui: prompt toggle state endpoint',
  )
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
