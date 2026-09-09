import { clientBundle, runtimeBundle } from './build/tsdown.client.ts'

export default clientBundle('dsh-genui', ['src/index.ts'], {
  portableCssModuleIds: true,
  // Host lib inlines GenUI prompt deps so `dsh plugin add` does not need
  // GenUI packages in the profile tree.
  libExternal: [
    '@deepseek-ai/dsh-system-prompt',
    '@deepseek-ai/schemastery',
  ],
  companions: [runtimeBundle('dsh-genui', 'src/client/genui-runtime.ts', true)],
})
