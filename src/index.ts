/**
 * Host half: injects the GenUI card-authoring system-prompt section so the
 * model emits ```schemaJson fences alongside normal markdown.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { GENUI_PROMPT_EN } from './prompt/genui-prompt.en.ts'
import {
  createGenuiPromptControl,
  createGenuiPromptControlHandler,
  createPersistedPromptControl,
  type GenuiPromptControl,
  type GenuiPromptSettings,
  type GenuiPromptSettingsScope,
} from './prompt-control.ts'
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

/** Settings schema for the user's last prompt-toggle choice. */
export const PromptSettings: z<GenuiPromptSettings> = z.object({
  enabled: z.boolean().default(true),
})

/** The optional host settings seam used to persist the toggle. */
interface SettingsHost {
  settings: {
    register(namespace: string, schema: z<GenuiPromptSettings>): GenuiPromptSettingsScope
  }
}

/**
 * The GenUI authoring guidance for the host system-prompt registry.
 *
 * This is the fork's own English prompt, frozen by `scripts/gen-prompt-en.mjs`.
 * Upstream `@opentiny/genui-sdk-core` has no English prompt: no locale option,
 * no `en_US` material metadata, and no English template in its dist. Calling
 * `genPrompt()` would therefore register a Chinese system prompt, which drives
 * the model to answer in Chinese.
 * @returns The prompt text to register while the composer toggle is enabled.
 */
function genuiPromptText(): string {
  return GENUI_PROMPT_EN
}

/**
 * Register the GenUI runtime and the authoring prompt toggle.
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

  // The endpoint must read through this indirection because settings attach
  // asynchronously after the web route has already been registered.
  let currentControl: Pick<GenuiPromptControl, 'isEnabled' | 'set'> = promptControl
  let persistedAttached = false
  const endpointControl: Pick<GenuiPromptControl, 'isEnabled' | 'set'> & { persisted(): boolean } = {
    isEnabled: () => currentControl.isEnabled(),
    set: enabled => currentControl.set(enabled),
    persisted: () => persistedAttached,
  }

  // Authoring starts on; disposal keeps a reloaded plugin from leaking the section.
  ctx.effect(() => {
    promptControl.set(true)
    return () => promptControl.set(false)
  }, 'dsh-genui: prompt toggle state')

  ctx.inject(['settings'], (settingsCtx) => {
    const settings = (settingsCtx as Context & SettingsHost).settings
    const scope = settings.register('dsh-genui', PromptSettings)
    ctx.logger.debug('dsh-genui: settings service attached')
    settingsCtx.effect(() => {
      // Persist explicit clicks, but never write the unload-time cleanup state.
      const persistedControl = createPersistedPromptControl(promptControl, scope, true, error => {
        ctx.logger.warn('dsh-genui: failed to persist prompt state', error)
      }, enabled => {
        ctx.logger.debug('dsh-genui: persisting prompt state enabled=%s', String(enabled))
      })
      currentControl = persistedControl
      persistedAttached = true
      return () => {
        currentControl = promptControl
        persistedAttached = false
      }
    }, 'dsh-genui: persisted prompt control')
  })

  const artifacts = genuiRuntimeArtifactPaths()
  const webServer = (ctx as Context & { webServer: WebServer }).webServer
  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: GENUI_PROMPT_CONTROL_URL,
      handler: createGenuiPromptControlHandler(endpointControl),
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
