import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('dsh-genui', ['src/index.ts'], {
  portableCssModuleIds: true,
  // Host lib inlines GenUI prompt deps so `dsh plugin add` does not need
  // workspace: protocol packages in the profile tree.
  libExternal: [
    '@deepseek-ai/dsh-system-prompt',
    '@deepseek-ai/schemastery',
  ],
})
