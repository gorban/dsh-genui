import { useState } from 'react'
import { useI18n } from './i18n'

const INSTALL_CMD = 'dsh plugin --profile web add dsh-genui'

export default function App() {
  const { t, toggleLocale } = useI18n()

  return (
    <>
      <Header onToggleLocale={toggleLocale} langLabel={t.nav.langToggle} />
      <main>
        <Hero />
        <Tags />
        <Examples />
        <Compare />
        <Features />
        <HowItWorks />
        <Install />
        <Faq />
      </main>
      <Footer />
    </>
  )
}

function Header({
  onToggleLocale,
  langLabel,
}: {
  onToggleLocale: () => void
  langLabel: string
}) {
  return (
    <header className="header">
      <a href="#" className="logo" aria-label="dsh-genui home">
        <span className="logo-grid" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
        dsh-genui
      </a>
      <nav className="nav">
        <a href="https://github.com/lhuans/dsh-genui" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="https://www.npmjs.com/package/dsh-genui" target="_blank" rel="noopener noreferrer">
          npm
        </a>
        <button type="button" onClick={onToggleLocale}>
          {langLabel}
        </button>
      </nav>
    </header>
  )
}

function Hero() {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(INSTALL_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="hero">
      <h1>
        {t.hero.titleBefore}
        <span className="accent">{t.hero.titleAccent}</span>
        {t.hero.titleAfter}
      </h1>
      <p className="subtitle">{t.hero.subtitle}</p>
      <div className="install-block">
        <div className="install-bar">
          <code>{INSTALL_CMD}</code>
          <button type="button" className="copy-btn" onClick={handleCopy}>
            {copied ? t.hero.copied : t.hero.copy}
          </button>
        </div>
        <p className="install-hint">{t.hero.installHint}</p>
      </div>
    </section>
  )
}

function Tags() {
  const { t } = useI18n()
  return (
    <div className="tags">
      {t.tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  )
}

function Examples() {
  const { t } = useI18n()
  const items = [
    { ...t.examples.calculator, img: 'computer.png' },
    { ...t.examples.form, img: 'form.png' },
    { ...t.examples.chart, img: 'chat.png' },
  ]

  return (
    <section className="section">
      <div className="container">
        <h2>{t.examples.title}</h2>
        <div className="examples-grid">
          {items.map((item) => (
            <article key={item.title} className="example-card">
              <img src={item.img} alt={item.title} loading="lazy" width={800} height={450} />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Compare() {
  const { t } = useI18n()
  return (
    <section className="section">
      <div className="container">
        <h2>{t.compare.title}</h2>
        <table className="compare-table">
          <thead>
            <tr>
              {t.compare.headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.compare.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Features() {
  const { t } = useI18n()
  return (
    <section className="section">
      <div className="container">
        <h2>{t.features.title}</h2>
        <div className="features-grid">
          {t.features.items.map((item) => (
            <div key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <p className="prompt">{item.prompt}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { t } = useI18n()
  return (
    <section className="section">
      <div className="container">
        <h2>{t.howItWorks.title}</h2>
        <div className="text-block">
          <p>{t.howItWorks.body}</p>
        </div>
      </div>
    </section>
  )
}

function Install() {
  const { t } = useI18n()
  return (
    <section className="section">
      <div className="container">
        <h2>{t.install.title}</h2>
        <div className="text-block">
          <ol>
            {t.install.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>{t.install.verify}</p>
          <p>{t.install.remove}</p>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const { t } = useI18n()
  return (
    <section className="section">
      <div className="container">
        <h2>{t.faq.title}</h2>
        <div className="faq-list">
          {t.faq.items.map((item) => (
            <div key={item.q} className="faq-item">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <p>{t.footer.license}</p>
      <p className="footer-links">
        <a href="https://github.com/opentiny/genui-sdk" target="_blank" rel="noopener noreferrer">
          OpenTiny GenUI
        </a>
        <a
          href="https://github.com/deepseek-ai/deepseek-harness"
          target="_blank"
          rel="noopener noreferrer"
        >
          DeepSeek Harness
        </a>
        <a href="https://dshmarket.com/" target="_blank" rel="noopener noreferrer">
          Plugin Market
        </a>
      </p>
    </footer>
  )
}
