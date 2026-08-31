# dsh-genui

[English](README.md)

可安装的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **插件包**：GenUI 系统提示词 + 对助手消息中 `` ```schemaJson `` `` 代码块的 Vue 卡片渲染。

**不修改** Harness 源码。通过 Cordis 插槽遮蔽（`conversation.chat.node` / `assistant-step`，`priority: -1`）接入，形态与其他仓库外插件一致（参见 Harness [发布教程](../deepseek-harness/docs/user/develop/basic/publish.md)）。

Web profile 的对话 UI 基于 React。本插件保留该插槽的 React 实现，并将每张卡片托管为 **light DOM Web Component**（`<dsh-genui-card>`），内部使用 `@opentiny/genui-sdk-vue` 与 OpenTiny Vue 物料。

## 依赖说明

GenUI 相关包（`@opentiny/genui-sdk-*`、`@opentiny/tiny-schema-renderer`）在 `devDependencies` 中固定版本，构建时从 npm 安装。产物（`lib/index.js`、`lib/client.js`）会**内联** GenUI 与 TinyVue，因此 `dsh plugin add` 后 profile 无需再安装这些包。

## 前置条件

Node.js + pnpm，以及能启动 `--profile web` 的 `dsh` CLI（Harness 源码中可用 `pnpm dsh`，或已全局安装的 CLI）。

## 安装

```sh
cd dsh-genui
pnpm install
pnpm build
pnpm test

# 在 Harness 仓库目录，或任意 PATH 上有 dsh 的环境：
dsh plugin --profile web add /path/to/dsh-genui
dsh --profile web --dump-config   # 应出现 "# == dsh-genui"
dsh --profile web
```

卸载：

```sh
dsh plugin --profile web remove dsh-genui
```

## 行为说明

| 部分 | 行为 |
|---|---|
| **Host**（`lib/index.js`） | `genPrompt('Vue', materialsMeta)` → `systemPrompt.section({ name: 'genui:cards' })` |
| **Client**（`lib/client.js`） | 遮蔽 `assistant-step`；按 `` ```schemaJson `` `` 切分文本；渲染 `<dsh-genui-card>`（Vue `GenuiRenderer`） |

会话日志不变：schema 仍保留在助手消息文本内（模型可见 ⟺ 已记录）。

Vue **内联**在 client bundle 中（非 Harness 平台模块）。`customActions` 等自定义元素属性由 React 通过 element properties 设置（React 18 若走 attribute 会把对象序列化为字符串）。

## 已知限制

- 遮蔽**整条**助手消息行；需关注上游 `AssistantNodeView` 变更。
- Client bundle 体积较大（未压缩约 11MB），因内联了 TinyVue 与物料。
- GenUI 提示词较长——建议保持该 bundle 为可选安装。
- Peer API（`ui-primitives`、插槽等）来自运行中的 web profile，非本包提供。
- 自定义元素使用 **light DOM**（`shadowRoot: false`），以便 TinyVue teleport 与主题 CSS 生效。

## 开发

```sh
pnpm test     # splitAssistantText
pnpm build    # 重新生成 lib/
```

更多场景与效果说明见 [docs/promotion.md](docs/promotion.md)。
