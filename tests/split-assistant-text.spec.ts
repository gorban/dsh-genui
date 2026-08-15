// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { splitAssistantText } from '../src/client/split-assistant-text.ts'

describe('splitAssistantText', () => {
  it('returns plain markdown when no fence is present', () => {
    expect(splitAssistantText('hello', false)).toEqual([
      { kind: 'markdown', text: 'hello' },
    ])
  })

  it('extracts a complete schemaJson fence', () => {
    const text = 'before\n```schemaJson\n{"componentName":"Page"}\n```\nafter'
    expect(splitAssistantText(text, false)).toEqual([
      { kind: 'markdown', text: 'before\n' },
      { kind: 'schema', text: '{"componentName":"Page"}\n', complete: true },
      { kind: 'markdown', text: '\nafter' },
    ])
  })

  it('treats a trailing open fence as incomplete while streaming', () => {
    const text = 'intro\n```schemaJson\n{"componentName":"Page"'
    expect(splitAssistantText(text, true)).toEqual([
      { kind: 'markdown', text: 'intro\n' },
      { kind: 'schema', text: '{"componentName":"Page"', complete: false },
    ])
  })
})
