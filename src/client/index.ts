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
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'assistant-step',
    priority: ASSISTANT_STEP_PRIORITY,
  }, GenuiAssistantNodeView))
}
