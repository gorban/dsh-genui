/**
 * Localized Markdown chrome for GenUI assistant bodies (mirrors ui-chat).
 */

/** Copy + footnote labels consumed by MarkdownText. */
export interface GenuiMarkdownLabels {
  readonly code: { readonly copyLabel: string; readonly copiedLabel: string }
  readonly footnotes: string
}

/** Build MarkdownText labels from the chat locale seat. */
export function markdownLabels(t: (key: string) => string): GenuiMarkdownLabels {
  return {
    code: { copyLabel: t('copy'), copiedLabel: t('copied') },
    footnotes: t('markdown.footnotes'),
  }
}
