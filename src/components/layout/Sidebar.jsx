import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderKanban, CalendarDays,
  Timer, CheckSquare, Package, FileText, Camera,
  HardHat, BarChart2, ClipboardList, ListChecks,
  GanttChartSquare, ContactRound, Settings
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import styles from './Sidebar.module.css'

const NAV_GROUPS = [
  {
    label_nl: 'Algemeen', label_en: 'General',
    items: [
      { key: 'dashboard',  icon: LayoutDashboard,  to: '/dashboard' },
    ]
  },
  {
    label_nl: 'Projectbeheer', label_en: 'Project mgmt',
    items: [
      { key: 'clients',        icon: Users,           to: '/clients' },
      { key: 'projects',       icon: FolderKanban,    to: '/projects' },
      { key: 'crm',            icon: ContactRound,    to: '/crm' },
    ]
  },
  {
    label_nl: 'Planning & Werk', label_en: 'Planning & Work',
    items: [
      { key: 'gantt',          icon: GanttChartSquare, to: '/gantt' },
      { key: 'planning',       icon: CalendarDays,    to: '/planning' },
      { key: 'timetracking',   icon: Timer,           to: '/timetracking' },
      { key: 'tasks',          icon: CheckSquare,     to: '/tasks' },
      { key: 'werkbon',        icon: ClipboardList,   to: '/werkbon' },
      { key: 'checklist',      icon: ListChecks,      to: '/checklist' },
    ]
  },
  {
    label_nl: 'Financiën & Inkoop', label_en: 'Finance & Procurement',
    items: [
      { key: 'invoices',       icon: FileText,        to: '/invoices' },
      { key: 'stock',          icon: Package,         to: '/stock' },
      { key: 'subcontractors', icon: HardHat,         to: '/subcontractors' },
    ]
  },
  {
    label_nl: 'Documentatie', label_en: 'Documentation',
    items: [
      { key: 'photos',         icon: Camera,          to: '/photos' },
      { key: 'reports',        icon: BarChart2,       to: '/reports' },
    ]
  },
]

export default function Sidebar() {
  const { lang, t } = useLang()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/logo_dark.png" alt="Mars Bouw" className={styles.logoImg} />
      </div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={styles.group}>
            <p className={styles.groupLabel}>{lang === 'nl' ? group.label_nl : group.label_en}</p>
            <ul className={styles.navList}>
              {group.items.map(({ key, icon: Icon, to }) => (
                <li key={key}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  >
                    <Icon size={16} className={styles.navIcon} />
                    <span>{t.nav[key] || key}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>


    </aside>
  )
}