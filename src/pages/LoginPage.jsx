import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, Users, BarChart3, Shield } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { lang, setLang, t } = useLang()
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err) {
      setError(err.message || (lang === 'nl' ? 'Inloggen mislukt' : 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  const features = lang === 'nl'
    ? [
        { icon: Building2,  text: 'Projectbeheer & planning' },
        { icon: Users,      text: 'Klanten & onderaannemers' },
        { icon: BarChart3,  text: 'Financiën & rapporten' },
        { icon: Shield,     text: 'Veilig & betrouwbaar' },
      ]
    : [
        { icon: Building2,  text: 'Project management & planning' },
        { icon: Users,      text: 'Clients & subcontractors' },
        { icon: BarChart3,  text: 'Finance & reports' },
        { icon: Shield,     text: 'Secure & reliable' },
      ]

  return (
    <div className={styles.page}>

      {/* ── Left panel ─────────────────────────── */}
      <div className={styles.leftPanel}>
        {/* Decorative circles */}
        <div className={styles.circle1}/>
        <div className={styles.circle2}/>
        <div className={styles.circle3}/>

        <div className={styles.leftContent}>
          {/* Logo */}
          <div className={styles.leftLogo}>
            <img src="/logo.png" alt="Mars Bouw" className={styles.leftLogoImg}/>
          </div>

          {/* Tagline */}
          <div className={styles.tagline}>
            <h2 className={styles.taglineTitle}>
              {lang === 'nl' ? 'Bouw slimmer,' : 'Build smarter,'}<br/>
              {lang === 'nl' ? 'beheer beter.' : 'manage better.'}
            </h2>
            <p className={styles.taglineSub}>
              {lang === 'nl'
                ? 'Het complete platform voor bouwbedrijfsbeheer'
                : 'The complete platform for construction management'}
            </p>
          </div>

          {/* Features */}
          <div className={styles.features}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className={styles.feature}>
                <div className={styles.featureIcon}><Icon size={16}/></div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom brand */}
        <div className={styles.leftBrand}>
          © {new Date().getFullYear()} Mars Bouw · Amsterdam
        </div>
      </div>

      {/* ── Right panel ────────────────────────── */}
      <div className={styles.rightPanel}>

        {/* Lang toggle */}
        <div className={styles.langBar}>
          <button
            className={`${styles.langBtn} ${lang === 'nl' ? styles.langActive : ''}`}
            onClick={() => setLang('nl')}>NL</button>
          <span className={styles.langSep}>|</span>
          <button
            className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
            onClick={() => setLang('en')}>EN</button>
        </div>

        {/* Form card */}
        <div className={styles.formWrap}>
          {/* Mobile logo */}
          <div className={styles.mobileLogo}>
            <img src="/logo.png" alt="Mars Bouw" className={styles.mobileLogoImg}/>
          </div>

          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>
              {lang === 'nl' ? 'Welkom terug' : 'Welcome back'}
            </h1>
            <p className={styles.formSub}>
              {lang === 'nl' ? 'Log in op uw account' : 'Sign in to your account'}
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorBanner}>
                <span>⚠</span> {error}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>
                {lang === 'nl' ? 'E-mailadres' : 'Email address'}
              </label>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.inputIcon}/>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="naam@marsbouw.nl"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  {lang === 'nl' ? 'Wachtwoord' : 'Password'}
                </label>
                <a href="#" className={styles.forgot}>
                  {lang === 'nl' ? 'Vergeten?' : 'Forgot?'}
                </a>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.inputIcon}/>
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
                  {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? <span className={styles.spinner}/>
                : <>
                    {lang === 'nl' ? 'Inloggen' : 'Sign in'}
                    <ArrowRight size={16} className={styles.btnArrow}/>
                  </>
              }
            </button>
          </form>

          <div className={styles.demoHint}>
            <span className={styles.demoDot}/>
            Demo: admin@marsbouw.nl / admin
          </div>
        </div>
      </div>
    </div>
  )
}