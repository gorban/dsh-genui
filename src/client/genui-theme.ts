import { RepairJsonState, repairJson } from '@opentiny/genui-sdk-core'

/** DSH dark-mode marker on `<body>`. */
export const DARK_ATTR = 'data-ds-dark-theme'

/** Whether the DSH host is currently in dark mode. */
export function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.body?.hasAttribute(DARK_ATTR) === true
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Copy the schema and set the chart theme on every HuiCharts component.
 * Charts render to canvas and do not inherit the ConfigProvider CSS theme.
 */
export function applyChartTheme(value: unknown, dark: boolean): unknown {
  const themeName = dark ? 'cloud-dark' : 'cloud-light'

  function walk(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(walk)
    if (!isPlainObject(node)) return node

    const next: Record<string, unknown> = { ...node }
    for (const [key, child] of Object.entries(node)) {
      next[key] = walk(child)
    }

    const componentName = typeof next.componentName === 'string' ? next.componentName : ''
    if (componentName.startsWith('TinyHuicharts')) {
      const props = isPlainObject(next.props) ? { ...next.props } : {}
      const options = isPlainObject(props.options) ? { ...props.options } : {}
      options.theme = themeName
      next.props = { ...props, options }
    }

    return next
  }

  return walk(value)
}

/**
 * Parse with the SDK's stream repairer so charts can receive a themed schema
 * before the final chunk. If repair cannot produce an object, hand the
 * original string back to GenuiRenderer and let it show its normal error.
 */
export function parseThemedContent(
  content: string | Record<string, unknown>,
  dark: boolean,
  isJsonComplete = true,
): { content: string | Record<string, unknown>; isJsonComplete: boolean } {
  if (typeof content !== 'string') {
    return { content: applyChartTheme(content, dark) as Record<string, unknown>, isJsonComplete }
  }
  if (!content.trim()) return { content: {}, isJsonComplete: true }

  const repaired = repairJson(content)
  if (!repaired.value || typeof repaired.value !== 'object') {
    return { content, isJsonComplete }
  }

  return {
    content: applyChartTheme(repaired.value, dark) as Record<string, unknown>,
    isJsonComplete: repaired.state === RepairJsonState.SUCCESS,
  }
}
