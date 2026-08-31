/**
 * Duck-typed props for the shadowed assistant-step seat.
 * Avoids a hard dependency on @deepseek-ai/dsh-client-ui-conversation at install
 * time (that package uses workspace: protocol and is provided by the web profile).
 */
import type { MarkdownFileMentions } from '@deepseek-ai/dsh-client-ui-primitives'

/** Minimal assistant content block kinds this view understands. */
export type AssistantBlock =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'reasoning'; readonly text: string }
  | { readonly kind: 'image' }
  | { readonly kind: 'tool-call' }
  | { readonly kind: string; readonly block?: unknown; readonly text?: string }

/** Owner currency for file-mention resolution (turn-tail aligned). */
export interface TurnTailOwner {
  readonly turn: { readonly status: string }
  readonly seq: number
  readonly openFile: (path: string) => void
}

/** Session-kit input face (setDraft + submit) from conversation session provide. */
export interface GenuiInputActions {
  readonly setDraft: (text: string) => void
  readonly submit: () => void
}

/** Props passed by conversation.chat.node for key assistant-step. */
export interface GenuiAssistantNodeViewProps {
  readonly node: {
    readonly data: {
      readonly blocks: readonly AssistantBlock[]
      readonly status: string
      readonly finalNode?: { readonly seq: number }
    }
    readonly location: {
      readonly kind: string
      readonly turn?: { readonly status: string }
    }
  }
  readonly loadImage?: ((attachment: never) => Promise<string>) | undefined
  readonly fileMentions: (owner: TurnTailOwner) => MarkdownFileMentions | undefined
  readonly t?: ((key: string, params?: Record<string, unknown>) => string) | undefined
  readonly useTurnData: (key: string) => {
    readonly closing?: { readonly finalNode: { readonly seq: number } }
  } | undefined
  readonly openFile: (path: string) => void
  /** Present on session-scoped chat nodes via the standard session kit. */
  readonly inputActions?: GenuiInputActions | undefined
}
