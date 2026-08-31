/**
 * React host for the Vue GenUI custom element. React 18 stringifies object
 * attributes, so schema/actions are assigned as element properties.
 */
import { createElement, memo, useLayoutEffect, useRef } from 'react'
import type { ICustomAction } from '@opentiny/genui-sdk-vue/renderer'
import { DSH_GENUI_CARD_TAG, ensureDshGenuiCardDefined } from './genui-card-element.ts'

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

/** Mount one Vue GenUI card via `<dsh-genui-card>`. */
export const GenuiVueCard = memo(function GenuiVueCard({
  content, generating, isJsonComplete, customActions, className,
}: GenuiVueCardProps) {
  const ref = useRef<CardElement | null>(null)
  ensureDshGenuiCardDefined()
  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    el.content = content
    el.generating = generating
    el.isJsonComplete = isJsonComplete
    el.customActions = customActions
  }, [content, generating, isJsonComplete, customActions])
  return createElement(DSH_GENUI_CARD_TAG, {
    ref,
    className,
    'data-dsh-genui-card': '',
  })
})
