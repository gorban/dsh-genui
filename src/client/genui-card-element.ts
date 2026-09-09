/**
 * Vue GenUI renderer as a light-DOM custom element so the React conversation
 * slot can host cards without sharing a Vue app with DeepSeek Harness.
 */
import { defineComponent, defineCustomElement, h, type PropType } from 'vue'
import { GenuiConfigProvider } from '@opentiny/genui-sdk-vue/config-provider'
import { GenuiRenderer } from '@opentiny/genui-sdk-vue/renderer'
import type { ICustomAction } from '@opentiny/genui-sdk-vue/renderer'
import { materials } from '@opentiny/genui-sdk-materials-vue-opentiny-vue/materials'
import '@opentiny/tiny-robot/dist/style.css'
import { DSH_GENUI_CARD_TAG } from './genui-card-tag.ts'
import './genui-card-host.css'

export { DSH_GENUI_CARD_TAG }

let cardSeq = 0

const DshGenuiCard = defineComponent({
  props: {
    content: { type: String, default: '' },
    generating: { type: Boolean, default: false },
    isJsonComplete: { type: Boolean, default: true },
    customActions: {
      type: Object as PropType<Record<string, ICustomAction> | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const id = `dsh-genui-card-${++cardSeq}`
    return () => h(GenuiConfigProvider, { materials, id }, {
      default: () => h(GenuiRenderer, {
        content: props.content,
        generating: props.generating,
        isJsonComplete: props.isJsonComplete,
        customActions: props.customActions,
      }),
    })
  },
})

/** Vue 3.5: light DOM so TinyVue popovers/teleports and theme CSS work. */
export const DshGenuiCardElement = defineCustomElement(DshGenuiCard, { shadowRoot: false })

/** Register `dsh-genui-card` once per browser document. */
export function ensureDshGenuiCardDefined(): void {
  if (typeof customElements === 'undefined') return
  if (customElements.get(DSH_GENUI_CARD_TAG) !== undefined) return
  customElements.define(DSH_GENUI_CARD_TAG, DshGenuiCardElement)
}

ensureDshGenuiCardDefined()
