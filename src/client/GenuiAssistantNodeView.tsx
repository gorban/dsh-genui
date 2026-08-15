/**
 * Shadowed assistant-step renderer: GenUI cards for ```schemaJson, markdown
 * otherwise; lightweight reasoning / image / unknown fallbacks so shadowing
 * does not drop those block kinds.
 */
import { memo, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { JsonBlock, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ICustomAction } from '@opentiny/genui-sdk-react'
import type { GenuiAssistantNodeViewProps } from './assistant-props.ts'
import { GenuiTextBody } from './GenuiTextBody.tsx'
import css from './genui-assistant.module.css'

/** Priority below the built-in assistant-step (0) so this entry wins. */
export const ASSISTANT_STEP_PRIORITY = -1

/** Keyed Chat Node view that replaces the stock assistant bubble. */
export const GenuiAssistantNodeView = memo(function GenuiAssistantNodeView({
  node, loadImage, fileMentions, t, useTurnData, openFile,
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
  const translate = typeof t === 'function' ? t : ((key: string) => key)
  const codeLabels = useMemo(
    () => ({ copyLabel: translate('copy'), copiedLabel: translate('copied') }),
    [translate],
  )
  const customActions = useMemo<Record<string, ICustomAction>>(() => ({
    continueChat: {
      name: 'continueChat',
      description: 'Continue the chat with a follow-up user message.',
      execute: (params) => {
        const message = typeof params === 'object' && params !== null && 'message' in params
          ? String((params as { message: unknown }).message)
          : ''
        if (message.trim().length === 0) return
        console.info('[dsh-genui] continueChat', message)
      },
    },
  }), [])

  const blocks = data.blocks
  const hasVisible = streaming
    || interrupted
    || blocks.some(block => block.kind !== 'tool-call')
  if (!hasVisible) return null

  const imageLoader = loadImage
    ?? (() => Promise.reject(new Error(String(translate('image.serviceUnavailable')))))
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
            codeLabels={codeLabels}
            mentions={mentions}
            customActions={customActions}
          />,
        )
        break
      case 'reasoning':
        rendered.push(
          <details key={i} className={css.think} open={streaming && i === last}>
            <summary>Thinking</summary>
            <MarkdownText text={block.text} streaming={streaming && i === last} codeLabels={codeLabels} />
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
          <div key={start} className={css.images}>
            {group.map((image, index) => (
              <SessionImage key={index} attachment={image} load={imageLoader} />
            ))}
          </div>,
        )
        break
      }
      case 'tool-call':
        break
      default:
        rendered.push(
          <JsonBlock
            key={i}
            label={translate('message.unknownBlock')}
            payload={'block' in block ? block.block : block}
            truncatedLabel={total => translate('json.truncated', { total })}
          />,
        )
    }
  }

  return (
    <div className={css.root} data-streaming={streaming || undefined} data-dsh-genui-assistant="">
      <div className={css.body}>
        {rendered}
        {interrupted ? <span className={css.stopped}>{translate('message.stopped')}</span> : null}
      </div>
    </div>
  )
})

function SessionImage({
  attachment,
  load,
}: {
  attachment: unknown
  load: (attachment: never) => Promise<string>
}) {
  const [url, setUrl] = useState<string | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    void load(attachment as never)
      .then((next) => { if (!cancelled) setUrl(next) })
      .catch(() => { if (!cancelled) setUrl(undefined) })
    return () => { cancelled = true }
  }, [attachment, load])
  if (url === undefined) return null
  return <img className={css.image} src={url} alt="" />
}
