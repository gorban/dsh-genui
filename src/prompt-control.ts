import type { IncomingMessage, ServerResponse } from 'node:http'

/** The minimal system-prompt registry face used by the toggle. */
export interface GenuiSystemPrompt {
  section(section: { name: string; order: number; text: string }): () => void
}

/** Registers and disposes one prompt section without leaking it on unload. */
export interface GenuiPromptControl {
  /** Whether the section is currently in the prompt registry. */
  isEnabled(): boolean
  /** Set the desired state and return the resulting state. */
  set(enabled: boolean): boolean
}

/** The persisted slice of prompt-toggle state in DSH settings. */
export interface GenuiPromptSettings {
  /** Whether the authoring prompt section is active. */
  enabled: boolean
}

/** The owner-facing settings scope used by the toggle. */
export interface GenuiPromptSettingsScope {
  get(): GenuiPromptSettings
  update(patch: GenuiPromptSettings): Promise<void>
}

/**
 * Mirror prompt-toggle changes into DSH settings without delaying the UI.
 * @param control - the in-memory prompt section control.
 * @param settings - the registered settings scope.
 * @param initialEnabled - fallback when settings contains no stored value.
 * @param onError - called when persisting a user choice fails.
 */
export function createPersistedPromptControl(
  control: GenuiPromptControl,
  settings: GenuiPromptSettingsScope,
  initialEnabled: boolean,
  onError?: (error: unknown) => void,
  onPersist?: (enabled: boolean) => void,
): GenuiPromptControl {
  const stored = settings.get().enabled
  control.set(typeof stored === 'boolean' ? stored : initialEnabled)
  return {
    isEnabled: control.isEnabled,
    set(enabled) {
      const next = control.set(enabled)
      onPersist?.(next)
      void settings.update({ enabled: next }).catch(error => onError?.(error))
      return next
    },
  }
}

/**
 * Create the host-side on/off state for the GenUI authoring section.
 * @param section - stable prompt section values.
 * @param systemPrompt - host system-prompt registry.
 */
export function createGenuiPromptControl(
  section: { name: string; order: number; text: string },
  systemPrompt: GenuiSystemPrompt,
): GenuiPromptControl {
  let disposer: (() => void) | undefined
  return {
    isEnabled: () => disposer !== undefined,
    set(enabled) {
      if (enabled === (disposer !== undefined)) return enabled
      if (enabled) {
        disposer = systemPrompt.section(section)
      } else {
        disposer?.()
        disposer = undefined
      }
      return enabled
    },
  }
}

/**
 * Handle GET (read state) and POST `{ enabled: boolean }` (set state).
 * This is deliberately tiny and same-origin only; the button owns the UI state.
 * @param control - host prompt toggle.
 */
export function createGenuiPromptControlHandler(
  control: Pick<GenuiPromptControl, 'isEnabled' | 'set'> & { persisted?: () => boolean },
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method === 'GET') {
      respond(res, 200, {
        enabled: control.isEnabled(),
        ...(control.persisted === undefined ? {} : { persisted: control.persisted() }),
      })
      return
    }
    if (req.method !== 'POST') {
      respond(res, 405, { error: 'method-not-allowed' })
      return
    }
    try {
      const payload = await readJsonObject(req)
      if (typeof payload.enabled !== 'boolean') {
        respond(res, 400, { error: 'enabled-must-be-boolean' })
        return
      }
      respond(res, 200, { enabled: control.set(payload.enabled) })
    } catch {
      respond(res, 400, { error: 'invalid-json' })
    }
  }
}

async function readJsonObject(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > 256) throw new Error('body-too-large')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('body-must-be-object')
  }
  return parsed
}

function respond(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}
