import { Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '../../i18n/LanguageContext'
import styles from './Header.module.css'

export default function Header({ onLogout }) {
  const { lang, setLang, t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.left} />

      <div className={styles.right}>
        {/* Language switcher */}
        <div className={styles.langSwitch}>
          <button
            className={`${styles.langBtn} ${lang === 'nl' ? styles.langActive : ''}`}
            onClick={() => setLang('nl')}
          >NL</button>
          <span className={styles.langDivider}>|</span>
          <button
            className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
            onClick={() => setLang('en')}
          >EN</button>
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn} title={t.header.notifications}>
          <Bell size={18} />
          <span className={styles.badge}>3</span>
        </button>

        {/* User menu */}
        <div className={styles.userMenu}>
          <button
            className={styles.userBtn}
            onClick={() => setMenuOpen(o => !o)}
          >
            <div className={styles.avatar}>JD</div>
            <span className={styles.userName}>Jan de Vries</span>
            <ChevronDown size={14} className={menuOpen ? styles.chevronOpen : ''} />
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <button className={styles.dropItem}>
                <User size={14} /> {t.header.profile}
              </button>
              <div className={styles.dropDivider} />
              <button
                className={`${styles.dropItem} ${styles.dropItemRed}`}
                onClick={() => { setMenuOpen(false); onLogout() }}
              >
                <LogOut size={14} /> {t.header.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
