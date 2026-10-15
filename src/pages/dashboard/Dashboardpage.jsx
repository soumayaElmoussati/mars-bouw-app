import { useState, useEffect } from 'react'
import {
  Users, FolderKanban, Package, Euro, AlertTriangle,
  CheckSquare, TrendingUp, TrendingDown, Clock,
  CalendarDays, ArrowRight, Zap, ShoppingCart
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import styles from './DashboardPage.module.css'

function fmtEur(n) { return '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 0 }) }
function fmtDate(d) {
  if (!d) return '—'
  return d.toString().slice(0, 10).split('-').reverse().join('-')
}

export default function DashboardPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const navigate = useNavigate()

  const [stats,          setStats]          = useState(null)
  const [urgentTasks,    setUrgentTasks]    = useState([])
  const [lowStock,       setLowStock]       = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [dashData, tasks, stock, planning] = await Promise.all([
        api.get('/dashboard'),
        api.get('/tasks?status=todo,in_progress'),
        api.get('/stock/items'),
        api.get('/planning'),
      ])

      setStats(dashData)
      console.log("dashData", dashData)

      // Urgent/high priority tasks not done
      const urgent = tasks
        .filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'done')
        .slice(0, 5)
      setUrgentTasks(urgent)

      // Low stock items
      const low = stock
        .filter(s => +s.quantity <= +s.min_stock && +s.min_stock > 0)
        .slice(0, 4)
      setLowStock(low)

      // Upcoming planning events (next 30 days)
      const today = new Date().toISOString().slice(0, 10)
      const upcoming = planning
        .filter(e => e.end_date >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 4)
      setUpcomingEvents(upcoming)

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, border:'3px solid #e0e0e0', borderTopColor:'#1A3E6F', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:'var(--grey-500)', fontSize:14 }}>{lbl('Dashboard laden…','Loading dashboard…')}</p>
    </div>
  )

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:12 }}>
      <AlertTriangle size={32} style={{ color:'#C8102E' }}/>
      <p style={{ color:'#C8102E' }}>{error}</p>
      <button onClick={load} style={{ padding:'8px 20px', background:'#1A3E6F', color:'white', border:'none', borderRadius:8, cursor:'pointer' }}>
        {lbl('Opnieuw proberen','Retry')}
      </button>
    </div>
  )

  const { clients, projects, tasks, stock, finance, activeProjects } = stats

  // Budget stats from active projects
  const totalBudget = activeProjects.reduce((s, p) => s + (+p.budget || 0), 0)
  const totalSpent  = activeProjects.reduce((s, p) => s + (+p.spent_budget || 0), 0)
  const budgetPct   = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0

  // Greeting
  const greeting = (() => {
    const h = new Date().getHours()
    if (lang === 'nl') return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()
  const today = new Date()
  const dateStr = today.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className={styles.page}>

      {/* Hero greeting */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.greeting}>{greeting}, Jan 👋</p>
          <p className={styles.dateStr}>{dateStr}</p>
        </div>
        <div className={styles.heroRight}>
          {tasks.urgent > 0 && (
            <div className={styles.heroBadge} style={{ background:'#FFEBEE', color:'#B71C1C', borderColor:'#EF9A9A' }}
              onClick={() => navigate('/tasks')} role="button">
              <Zap size={14}/> {tasks.urgent} {lbl('urgente taken','urgent tasks')}
            </div>
          )}
          {stock.lowStock > 0 && (
            <div className={styles.heroBadge} style={{ background:'#FFF3E0', color:'#E65100', borderColor:'#FFCC80' }}
              onClick={() => navigate('/stock')} role="button">
              <AlertTriangle size={14}/> {stock.lowStock} {lbl('laag stock','low stock')}
            </div>
          )}
          {finance.openInvoices > 0 && (
            <div className={styles.heroBadge} style={{ background:'#E3F2FD', color:'#1565C0', borderColor:'#90CAF9' }}
              onClick={() => navigate('/invoices')} role="button">
              <Euro size={14}/> {finance.openInvoices} {lbl('open facturen','open invoices')}
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <KPICard icon={Users}        label={lbl('Klanten','Clients')}          value={clients.total}                       color="blue"   sub={`${clients.active} ${lbl('actief','active')}`}  onClick={() => navigate('/clients')} />
        <KPICard icon={FolderKanban} label={lbl('Actieve projecten','Active')} value={`${projects.active}/${projects.total}`} color="orange" onClick={() => navigate('/projects')} />
        <KPICard icon={CheckSquare}  label={lbl('Open taken','Open tasks')}    value={tasks.open}                          color={tasks.urgent > 0 ? 'red' : 'sky'} sub={tasks.urgent > 0 ? `${tasks.urgent} urgent` : ''} onClick={() => navigate('/tasks')} />
        <KPICard icon={CalendarDays} label={lbl('Planning','Planning')}         value={upcomingEvents.length}              color="purple" sub={lbl('aankomend','upcoming')} onClick={() => navigate('/planning')} />
        <KPICard icon={Package}      label={lbl('Laag stock','Low stock')}      value={stock.lowStock}                     color={stock.lowStock > 0 ? 'red' : 'orange'} sub={stock.outOfStock > 0 ? `${stock.outOfStock} ${lbl('uitverkocht','out')}` : ''} onClick={() => navigate('/stock')} />
        <KPICard icon={Euro}         label={lbl('Openstaand','Outstanding')}    value={fmtEur(finance.openInvoiceTotal)}   color="teal"   onClick={() => navigate('/invoices')} />
      </div>

      {/* Budget active projects */}
      <div className={styles.budgetCard}>
        <div className={styles.budgetHeader}>
          <div>
            <h3 className={styles.cardTitle}>{lbl('Budget actieve projecten','Active projects budget')}</h3>
            <p className={styles.cardSub}>{projects.active} {lbl('lopende projecten','projects in progress')}</p>
          </div>
          <button className={styles.linkBtn} onClick={() => navigate('/projects')}>
            {lbl('Alle projecten','All projects')} <ArrowRight size={13}/>
          </button>
        </div>
        <div className={styles.budgetNumbers}>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>{lbl('Totaal budget','Total budget')}</span>
            <span className={styles.budgetVal}>{fmtEur(totalBudget)}</span>
          </div>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>{lbl('Besteed','Spent')}</span>
            <span className={styles.budgetVal} style={{ color: budgetPct > 80 ? '#C8102E' : '#E65100' }}>{fmtEur(totalSpent)}</span>
          </div>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>{lbl('Resterend','Remaining')}</span>
            <span className={styles.budgetVal} style={{ color:'#2E7D32' }}>{fmtEur(totalBudget - totalSpent)}</span>
          </div>
          <div className={styles.budgetNum}>
            <span className={styles.budgetLabel}>%</span>
            <span className={styles.budgetVal} style={{ color: budgetPct > 80 ? '#C8102E' : '#1A3E6F' }}>{budgetPct.toFixed(0)}%</span>
          </div>
        </div>
        <div className={styles.masterBar}>
          <div className={styles.masterFill} style={{
            width: Math.min(100, budgetPct) + '%',
            background: budgetPct > 90 ? '#C8102E' : budgetPct > 70 ? '#FB8C00' : '#1A3E6F'
          }}/>
        </div>
      </div>

      {/* Finance summary */}
      <div className={styles.financeRow}>
        <div className={styles.finCard} style={{ borderLeftColor:'#2E7D32' }}>
          <TrendingUp size={18} className={styles.finIcon} style={{ color:'#2E7D32' }}/>
          <div>
            <p className={styles.finLabel}>{lbl('Omzet (gefactureerd)','Revenue (invoiced)')}</p>
            <p className={styles.finVal}>{fmtEur(finance.totalRevenue)}</p>
          </div>
        </div>
        <div className={styles.finCard} style={{ borderLeftColor:'#C8102E' }}>
          <TrendingDown size={18} className={styles.finIcon} style={{ color:'#C8102E' }}/>
          <div>
            <p className={styles.finLabel}>{lbl('Uitgaven','Expenses')}</p>
            <p className={styles.finVal}>{fmtEur(finance.totalExpenses)}</p>
          </div>
        </div>
        <div className={styles.finCard} style={{ borderLeftColor: finance.result >= 0 ? '#2E7D32' : '#C8102E' }}>
          <Euro size={18} className={styles.finIcon} style={{ color: finance.result >= 0 ? '#2E7D32' : '#C8102E' }}/>
          <div>
            <p className={styles.finLabel}>{lbl('Resultaat','Result')}</p>
            <p className={styles.finVal} style={{ color: finance.result >= 0 ? '#2E7D32' : '#C8102E' }}>{fmtEur(finance.result)}</p>
          </div>
        </div>
      </div>

      {/* 4-panel grid */}
      <div className={styles.grid}>

        {/* Active projects */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{lbl('Lopende projecten','Active projects')}</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/projects')}>{lbl('Alles','All')} <ArrowRight size={12}/></button>
          </div>
          <div className={styles.panelBody}>
            {activeProjects.length === 0
              ? <p className={styles.empty}>{lbl('Geen actieve projecten','No active projects')}</p>
              : activeProjects.map(p => {
                const budget   = +p.budget       || 0
                const spent    = +p.spent_budget  || 0
                const taskDone = +p.task_done     || 0
                const taskTotal= +p.task_total    || 0
                const pct      = budget > 0 ? Math.min(100, spent / budget * 100) : 0
                const taskPct  = taskTotal > 0 ? taskDone / taskTotal * 100 : 0
                const barColor = pct > 90 ? '#C8102E' : pct > 70 ? '#FB8C00' : '#1A3E6F'
                return (
                  <div key={p.id} className={styles.projectRow}>
                    <div className={styles.projectInfo}>
                      <span className={styles.projectName}>{p.name}</span>
                      <span className={styles.projectClient}>{p.client_name}</span>
                    </div>
                    <div className={styles.projectBars}>
                      <div className={styles.miniBarWrap}>
                        <span className={styles.miniBarLabel}>{lbl('Budget','Budget')}</span>
                        <div className={styles.miniBar}><div style={{ width: pct+'%', background: barColor }}/></div>
                        <span className={styles.miniBarPct}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className={styles.miniBarWrap}>
                        <span className={styles.miniBarLabel}>{lbl('Taken','Tasks')}</span>
                        <div className={styles.miniBar}><div style={{ width: taskPct+'%', background: '#43A047' }}/></div>
                        <span className={styles.miniBarPct}>{taskDone}/{taskTotal}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Urgent tasks */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{lbl('Prioritaire taken','Priority tasks')}</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/tasks')}>{lbl('Alles','All')} <ArrowRight size={12}/></button>
          </div>
          <div className={styles.panelBody}>
            {urgentTasks.length === 0
              ? <p className={styles.empty}>{lbl('Geen urgente taken 🎉','No urgent tasks 🎉')}</p>
              : urgentTasks.map(t => {
                const PCOL = { urgent:'#B71C1C', high:'#E65100', medium:'#1565C0', low:'#558B2F' }
                const PBG  = { urgent:'#FFEBEE', high:'#FFF3E0', medium:'#E3F2FD', low:'#F1F8E9' }
                const dueDate = t.due_date || t.dueDate
                const overdue = dueDate && dueDate < new Date().toISOString().slice(0, 10)
                return (
                  <div key={t.id} className={styles.taskRow}>
                    <span className={styles.taskPri} style={{ background: PBG[t.priority], color: PCOL[t.priority] }}>{t.priority}</span>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{t.title}</span>
                      {dueDate && (
                        <span className={styles.taskDue} style={{ color: overdue ? '#C8102E' : 'var(--grey-500)' }}>
                          <Clock size={10}/> {fmtDate(dueDate)}{overdue ? ' ⚠' : ''}
                        </span>
                      )}
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
            <button className={styles.linkBtn} onClick={() => navigate('/stock')}>{lbl('Alles','All')} <ArrowRight size={12}/></button>
          </div>
          <div className={styles.panelBody}>
            {lowStock.length === 0
              ? <p className={styles.empty}>{lbl('Voorraad op peil ✓','Stock is fine ✓')}</p>
              : lowStock.map(s => {
                const qty      = +s.quantity  || 0
                const maxStock = +s.max_stock || 0
                const pct      = maxStock > 0 ? Math.min(100, qty / maxStock * 100) : 0
                const isOut    = qty === 0
                return (
                  <div key={s.id} className={styles.stockRow}>
                    <div className={styles.stockInfo}>
                      <span className={styles.stockName}>{s.name}</span>
                      <span className={styles.stockSub}>{s.location}</span>
                    </div>
                    <div className={styles.stockRight}>
                      <span className={styles.stockQty} style={{ color: isOut ? '#C8102E' : '#E65100' }}>
                        {isOut ? lbl('Uit','Out') : `${qty} ${s.unit}`}
                      </span>
                      <div className={styles.stockBar}>
                        <div style={{ width: pct+'%', background: isOut ? '#C8102E' : '#FB8C00' }}/>
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
            <button className={styles.linkBtn} onClick={() => navigate('/planning')}>{lbl('Planning','Planning')} <ArrowRight size={12}/></button>
          </div>
          <div className={styles.panelBody}>
            {upcomingEvents.length === 0
              ? <p className={styles.empty}>{lbl('Geen activiteiten','No activities')}</p>
              : upcomingEvents.map(e => (
                <div key={e.id} className={styles.eventRow}>
                  <div className={styles.eventColor} style={{ background: e.color || '#1A3E6F' }}/>
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{e.title}</span>
                    <span className={styles.eventMeta}>
                      <CalendarDays size={10}/> {fmtDate(e.start_date || e.startDate)}
                      {e.assignee && <> · {e.assignee}</>}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}

function KPICard({ icon: Icon, label, value, color, sub, onClick }) {
  const COLORS = {
    blue:   { border:'#1A3E6F', bg:'#EEF5FF', text:'#1A3E6F' },
    orange: { border:'#FB8C00', bg:'#FFF8F0', text:'#E65100' },
    red:    { border:'#C8102E', bg:'#FFF0F3', text:'#C8102E' },
    sky:    { border:'#1E88E5', bg:'#EBF5FF', text:'#1565C0' },
    purple: { border:'#7B1FA2', bg:'#F3E5F5', text:'#6A1B9A' },
    teal:   { border:'#00838F', bg:'#E0F7FA', text:'#006064' },
    green:  { border:'#43A047', bg:'#E8F5E9', text:'#2E7D32' },
  }
  const c = COLORS[color] || COLORS.blue
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: c.border, cursor: 'pointer' }} onClick={onClick}>
      <div className={styles.kpiIconWrap} style={{ background: c.bg }}>
        <Icon size={18} style={{ color: c.border }}/>
      </div>
      <div className={styles.kpiInfo}>
        <span className={styles.kpiValue} style={{ color: c.text }}>{value}</span>
        <span className={styles.kpiLabel}>{label}</span>
        {sub && <span className={styles.kpiSub}>{sub}</span>}
      </div>
    </div>
  )
}