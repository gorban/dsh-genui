/**
 * Self-contained browser entry: define `<dsh-genui-card>` without the DSH
 * module-loader wrapper. Loaded on demand from `/dsh-genui/runtime.js`.
 */
import { ensureDshGenuiCardDefined } from './genui-card-element.ts'

ensureDshGenuiCardDefined()
