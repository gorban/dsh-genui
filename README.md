# dsh-genui

Installable [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **bundle**: GenUI system prompt + React card rendering for assistant `` ```schemaJson `` `` blocks.

Does **not** modify harness source. Uses Cordis slot shadowing (`conversation.chat.node` / `assistant-step` at `priority: -1`), same shape as other out-of-tree plugins (see harness [publish tutorial](../deepseek-harness/docs/user/develop/basic/publish.md)).

## Sibling layout

```
Documents/code/
  ai/deepseek-harness/
  ai/dsh-genui/              # this package
  opentiny/genui-sdk/        # React renderer branch (e.g. lhs/react_render)
```

Local builds use `pnpm-workspace.yaml` to link GenUI packages. Built artifacts (`lib/index.js`, `lib/client.js`) **inline** GenUI + antd so `dsh plugin add` does not need those workspace links in the profile.

## Prerequisites

Build GenUI once (when its sources change):

```sh
cd ../../opentiny/genui-sdk
pnpm install
pnpm -F @opentiny/genui-sdk-core build
pnpm -F @opentiny/tiny-schema-renderer-react build
pnpm -F @opentiny/genui-sdk-react build
pnpm -F @opentiny/genui-sdk-materials-react-antd build
```

A `dsh` CLI that can boot `--profile web` (harness source: `pnpm dsh`, or an installed CLI).

## Install

```sh
cd /Users/lhuans/Documents/code/ai/dsh-genui
pnpm install
pnpm build
pnpm test

# from harness checkout, or any environment with dsh on PATH:
dsh plugin --profile web add /Users/lhuans/Documents/code/ai/dsh-genui
dsh --profile web --dump-config   # expect "# == dsh-genui"
dsh --profile web
```

Remove:

```sh
dsh plugin --profile web remove dsh-genui
```

## Behavior

| Half | Behavior |
|---|---|
| **Host** (`lib/index.js`) | `genPrompt('React', materialsMeta)` → `systemPrompt.section({ name: 'genui:cards' })` |
| **Client** (`lib/client.js`) | Shadows `assistant-step`; splits text on `` ```schemaJson `` ``; renders with `GenuiRenderer` |

Session log unchanged: schema stays inside assistant message text (model-visible ⟺ logged).

## Known limitations

- `continueChat` only logs to the browser console; wire to the composer later.
- Shadows the **entire** assistant row; track upstream `AssistantNodeView` changes.
- Client bundle is large (~5MB) because antd + materials are inlined.
- GenUI prompt is long — keep the bundle opt-in.
- Peer APIs (`ui-primitives`, slots) come from the running web profile, not this package.

## Develop

```sh
pnpm test     # splitAssistantText
pnpm build    # regenerate lib/
```
