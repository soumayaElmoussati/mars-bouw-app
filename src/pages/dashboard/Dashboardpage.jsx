import { useMemo } from 'react'
import {
  Users, FolderKanban, Package, Euro, AlertTriangle,
  CheckSquare, TrendingUp, TrendingDown, Clock,
  CalendarDays, ArrowRight, Zap, ShoppingCart
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clientsSeed } from '../../data/clientsSeed'
import { projectsSeed } from '../../data/projectsSeed'
import { tasksSeed } from '../../data/tasksSeed'
import { stockSeed } from '../../data/stockSeed'
import { offertesSeed, factuurSeed, uitgavenSeed } from '../../data/financeSeed'
import { planningSeed } from '../../data/planningSeed'
import { useNavigate } from 'react-router-dom'
import styles from './DashboardPage.module.css'

function fmtEur(n) { return '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 0 }) }
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-'); return `${day}-${m}-${y}`
}
function calcTotalIncl(lines) {
  return lines.reduce((s, l) => s + l.qty * l.unitPrice * (1 + l.btw / 100), 0)
}

export default function DashboardPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const navigate = useNavigate()

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeProjects   = projectsSeed.filter(p => p.status === 'in_progress')
    const totalBudget      = activeProjects.reduce((s,p) => s + (+p.budget||0), 0)
    const totalSpent       = activeProjects.reduce((s,p) => s + (+p.spentBudget||0), 0)
    const openTasks        = tasksSeed.filter(t => t.status !== 'done')
    const urgentTasks      = tasksSeed.filter(t => t.priority === 'urgent' && t.status !== 'done')
    const lowStockItems    = stockSeed.filter(s => s.quantity <= s.minStock)
    const outOfStock       = stockSeed.filter(s => s.quantity === 0)
    const openInvoices     = factuurSeed.filter(f => f.status === 'openstaand' || f.status === 'gedeeltelijk')
    const openAmount       = openInvoices.reduce((s,f) => {
      const total = calcTotalIncl(f.lines)
      const paid  = (f.payments||[]).reduce((ps,p) => ps+p.amount, 0)
      return s + (total - paid)
    }, 0)
    const totalRevenue     = factuurSeed.reduce((s,f) => s + calcTotalIncl(f.lines), 0)
    const totalExpenses    = uitgavenSeed.reduce((s,u) => s + u.amount, 0)
    const overdueTasks     = tasksSeed.filter(t => t.dueDate && t.dueDate < new Date().toISOString().slice(0,10) && t.status !== 'done')

    // This week planning
    const today = new Date()
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay()+6)%7))
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const monStr = monday.toISOString().slice(0,10)
    const sunStr = sunday.toISOString().slice(0,10)
    const weekEvents = planningSeed.filter(e => e.startDate <= sunStr && e.endDate >= monStr)

    return {
      clients: clientsSeed.length,
      activeProjects: activeProjects.length,
      totalProjects: projectsSeed.length,
      totalBudget, totalSpent,
      budgetPct: totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0,
      openTasks: openTasks.length,
      urgentTasks: urgentTasks.length,
      overdueTasks: overdueTasks.length,
      lowStockItems: lowStockItems.length,
      outOfStock: outOfStock.length,
      openAmount,
      totalRevenue,
      totalExpenses,
      result: totalRevenue - totalExpenses,
      weekEvents: weekEvents.length,
      openInvoices: openInvoices.length,
    }
  }, [])

  // ── Recent activity ─────────────────────────────────────────────────────────
  const recentProjects = projectsSeed.filter(p => p.status === 'in_progress').slice(0, 4)
  const urgentTasks    = tasksSeed.filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'done').slice(0, 5)
  const lowStock       = stockSeed.filter(s => s.quantity <= s.minStock).slice(0, 4)
  const upcomingEvents = planningSeed.sort((a,b) => a.startDate.localeCompare(b.startDate)).slice(0, 4)

  const greeting = (() => {
    const h = new Date().getHours()
    if (lang === 'nl') return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()

  const today = new Date()
  const dateStr = today.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div className={styles.page}>

      {/* Hero greeting */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.greeting}>{greeting}, Jan 👋</p>
          <p className={styles.dateStr}>{dateStr}</p>
        </div>
        <div className={styles.heroRight}>
          {stats.urgentTasks > 0 && (
            <div className={styles.heroBadge} style={{ background: '#FFEBEE', color: '#B71C1C', borderColor: '#EF9A9A' }}>
              <Zap size={14} /> {stats.urgentTasks} {lbl('urgente taken','urgent tasks')}
            </div>
          )}
          {stats.lowStockItems > 0 && (
            <div className={styles.heroBadge} style={{ background: '#FFF3E0', color: '#E65100', borderColor: '#FFCC80' }}>
              <AlertTriangle size={14} /> {stats.lowStockItems} {lbl('laag stock','low stock')}
            </div>
          )}
          {stats.openInvoices > 0 && (
            <div className={styles.heroBadge} style={{ background: '#E3F2FD', color: '#1565C0', borderColor: '#90CAF9' }}>
              <Euro size={14} /> {stats.openInvoices} {lbl('open facturen','open invoices')}
            </div>
          )}
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className={styles.kpiRow}>
        <KPICard icon={Users}        label={lbl('Klanten','Clients')}             value={stats.clients}                 color="blue"   onClick={() => navigate('/clients')} />
        <KPICard icon={FolderKanban} label={lbl('Actieve projecten','Active')}    value={`${stats.activeProjects}/${stats.totalProjects}`} color="orange" onClick={() => navigate('/projects')} />
        <KPICard icon={CheckSquare}  label={lbl('Open taken','Open tasks')}       value={stats.openTasks}               color={stats.urgentTasks > 0 ? 'red' : 'sky'} sub={stats.urgentTasks > 0 ? `${stats.urgentTasks} urgent` : ''} onClick={() => navigate('/tasks')} />
        <KPICard icon={CalendarDays} label={lbl('Deze week','This week')}         value={stats.weekEvents}              color="purple" sub={lbl('activiteiten','activities')} onClick={() => navigate('/planning')} />
        <KPICard icon={Package}      label={lbl('Laag stock','Low stock')}        value={stats.lowStockItems}           color={stats.outOfStock > 0 ? 'red' : 'orange'} sub={stats.outOfStock > 0 ? `${stats.outOfStock} uitverkocht` : ''} onClick={() => navigate('/stock')} />
        <KPICard icon={Euro}         label={lbl('Openstaand','Outstanding')}      value={fmtEur(stats.openAmount)}      color="teal"   onClick={() => navigate('/invoices')} />
      </div>

      {/* Budget overview */}
      <div className={styles.budgetCard}>
        <div className={styles.budgetHeader}>
          <div>
            <h3 className={styles.cardTitle}>{lbl('Budget actieve projecten','Active projects budget')}</h3>
            <p className={styles.cardSub}>{stats.activeProjects} {lbl('lopende projecten','projects in progress')}</p>
          </div>
          <button className={styles.linkBtn} onClick={() => navigate('/projects')}>
            {lbl('Alle projecten','All projects')} <ArrowRight size={13} />
          </button>
        </div>
        <div className={styles.budgetNumbers}>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>{lbl('Totaal budget','Total budget')}</span>
            <span className={styles.budgetVal}>{fmtEur(stats.totalBudget)}</span>
          </div>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>{lbl('Besteed','Spent')}</span>
            <span className={styles.budgetVal} style={{ color: stats.budgetPct > 80 ? '#C8102E' : '#E65100' }}>{fmtEur(stats.totalSpent)}</span>
          </div>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>{lbl('Resterend','Remaining')}</span>
            <span className={styles.budgetVal} style={{ color: '#2E7D32' }}>{fmtEur(stats.totalBudget - stats.totalSpent)}</span>
          </div>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>%</span>
            <span className={styles.budgetVal} style={{ color: stats.budgetPct > 80 ? '#C8102E' : '#1A3E6F' }}>{stats.budgetPct.toFixed(0)}%</span>
          </div>
        </div>
        <div className={styles.masterBar}>
          <div className={styles.masterFill} style={{
            width: Math.min(100, stats.budgetPct) + '%',
            background: stats.budgetPct > 90 ? '#C8102E' : stats.budgetPct > 70 ? '#FB8C00' : '#1A3E6F'
          }} />
        </div>
      </div>

      {/* Finance summary */}
      <div className={styles.financeRow}>
        <div className={styles.finCard} style={{ borderLeftColor: '#2E7D32' }}>
          <TrendingUp size={18} className={styles.finIcon} style={{ color: '#2E7D32' }} />
          <div>
            <p className={styles.finLabel}>{lbl('Omzet (gefactureerd)','Revenue (invoiced)')}</p>
            <p className={styles.finVal}>{fmtEur(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className={styles.finCard} style={{ borderLeftColor: '#C8102E' }}>
          <TrendingDown size={18} className={styles.finIcon} style={{ color: '#C8102E' }} />
          <div>
            <p className={styles.finLabel}>{lbl('Uitgaven','Expenses')}</p>
            <p className={styles.finVal}>{fmtEur(stats.totalExpenses)}</p>
          </div>
        </div>
        <div className={styles.finCard} style={{ borderLeftColor: stats.result >= 0 ? '#2E7D32' : '#C8102E' }}>
          <Euro size={18} className={styles.finIcon} style={{ color: stats.result >= 0 ? '#2E7D32' : '#C8102E' }} />
          <div>
            <p className={styles.finLabel}>{lbl('Resultaat','Result')}</p>
            <p className={styles.finVal} style={{ color: stats.result >= 0 ? '#2E7D32' : '#C8102E' }}>{fmtEur(stats.result)}</p>
          </div>
        </div>
      </div>

      {/* 4-panel grid */}
      <div className={styles.grid}>

        {/* Active projects */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{lbl('Lopende projecten','Active projects')}</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/projects')}>{lbl('Alles','All')} <ArrowRight size={12} /></button>
          </div>
          <div className={styles.panelBody}>
            {recentProjects.map(p => {
              const pct = +p.budget > 0 ? Math.min(100, (+p.spentBudget / +p.budget) * 100) : 0
              const tasksDone  = p.tasks?.filter(t => t.done).length || 0
              const tasksTotal = p.tasks?.length || 0
              const taskPct    = tasksTotal > 0 ? tasksDone / tasksTotal * 100 : 0
              const barColor   = pct > 90 ? '#C8102E' : pct > 70 ? '#FB8C00' : '#1A3E6F'
              return (
                <div key={p.id} className={styles.projectRow}>
                  <div className={styles.projectInfo}>
                    <span className={styles.projectName}>{p.name}</span>
                    <span className={styles.projectClient}>{p.clientName}</span>
                  </div>
                  <div className={styles.projectBars}>
                    <div className={styles.miniBarWrap}>
                      <span className={styles.miniBarLabel}>{lbl('Budget','Budget')}</span>
                      <div className={styles.miniBar}><div style={{ width: pct+'%', background: barColor }} /></div>
                      <span className={styles.miniBarPct}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className={styles.miniBarWrap}>
                      <span className={styles.miniBarLabel}>{lbl('Taken','Tasks')}</span>
                      <div className={styles.miniBar}><div style={{ width: taskPct+'%', background: '#43A047' }} /></div>
                      <span className={styles.miniBarPct}>{tasksDone}/{tasksTotal}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Urgent tasks */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{lbl('Prioritaire taken','Priority tasks')}</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/tasks')}>{lbl('Alles','All')} <ArrowRight size={12} /></button>
          </div>
          <div className={styles.panelBody}>
            {urgentTasks.length === 0
              ? <p className={styles.empty}>{lbl('Geen urgente taken 🎉','No urgent tasks 🎉')}</p>
              : urgentTasks.map(t => {
                const PCOL = { urgent:'#B71C1C', high:'#E65100', medium:'#1565C0', low:'#558B2F' }
                const PBG  = { urgent:'#FFEBEE', high:'#FFF3E0', medium:'#E3F2FD', low:'#F1F8E9' }
                const overdue = t.dueDate && t.dueDate < new Date().toISOString().slice(0,10)
                return (
                  <div key={t.id} className={styles.taskRow}>
                    <span className={styles.taskPri} style={{ background: PBG[t.priority], color: PCOL[t.priority] }}>{t.priority}</span>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{t.title}</span>
                      {t.dueDate && <span className={styles.taskDue} style={{ color: overdue ? '#C8102E' : 'var(--grey-500)' }}>
                        <Clock size={10} /> {fmtDate(t.dueDate)}{overdue ? ' ⚠' : ''}
                      </span>}
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Low stock */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{lbl('Laag voorraad','Low stock')}</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/stock')}>{lbl('Alles','All')} <ArrowRight size={12} /></button>
          </div>
          <div className={styles.panelBody}>
            {lowStock.length === 0
              ? <p className={styles.empty}>{lbl('Voorraad op peil ✓','Stock is fine ✓')}</p>
              : lowStock.map(s => {
                const pct = s.maxStock > 0 ? Math.min(100, s.quantity / s.maxStock * 100) : 0
                const isOut = s.quantity === 0
                return (
                  <div key={s.id} className={styles.stockRow}>
                    <div className={styles.stockInfo}>
                      <span className={styles.stockName}>{s.name}</span>
                      <span className={styles.stockSub}>{s.location}</span>
                    </div>
                    <div className={styles.stockRight}>
                      <span className={styles.stockQty} style={{ color: isOut ? '#C8102E' : '#E65100' }}>
                        {isOut ? lbl('Uit','Out') : `${s.quantity} ${s.unit}`}
                      </span>
                      <div className={styles.stockBar}>
                        <div style={{ width: pct+'%', background: isOut ? '#C8102E' : '#FB8C00' }} />
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Upcoming planning */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{lbl('Aankomende activiteiten','Upcoming activities')}</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/planning')}>{lbl('Planning','Planning')} <ArrowRight size={12} /></button>
          </div>
          <div className={styles.panelBody}>
            {upcomingEvents.map(e => (
              <div key={e.id} className={styles.eventRow}>
                <div className={styles.eventColor} style={{ background: e.color }} />
                <div className={styles.eventInfo}>
                  <span className={styles.eventTitle}>{e.title}</span>
                  <span className={styles.eventMeta}>
                    <CalendarDays size={10} /> {fmtDate(e.startDate)}
                    {e.assignee && <> · {e.assignee}</>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function KPICard({ icon: Icon, label, value, color, sub, onClick }) {
  const COLORS = {
    blue:   { border: '#1A3E6F', bg: '#EEF5FF', text: '#1A3E6F' },
    orange: { border: '#FB8C00', bg: '#FFF8F0', text: '#E65100' },
    red:    { border: '#C8102E', bg: '#FFF0F3', text: '#C8102E' },
    sky:    { border: '#1E88E5', bg: '#EBF5FF', text: '#1565C0' },
    purple: { border: '#7B1FA2', bg: '#F3E5F5', text: '#6A1B9A' },
    teal:   { border: '#00838F', bg: '#E0F7FA', text: '#006064' },
    green:  { border: '#43A047', bg: '#E8F5E9', text: '#2E7D32' },
  }
  const c = COLORS[color] || COLORS.blue
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: c.border, cursor: 'pointer' }} onClick={onClick}>
      <div className={styles.kpiIconWrap} style={{ background: c.bg }}>
        <Icon size={18} style={{ color: c.border }} />
      </div>
      <div className={styles.kpiInfo}>
        <span className={styles.kpiValue} style={{ color: c.text }}>{value}</span>
        <span className={styles.kpiLabel}>{label}</span>
        {sub && <span className={styles.kpiSub}>{sub}</span>}
      </div>
    </div>
  )
}