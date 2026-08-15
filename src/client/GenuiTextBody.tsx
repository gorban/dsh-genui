/**
 * Mixed markdown + GenUI card body for one assistant text block.
 */
import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { MarkdownFileMentions } from '@deepseek-ai/dsh-client-ui-primitives'
import { GenuiConfigProvider, GenuiRenderer } from '@opentiny/genui-sdk-react'
import { materials } from '@opentiny/genui-sdk-materials-react-antd/materials'
import type { ICustomAction } from '@opentiny/genui-sdk-react'
import { splitAssistantText } from './split-assistant-text.ts'
import css from './genui-assistant.module.css'

export interface GenuiTextBodyProps {
  text: string
  streaming: boolean
  codeLabels: { copyLabel: string; copiedLabel: string }
  mentions?: MarkdownFileMentions | undefined
  customActions?: Record<string, ICustomAction> | undefined
}

/** Render markdown segments and schemaJson fences as GenUI cards. */
export const GenuiTextBody = memo(function GenuiTextBody({
  text, streaming, codeLabels, mentions, customActions,
}: GenuiTextBodyProps) {
  const segments = useMemo(() => splitAssistantText(text, streaming), [text, streaming])
  const nodes: ReactNode[] = []
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === undefined) continue
    if (segment.kind === 'markdown') {
      if (segment.text.trim().length === 0) continue
      nodes.push(
        <MarkdownText
          key={`md-${i}`}
          text={segment.text}
          streaming={streaming}
          codeLabels={codeLabels}
          fileMentions={mentions}
        />,
      )
      continue
    }
    nodes.push(
      <div key={`schema-${i}`} className={css.card} data-dsh-genui-card="">
        <GenuiConfigProvider materials={materials}>
          <GenuiRenderer
            content={segment.text}
            generating={streaming && !segment.complete}
            isJsonComplete={segment.complete}
            customActions={customActions}
          />
        </GenuiConfigProvider>
      </div>,
    )
  }
  return <>{nodes}</>
})
