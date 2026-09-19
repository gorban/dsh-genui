/**
 * Shadowed assistant-step renderer: GenUI cards for ```schemaJson, markdown
 * otherwise; lightweight reasoning / image / unknown fallbacks so shadowing
 * does not drop those block kinds.
 */
import { Fragment, memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { JsonBlock, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ICustomAction } from '@opentiny/genui-sdk-vue/renderer'
import type { GenuiAssistantNodeViewProps } from './assistant-props.ts'
import { GenuiTextBody } from './GenuiTextBody.tsx'
import { markdownLabels } from './markdown-labels.ts'
import css from './genui-assistant.module.css'

/** Priority below the built-in assistant-step (0) so this entry wins. */
export const ASSISTANT_STEP_PRIORITY = -1

/** Keyed Chat Node view that replaces the stock assistant bubble. */
export const GenuiAssistantNodeView = memo(function GenuiAssistantNodeView({
  node, renderMessageImages, fileMentions, t, useTurnData, openFile, turnProcess, inputActions,
}: GenuiAssistantNodeViewProps) {
  const data = node.data
  const streaming = data.status === 'running'
  const interrupted = data.status === 'interrupted'
  const turn = node.location.kind === 'turn' || node.location.kind === 'step'
    ? node.location.turn
    : undefined
  const tail = useTurnData('turn-tail')
  const owner = useMemo(() => {
    if (turn?.status !== 'closed' || data.finalNode === undefined) return undefined
    if (tail?.closing?.finalNode.seq !== data.finalNode.seq) return undefined
    return { turn, seq: data.finalNode.seq, openFile }
  }, [data.finalNode, openFile, tail, turn])
  const mentions = useMemo(
    () => (owner === undefined ? undefined : fileMentions(owner)),
    [fileMentions, owner],
  )
  const labels = useMemo(() => markdownLabels(t), [t])
  const reasoningHidden = turnProcess !== undefined
    && turnProcess.foldable
    && turnProcess.spec.answerStep === data.step
    && turnProcess.spec.inlineReasoning
    && !turnProcess.open
  const customActions = useMemo<Record<string, ICustomAction>>(() => ({
    continueChat: {
      name: 'continueChat',
      description: 'Continue the chat with a follow-up user message.',
      // Match GenUI Chat: short button label + card state (formData, …) for the model.
      execute: (params, context) => {
        const message = typeof params === 'object' && params !== null && 'message' in params
          ? String((params as { message: unknown }).message)
          : ''
        if (message.trim().length === 0 || inputActions === undefined) return
        let stateJson = '{}'
        try {
          stateJson = JSON.stringify(context?.state ?? {})
        } catch {
          stateJson = '{}'
        }
        const draft = `${message}, with parameters: ${stateJson}`
        inputActions.setDraft(draft)
        inputActions.submit()
      },
    },
  }), [inputActions])

  const blocks = data.blocks
  const hasVisible = streaming
    || interrupted
    || blocks.some(block => block.kind !== 'tool-call')
  if (!hasVisible) return null

  const rendered: ReactNode[] = []
  const last = blocks.length - 1
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block === undefined) continue
    switch (block.kind) {
      case 'text':
        rendered.push(
          <GenuiTextBody
            key={i}
            text={block.text}
            streaming={streaming}
            interrupted={interrupted}
            labels={labels}
            mentions={mentions}
            customActions={customActions}
          />,
        )
        break
      case 'reasoning':
        if (reasoningHidden) break
        rendered.push(
          <details key={i} className={css.think} open={streaming && i === last}>
            <summary>{t('message.think')}</summary>
            <MarkdownText
              text={block.text}
              streaming={streaming && i === last}
              labels={labels}
            />
          </details>,
        )
        break
      case 'image': {
        const start = i
        const group = [block]
        while (i + 1 < blocks.length) {
          const next = blocks[i + 1]
          if (next === undefined || next.kind !== 'image') break
          group.push(next)
          i += 1
        }
        rendered.push(
          <Fragment key={start}>
            {renderMessageImages({
              images: group.map(({ attachment }) => ({ attachment })),
              align: 'start',
            })}
          </Fragment>,
        )
        break
      }
      case 'tool-call':
        break
      default:
        rendered.push(
          <JsonBlock
            key={i}
            label={t('message.unknownBlock')}
            payload={'block' in block ? block.block : block}
            truncatedLabel={total => t('json.truncated', { total })}
          />,
        )
    }
  }

  return (
    <div className={css.root} data-streaming={streaming || undefined} data-dsh-genui-assistant="">
      <div className={css.body}>
        {rendered}
        {interrupted ? <span className={css.stopped}>{t('message.stopped')}</span> : null}
      </div>
    </div>
  )
})
