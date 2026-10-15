import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Euro, BarChart2, Download, Users, FolderKanban, Target } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { projectsSeed } from '../../data/projectsSeed'
import { clientsSeed } from '../../data/clientsSeed'
import { factuurSeed, uitgavenSeed, offertesSeed } from '../../data/financeSeed'
import styles from './ReportsPage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcTotalIncl(lines) {
  return (lines||[]).reduce((s,l) => s + l.qty * l.unitPrice * (1 + l.btw/100), 0)
}
function fmtEur(n) { return '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 0 }) }
function fmtPct(n) { return n.toFixed(1) + '%' }

const MONTHS_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Fake monthly revenue data (seed)
const monthlyRevenue = [
  { month: '2024-01', revenue: 3049.20, expenses: 1200 },
  { month: '2024-02', revenue: 0,       expenses: 800  },
  { month: '2024-03', revenue: 0,       expenses: 450  },
  { month: '2024-04', revenue: 5200,    expenses: 2100 },
  { month: '2024-05', revenue: 0,       expenses: 650  },
  { month: '2024-06', revenue: 8800,    expenses: 3200 },
  { month: '2024-07', revenue: 18500,   expenses: 6500 },
  { month: '2024-08', revenue: 3049.20, expenses: 1800 },
  { month: '2024-09', revenue: 3297.25, expenses: 2400 },
  { month: '2024-10', revenue: 5000,    expenses: 1900 },
  { month: '2024-11', revenue: 0,       expenses: 400  },
  { month: '2024-12', revenue: 0,       expenses: 0    },
]

// Bar chart component (pure CSS, no lib needed)
function BarChart({ data, lang }) {
  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1)

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chart}>
        {data.map((d, i) => {
          const revPct = (d.revenue / maxVal) * 100
          const expPct = (d.expenses / maxVal) * 100
          return (
            <div key={i} className={styles.chartCol}>
              <div className={styles.chartBars}>
                <div className={styles.barGroup}>
                  <div className={styles.bar} title={`Omzet: ${fmtEur(d.revenue)}`}
                    style={{ height: revPct + '%', background: 'var(--blue)' }} />
                  <div className={styles.bar} title={`Uitgaven: ${fmtEur(d.expenses)}`}
                    style={{ height: expPct + '%', background: '#FFCDD2' }} />
                </div>
              </div>
              <span className={styles.chartLabel}>{MONTHS[i]}</span>
            </div>
          )
        })}
      </div>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--blue)' }} />{lang === 'nl' ? 'Omzet' : 'Revenue'}</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#FFCDD2' }} />{lang === 'nl' ? 'Uitgaven' : 'Expenses'}</span>
      </div>
    </div>
  )
}

// Project budget bar
function BudgetBar({ project }) {
  const budget = +project.budget || 0
  const spent  = +project.spentBudget || 0
  const pct    = budget > 0 ? Math.min(100, spent / budget * 100) : 0
  const color  = pct > 90 ? '#C8102E' : pct > 70 ? '#FB8C00' : '#43A047'
  const tasksDone  = (project.tasks||[]).filter(t => t.done).length
  const tasksTotal = (project.tasks||[]).length
  const margin = budget > 0 ? ((budget - spent) / budget * 100) : 0

  return (
    <div className={styles.projectBudgetRow}>
      <div className={styles.pbInfo}>
        <span className={styles.pbName}>{project.name}</span>
        <span className={styles.pbClient}>{project.clientName}</span>
      </div>
      <div className={styles.pbBars}>
        <div className={styles.pbBarRow}>
          <span className={styles.pbBarLbl}>Budget</span>
          <div className={styles.pbTrack}>
            <div className={styles.pbFill} style={{ width: pct+'%', background: color }} />
          </div>
          <span className={styles.pbPct} style={{ color }}>{pct.toFixed(0)}%</span>
        </div>
        <div className={styles.pbNumbers}>
          <span>{fmtEur(spent)} / {fmtEur(budget)}</span>
          <span style={{ color: margin >= 0 ? '#2E7D32' : '#C8102E' }}>
            {margin >= 0 ? '+' : ''}{fmtPct(margin)} marge
          </span>
          {tasksTotal > 0 && <span>{tasksDone}/{tasksTotal} taken</span>}
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [period, setPeriod] = useState('year') // year | q1 | q2 | q3 | q4

  // ── Global KPIs ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalRevenue   = factuurSeed.reduce((s,f) => s + calcTotalIncl(f.lines), 0)
    const totalExpenses  = uitgavenSeed.reduce((s,u) => s + u.amount, 0)
    const totalBudget    = projectsSeed.reduce((s,p) => s + (+p.budget||0), 0)
    const totalSpent     = projectsSeed.reduce((s,p) => s + (+p.spentBudget||0), 0)
    const openOffertes   = offertesSeed.filter(o => o.status === 'verzonden').length
    const offerteValue   = offertesSeed.filter(o => o.status==='verzonden')
      .reduce((s,o) => s + o.lines.reduce((ls,l) => ls + l.qty*l.unitPrice*(1+l.btw/100), 0), 0)
    const conversionRate = offertesSeed.length > 0
      ? (offertesSeed.filter(o=>o.status==='goedgekeurd').length / offertesSeed.length * 100)
      : 0
    const paidInvoices   = factuurSeed.filter(f => f.status === 'betaald').length
    const openInvoices   = factuurSeed.filter(f => f.status !== 'betaald').length

    return { totalRevenue, totalExpenses, result: totalRevenue - totalExpenses,
      totalBudget, totalSpent, globalBudgetPct: totalBudget > 0 ? totalSpent/totalBudget*100 : 0,
      openOffertes, offerteValue, conversionRate, paidInvoices, openInvoices }
  }, [])

  // ── Top clients by revenue ───────────────────────────────────────────────────
  const topClients = useMemo(() => {
    const map = {}
    factuurSeed.forEach(f => {
      const key = f.clientName
      if (!map[key]) map[key] = { name: key, revenue: 0, invoices: 0 }
      map[key].revenue += calcTotalIncl(f.lines)
      map[key].invoices += 1
    })
    return Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0, 5)
  }, [])

  const maxClientRevenue = topClients[0]?.revenue || 1

  // ── Monthly totals ───────────────────────────────────────────────────────────
  const annualRevenue  = monthlyRevenue.reduce((s,m) => s + m.revenue, 0)
  const annualExpenses = monthlyRevenue.reduce((s,m) => s + m.expenses, 0)

  // Quarterly
  const quarters = [
    monthlyRevenue.slice(0,3),
    monthlyRevenue.slice(3,6),
    monthlyRevenue.slice(6,9),
    monthlyRevenue.slice(9,12),
  ]

  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Rapporten & Analytics','Reports & Analytics')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Financieel overzicht en projectanalyse','Financial overview and project analysis')}</p>
        </div>
        <div className={styles.headerBtns}>
          <select className={styles.periodSelect} value={period} onChange={e=>setPeriod(e.target.value)}>
            <option value="year">{lbl('Volledig jaar','Full year')}</option>
            <option value="q1">Q1 2024</option>
            <option value="q2">Q2 2024</option>
            <option value="q3">Q3 2024</option>
            <option value="q4">Q4 2024</option>
          </select>
          <button className={styles.exportBtn}>
            <Download size={14} /> {lbl('Exporteer Excel','Export Excel')}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        <KPICard icon={TrendingUp}    label={lbl('Totale omzet','Total revenue')}   value={fmtEur(kpis.totalRevenue)}   color="blue" />
        <KPICard icon={TrendingDown}  label={lbl('Totale uitgaven','Total expenses')} value={fmtEur(kpis.totalExpenses)} color="red" />
        <KPICard icon={Euro}          label={lbl('Nettoresultaat','Net result')}     value={fmtEur(kpis.result)}         color={kpis.result>=0?'green':'red'} />
        <KPICard icon={Target}        label={lbl('Conversie offertes','Quote conv.')} value={fmtPct(kpis.conversionRate)} color="orange" sub={`${kpis.openOffertes} open`} />
        <KPICard icon={FolderKanban}  label={lbl('Budget gebruik','Budget used')}    value={fmtPct(kpis.globalBudgetPct)} color="sky" sub={fmtEur(kpis.totalSpent)+' / '+fmtEur(kpis.totalBudget)} />
        <KPICard icon={Users}         label={lbl('Pipeline offertes','Quote pipeline')} value={fmtEur(kpis.offerteValue)} color="purple" sub={`${kpis.openOffertes} ${lbl('open','open')}`} />
      </div>

      {/* Revenue vs expenses chart */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{lbl('Omzet vs Uitgaven 2024','Revenue vs Expenses 2024')}</h2>
          <div className={styles.quarterBtns}>
            {['year','q1','q2','q3','q4'].map(q => (
              <button key={q} className={`${styles.qBtn} ${period===q?styles.qBtnActive:''}`} onClick={()=>setPeriod(q)}>
                {q==='year' ? lbl('Jaar','Year') : q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.card}>
          <BarChart data={period==='year' ? monthlyRevenue : quarters[+period.replace('q','')-1]} lang={lang} />
          <div className={styles.chartSummary}>
            {[
              { label: lbl('Omzet','Revenue'), value: fmtEur(annualRevenue), color: 'var(--blue)' },
              { label: lbl('Uitgaven','Expenses'), value: fmtEur(annualExpenses), color: '#E53935' },
              { label: lbl('Resultaat','Result'), value: fmtEur(annualRevenue - annualExpenses), color: '#43A047' },
            ].map(s => (
              <div key={s.label} className={styles.summaryItem}>
                <span className={styles.summaryLbl}>{s.label}</span>
                <span className={styles.summaryVal} style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two column: projects + clients */}
      <div className={styles.twoCol}>

        {/* Project budget analysis */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{lbl('Budget per project','Budget per project')}</h2>
          </div>
          <div className={styles.card}>
            {projectsSeed.filter(p => p.budget > 0).map(p => (
              <BudgetBar key={p.id} project={p} />
            ))}
          </div>
        </div>

        {/* Top clients */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{lbl('Top klanten','Top clients')}</h2>
          </div>
          <div className={styles.card}>
            {topClients.map((cl, i) => {
              const pct = (cl.revenue / maxClientRevenue) * 100
              return (
                <div key={cl.name} className={styles.clientRow}>
                  <span className={styles.clientRank}>#{i+1}</span>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>{cl.name}</span>
                    <span className={styles.clientInv}>{cl.invoices} {lbl('facturen','invoices')}</span>
                  </div>
                  <div className={styles.clientRight}>
                    <span className={styles.clientRevenue}>{fmtEur(cl.revenue)}</span>
                    <div className={styles.clientBar}>
                      <div className={styles.clientFill} style={{ width: pct+'%' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Quarterly summary table */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{lbl('Kwartaaloverzicht','Quarterly overview')}</h2>
        </div>
        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
          <table className={styles.qTable}>
            <thead>
              <tr>
                <th>{lbl('Kwartaal','Quarter')}</th>
                {quarters[0].map((_,i) => <th key={i}>{MONTHS[i]}</th>)}
                <th>{lbl('Totaal','Total')}</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q, qi) => {
                const qRev = q.reduce((s,m)=>s+m.revenue,0)
                const qExp = q.reduce((s,m)=>s+m.expenses,0)
                return (
                  <>
                    <tr key={`q${qi+1}-rev`} className={styles.qRowRev}>
                      <td className={styles.qLabel}>Q{qi+1} {lbl('Omzet','Revenue')}</td>
                      {q.map((m,i)=><td key={i} className={styles.qCell}>{m.revenue > 0 ? fmtEur(m.revenue) : '—'}</td>)}
                      <td className={styles.qTotal} style={{color:'var(--blue)'}}>{fmtEur(qRev)}</td>
                    </tr>
                    <tr key={`q${qi+1}-exp`} className={styles.qRowExp}>
                      <td className={styles.qLabel}>Q{qi+1} {lbl('Uitgaven','Expenses')}</td>
                      {q.map((m,i)=><td key={i} className={styles.qCell}>{m.expenses > 0 ? fmtEur(m.expenses) : '—'}</td>)}
                      <td className={styles.qTotal} style={{color:'#E53935'}}>{fmtEur(qExp)}</td>
                    </tr>
                    <tr key={`q${qi+1}-res`} className={styles.qRowResult}>
                      <td className={styles.qLabel}>Q{qi+1} {lbl('Resultaat','Result')}</td>
                      {q.map((m,i)=><td key={i} className={styles.qCell} style={{color: m.revenue-m.expenses>=0?'#2E7D32':'#C8102E', fontWeight:600}}>
                        {m.revenue-m.expenses !== 0 ? fmtEur(m.revenue-m.expenses) : '—'}
                      </td>)}
                      <td className={styles.qTotal} style={{color:qRev-qExp>=0?'#2E7D32':'#C8102E'}}>{fmtEur(qRev-qExp)}</td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project status overview */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{lbl('Projectstatus overzicht','Project status overview')}</h2>
        </div>
        <div className={styles.statusGrid}>
          {['planning','in_progress','on_hold','completed','cancelled'].map(st => {
            const count = projectsSeed.filter(p => p.status === st).length
            const COLORS = { planning:'#1565C0', in_progress:'#E65100', on_hold:'#7B1FA2', completed:'#2E7D32', cancelled:'#757575' }
            const LABELS_NL = { planning:'In planning', in_progress:'Lopend', on_hold:'On hold', completed:'Afgerond', cancelled:'Geannuleerd' }
            const LABELS_EN = { planning:'Planning', in_progress:'In progress', on_hold:'On hold', completed:'Completed', cancelled:'Cancelled' }
            const pct = projectsSeed.length > 0 ? count / projectsSeed.length * 100 : 0
            return (
              <div key={st} className={styles.statusCard} style={{ borderTopColor: COLORS[st] }}>
                <div className={styles.statusNum} style={{ color: COLORS[st] }}>{count}</div>
                <div className={styles.statusLabel}>{lang==='nl' ? LABELS_NL[st] : LABELS_EN[st]}</div>
                <div className={styles.statusBar}>
                  <div className={styles.statusFill} style={{ width: pct+'%', background: COLORS[st] }} />
                </div>
                <div className={styles.statusPct}>{pct.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function KPICard({ icon: Icon, label, value, color, sub }) {
  const COLORS = {
    blue:'#1A3E6F', red:'#C8102E', green:'#2E7D32',
    orange:'#E65100', sky:'#1565C0', purple:'#7B1FA2',
  }
  const BG = {
    blue:'#EEF5FF', red:'#FFF0F3', green:'#E8F5E9',
    orange:'#FFF3E0', sky:'#E3F2FD', purple:'#F3E5F5',
  }
  const c = COLORS[color]||COLORS.blue
  const bg = BG[color]||BG.blue
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: c }}>
      <div className={styles.kpiIcon} style={{ background: bg }}><Icon size={16} style={{ color: c }} /></div>
      <div>
        <div className={styles.kpiVal} style={{ color: c }}>{value}</div>
        <div className={styles.kpiLbl}>{label}</div>
        {sub && <div className={styles.kpiSub}>{sub}</div>}
      </div>
    </div>
  )
}