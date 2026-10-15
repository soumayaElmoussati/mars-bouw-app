import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { lang, setLang, t } = useLang()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      // Redirection gérée par <Navigate> dans App.jsx
    } catch (err) {
      setError(err.message || t.login.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.langBar}>
        <button className={`${styles.langBtn} ${lang === 'nl' ? styles.langActive : ''}`} onClick={() => setLang('nl')}>NL</button>
        <span className={styles.langSep}>|</span>
        <button className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`} onClick={() => setLang('en')}>EN</button>
      </div>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src="/logo.png" alt="Mars Bouw" className={styles.logo} />
        </div>

        <div className={styles.headings}>
          <h1 className={styles.title}>{t.login.title}</h1>
          <p className={styles.subtitle}>{t.login.subtitle}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>{t.login.email}</label>
            <div className={styles.inputWrap}>
              <Mail size={15} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="naam@marsbouw.nl"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.login.password}</label>
            <div className={styles.inputWrap}>
              <Lock size={15} className={styles.inputIcon} />
              <input
                type={showPwd ? 'text' : 'password'}
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className={styles.forgotRow}>
              <a href="#" className={styles.forgot}>{t.login.forgot}</a>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : t.login.button}
          </button>
        </form>

        <p className={styles.hint}>Demo: admin@gmail.com / admin123</p>
      </div>
    </div>
  )
}