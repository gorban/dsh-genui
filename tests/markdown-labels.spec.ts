import { describe, expect, it } from 'vitest'
import { markdownLabels } from '../src/client/markdown-labels.ts'

describe('markdownLabels', () => {
  it('maps chat locale keys to MarkdownText labels', () => {
    const t = (key: string) => `loc:${key}`
    expect(markdownLabels(t)).toEqual({
      code: { copyLabel: 'loc:copy', copiedLabel: 'loc:copied' },
      footnotes: 'loc:markdown.footnotes',
    })
  })
})
