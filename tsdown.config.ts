import { clientBundle, runtimeBundle } from './build/tsdown.client.ts'

// The id is the plugin id (package name): the client build stamps it into
// `window.__ModuleLoader__.load({ id, factory })`, and the browser module system
// rejects a bundle that does not register the id it was served under
// ("loaded without registering \"<id>\""). It must therefore be this fork's
// published name, not upstream's `dsh-genui`.
const ID = '@gorban/dsh-genui'

export default clientBundle(ID, ['src/index.ts'], {
  portableCssModuleIds: true,
  // Host lib inlines GenUI prompt deps so `dsh plugin add` does not need
  // GenUI packages in the profile tree.
  libExternal: [
    '@deepseek-ai/dsh-system-prompt',
    '@deepseek-ai/schemastery',
  ],
  companions: [runtimeBundle(ID, 'src/client/genui-runtime.ts', true)],
})
