/**
 * Host half: injects the GenUI card-authoring system-prompt section so the
 * model emits ```schemaJson fences alongside normal markdown.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { genPrompt } from '@opentiny/genui-sdk-core'
import { materialsMeta } from '@opentiny/genui-sdk-materials-vue-opentiny-vue/meta'

export const name = 'dsh-genui'
export const inject = ['systemPrompt']

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
}
