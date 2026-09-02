import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { en, zh, type Locale, type Messages } from './messages'

interface I18nContextValue {
  locale: Locale
  t: Messages
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const messages: Record<Locale, Messages> = { en, zh }

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('dsh-genui-locale')
    if (saved === 'en' || saved === 'zh') return saved
    return navigator.language.startsWith('zh') ? 'zh' : 'en'
  })

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === 'en' ? 'zh' : 'en'
      localStorage.setItem('dsh-genui-locale', next)
      document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
      return next
    })
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t: messages[locale], toggleLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
