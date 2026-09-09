/**
 * React host for the Vue GenUI custom element. React 18 stringifies object
 * attributes, so schema/actions are assigned as element properties.
 * Vue/OpenTiny live in a split runtime loaded on first card.
 */
import { createElement, memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ICustomAction } from '@opentiny/genui-sdk-vue/renderer'
import { DSH_GENUI_CARD_TAG } from './genui-card-tag.ts'
import { loadGenuiRuntime } from './load-genui-runtime.ts'

export interface GenuiVueCardProps {
  content: string
  generating: boolean
  isJsonComplete: boolean
  customActions?: Record<string, ICustomAction> | undefined
  className?: string | undefined
}

type CardElement = HTMLElement & {
  content: string
  generating: boolean
  isJsonComplete: boolean
  customActions?: Record<string, ICustomAction> | undefined
}

type LoadStatus = 'loading' | 'ready' | 'error'

/** Mount one Vue GenUI card via `<dsh-genui-card>`. */
export const GenuiVueCard = memo(function GenuiVueCard({
  content, generating, isJsonComplete, customActions, className,
}: GenuiVueCardProps) {
  const ref = useRef<CardElement | null>(null)
  const [status, setStatus] = useState<LoadStatus>(() => (
    typeof customElements !== 'undefined' && customElements.get(DSH_GENUI_CARD_TAG) !== undefined
      ? 'ready'
      : 'loading'
  ))

  useEffect(() => {
    if (status !== 'loading') return
    let cancelled = false
    void loadGenuiRuntime().then(
      () => { if (!cancelled) setStatus('ready') },
      (err: unknown) => {
        console.error(err)
        if (!cancelled) setStatus('error')
      },
    )
    return () => { cancelled = true }
  }, [status])

  useLayoutEffect(() => {
    if (status !== 'ready') return
    const el = ref.current
    if (el === null) return
    el.content = content
    el.generating = generating
    el.isJsonComplete = isJsonComplete
    el.customActions = customActions
  }, [status, content, generating, isJsonComplete, customActions])

  if (status === 'error') {
    return createElement('div', {
      className,
      'data-dsh-genui-card-error': '',
    })
  }
  if (status !== 'ready') {
    return createElement('div', {
      className,
      'data-dsh-genui-card-pending': '',
      'aria-busy': true,
    })
  }
  return createElement(DSH_GENUI_CARD_TAG, {
    ref,
    className,
    'data-dsh-genui-card': '',
  })
})
