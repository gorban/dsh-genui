/**
 * The GenUI authoring prompt is the model's system prompt, so its language
 * decides the language the model answers in. Upstream @opentiny/genui-sdk-core
 * ships a Chinese-only prompt (no locale option, no en_US material metadata, no
 * English template in its dist), so this fork freezes an English prompt in
 * src/prompt/genui-prompt.en.ts.
 *
 * These assertions fail if the fork ever goes back to calling genPrompt(), if
 * the generated asset is refreshed from a Chinese source, or if a regeneration
 * leaves a Chinese fragment behind.
 */
import { describe, expect, it } from 'vitest'
import { GENUI_PROMPT_EN } from '../src/prompt/genui-prompt.en.ts'

const CJK = /[\u4e00-\u9fff]/

describe('GenUI authoring prompt language', () => {
  it('carries no Chinese at all', () => {
    const offending = GENUI_PROMPT_EN.split('\n')
      .map((line, i) => [i + 1, line] as const)
      .filter(([, line]) => CJK.test(line))
    expect(offending).toEqual([])
  })

  it('still looks like the full card-authoring prompt', () => {
    // Guards against an empty or truncated asset passing the language check.
    expect(GENUI_PROMPT_EN.length).toBeGreaterThan(10_000)
    expect(GENUI_PROMPT_EN).toContain('# Task description')
    expect(GENUI_PROMPT_EN).toContain('## Card JSON Schema')
    expect(GENUI_PROMPT_EN).toContain('## schemaJson generation rules')
    // The prompt must document the code fence the parser accepts.
    expect(GENUI_PROMPT_EN).toContain('```schemaJson')
    // Component catalog survives translation.
    expect(GENUI_PROMPT_EN).toContain('TinyHuichartsLine')
  })

  it('keeps the continueChat action described for the model', () => {
    expect(GENUI_PROMPT_EN).toContain('continueChat')
    expect(GENUI_PROMPT_EN).toContain('this.callAction')
  })
})