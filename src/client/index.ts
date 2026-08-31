/**
 * Browser half: shadow the built-in assistant-step Chat Node with GenUI-aware
 * rendering. Host half (src/index.ts) owns the system-prompt section.
 */
import type { Context } from '@deepseek-ai/cordis'
import { ASSISTANT_STEP_PRIORITY, GenuiAssistantNodeView } from './GenuiAssistantNodeView.tsx'

export const inject = ['slots']

/**
 * Register the GenUI assistant renderer over conversation.chat.node.
 * @param ctx - browser Cordis context with the slot service.
 */
export function apply(ctx: Context): void {
  // ui-chat owns assistant-step renderers and uses the `chat` locale namespace.
  // Omitting `locale` leaves `t` undefined and the view crashes; the slot then
  // abdicates to the built-in assistant-step (schemaJson shows as a Markdown
  // code fence — the failure mode users hit).
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'assistant-step',
    priority: ASSISTANT_STEP_PRIORITY,
    locale: 'chat',
  }, GenuiAssistantNodeView))
}
