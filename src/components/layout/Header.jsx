import { LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useLang } from '../../i18n/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import styles from './Header.module.css'

export default function Header({ onLogout }) {
  const { lang, setLang } = useLang()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const firstName = user?.firstName || user?.first_name || user?.name?.split(' ')[0] || ''
  const lastName  = user?.lastName  || user?.last_name  || user?.name?.split(' ').slice(1).join(' ') || ''
  const fullName  = user?.name || `${firstName} ${lastName}`.trim() || 'Gebruiker'
  const email     = user?.email || ''
  const role      = user?.role  || 'admin'
  const initials  = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'

  const lbl = (nl, en) => lang === 'nl' ? nl : en

  return (
    <header className={styles.header}>
      <div className={styles.left}/>
      <div className={styles.right}>

        {/* Language */}
        <div className={styles.langSwitch}>
          <button className={`${styles.langBtn} ${lang === 'nl' ? styles.langActive : ''}`} onClick={() => setLang('nl')}>NL</button>
          <span className={styles.langDivider}>|</span>
          <button className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`} onClick={() => setLang('en')}>EN</button>
        </div>

        {/* User menu */}
        <div className={styles.userMenu} ref={menuRef}>
          <button className={styles.userBtn} onClick={() => setMenuOpen(o => !o)}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{fullName}</span>
              <span className={styles.userRole}>{role}</span>
            </div>
            <ChevronDown size={14} className={menuOpen ? styles.chevronOpen : styles.chevron}/>
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              {/* User card */}
              <div className={styles.dropUserCard}>
                <div className={styles.dropAvatar}>{initials}</div>
                <div className={styles.dropUserInfo}>
                  <span className={styles.dropUserName}>{fullName}</span>
                  <span className={styles.dropUserEmail}>{email}</span>
                  <span className={styles.dropUserRole}>{role}</span>
                </div>
              </div>
              <div className={styles.dropDivider}/>
              <button
                className={`${styles.dropItem} ${styles.dropItemRed}`}
                onClick={() => { setMenuOpen(false); onLogout() }}>
                <LogOut size={14}/>{lbl('Uitloggen','Logout')}
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}