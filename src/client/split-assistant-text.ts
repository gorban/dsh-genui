/**
 * Split assistant markdown into prose vs ```schemaJson card payloads.
 * Complete fences become schema segments; while streaming, a trailing open
 * fence is treated as an incomplete schema segment for GenuiRenderer.
 */

/** One display segment after schemaJson extraction. */
export type TextSegment =
  | { readonly kind: 'markdown'; readonly text: string }
  | { readonly kind: 'schema'; readonly text: string; readonly complete: boolean }

const COMPLETE_FENCE = /```schemaJson\s*\r?\n?([\s\S]*?)```/g
const OPEN_FENCE = /```schemaJson\s*\r?\n?([\s\S]*)$/

/**
 * Split assistant text into markdown and schema-card segments.
 * @param text - full assistant text block (streaming or final).
 * @param streaming - whether the turn is still generating.
 * @returns ordered segments for mixed markdown + GenUI rendering.
 */
export function splitAssistantText(text: string, streaming: boolean): TextSegment[] {
  const segments: TextSegment[] = []
  let last = 0
  COMPLETE_FENCE.lastIndex = 0
  for (const match of text.matchAll(COMPLETE_FENCE)) {
    const index = match.index ?? 0
    if (index > last) {
      segments.push({ kind: 'markdown', text: text.slice(last, index) })
    }
    segments.push({ kind: 'schema', text: match[1] ?? '', complete: true })
    last = index + match[0].length
  }
  const rest = text.slice(last)
  if (rest.length === 0) return segments
  if (streaming) {
    const open = OPEN_FENCE.exec(rest)
    if (open !== null && open.index !== undefined) {
      const before = rest.slice(0, open.index)
      if (before.length > 0) segments.push({ kind: 'markdown', text: before })
      segments.push({ kind: 'schema', text: open[1] ?? '', complete: false })
      return segments
    }
  }
  segments.push({ kind: 'markdown', text: rest })
  return segments
}
