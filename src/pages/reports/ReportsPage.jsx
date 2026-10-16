import { useState, useMemo, useEffect } from 'react'
import React from 'react'
import { TrendingUp, TrendingDown, Euro, BarChart2, Download, Users, FolderKanban, Target } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import styles from './ReportsPage.module.css'

function fmtEur(n) { return '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 0 }) }
function fmtPct(n) { return Number(n||0).toFixed(1) + '%' }

const MONTHS_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Bar chart — pure CSS
function BarChart({ data, lang }) {
  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN
  const maxVal = Math.max(...data.map(d => Math.max(+d.revenue||0, +d.expenses||0)), 1)

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chart}>
        {data.map((d, i) => {
          const revPct = (+d.revenue  / maxVal) * 100
          const expPct = (+d.expenses / maxVal) * 100
          return (
            <div key={i} className={styles.chartCol}>
              <div className={styles.chartBars}>
                <div className={styles.barGroup}>
                  <div className={`${styles.bar} ${styles.barRev}`}
                    style={{ height: revPct + '%' }}
                    title={`Omzet: ${fmtEur(d.revenue)}`}/>
                  <div className={`${styles.bar} ${styles.barExp}`}
                    style={{ height: expPct + '%' }}
                    title={`Uitgaven: ${fmtEur(d.expenses)}`}/>
                </div>
              </div>
              <span className={styles.chartLabel}>{MONTHS[i % 12]}</span>
            </div>
          )
        })}
      </div>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background:'var(--blue)' }}/>{lang==='nl'?'Omzet':'Revenue'}</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background:'#EF9A9A' }}/>{lang==='nl'?'Uitgaven':'Expenses'}</span>
      </div>
    </div>
  )
}

function BudgetBar({ project }) {
  const budget = +project.budget || 0
  const spent  = +project.spent_budget || +project.spentBudget || 0
  const taskDone  = +project.task_done  || 0
  const taskTotal = +project.task_total || 0
  const pct    = budget > 0 ? Math.min(100, spent / budget * 100) : 0
  const margin = budget > 0 ? ((budget - spent) / budget * 100) : 0
  const color  = pct > 90 ? '#C8102E' : pct > 70 ? '#FB8C00' : '#43A047'
  const clientName = project.client_name || project.clientName || ''
  return (
    <div className={styles.projectBudgetRow}>
      <div className={styles.pbInfo}>
        <span className={styles.pbName}>{project.name}</span>
        <span className={styles.pbClient}>{clientName}</span>
      </div>
      <div className={styles.pbBars}>
        <div className={styles.pbBarRow}>
          <span className={styles.pbBarLbl}>Budget</span>
          <div className={styles.pbTrack}>
            <div className={styles.pbFill} style={{ width: pct+'%', background: color }}/>
          </div>
          <span className={styles.pbPct} style={{ color }}>{pct.toFixed(0)}%</span>
        </div>
        <div className={styles.pbNumbers}>
          <span>{fmtEur(spent)} / {fmtEur(budget)}</span>
          <span style={{ color: margin >= 0 ? '#2E7D32' : '#C8102E' }}>
            {margin >= 0 ? '+' : ''}{fmtPct(margin)} marge
          </span>
          {taskTotal > 0 && <span>{taskDone}/{taskTotal} taken</span>}
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN

  const [period,   setPeriod]   = useState('year')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // API data
  const [reportStats,    setReportStats]    = useState(null)
  const [financeStats,   setFinanceStats]   = useState(null)
  const [projects,       setProjects]       = useState([])
  const [offertes,       setOffertes]       = useState([])
  const [monthlyData,    setMonthlyData]    = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [fs, pr, of] = await Promise.all([
        api.get('/finance/stats'),
        api.get('/projects'),
        api.get('/finance/offertes'),
      ])
      setFinanceStats(fs)
      setProjects(pr)
      setOffertes(of)

      // Build monthly revenue from finance/stats monthly data if available
      if (fs.monthlyRevenue) {
        setMonthlyData(fs.monthlyRevenue)
      } else {
        // Build 12-month array with zeros
        const monthly = Array.from({ length: 12 }, (_, i) => ({
          month:    `${new Date().getFullYear()}-${String(i+1).padStart(2,'0')}`,
          revenue:  0,
          expenses: 0,
        }))
        setMonthlyData(monthly)
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // KPIs from API data
  const kpis = useMemo(() => {
    if (!financeStats) return {}
    const totalRevenue  = +financeStats.totalRevenue  || 0
    const totalExpenses = +financeStats.totalExpenses || 0
    const totalBudget   = projects.reduce((s,p) => s + (+p.budget||0), 0)
    const totalSpent    = projects.reduce((s,p) => s + (+p.spent_budget||+p.spentBudget||0), 0)
    const openOffertes  = offertes.filter(o => o.status === 'verzonden').length
    const offerteValue  = offertes.filter(o => o.status === 'verzonden')
      .reduce((s,o) => s + (o.total_incl || 0), 0)
    const conversionRate = offertes.length > 0
      ? (offertes.filter(o => o.status === 'goedgekeurd').length / offertes.length * 100)
      : 0
    return {
      totalRevenue, totalExpenses, result: totalRevenue - totalExpenses,
      totalBudget, totalSpent,
      globalBudgetPct: totalBudget > 0 ? totalSpent / totalBudget * 100 : 0,
      openOffertes, offerteValue, conversionRate,
    }
  }, [financeStats, projects, offertes])

  // Top clients from finance stats
  const topClients = useMemo(() => {
    if (financeStats?.topClients) return financeStats.topClients
    return []
  }, [financeStats])

  const maxClientRevenue = topClients[0]?.revenue || 1

  // Monthly data split into quarters
  const quarters = useMemo(() => {
    if (monthlyData.length === 0) return [[],[],[],[]]
    return [
      monthlyData.slice(0, 3),
      monthlyData.slice(3, 6),
      monthlyData.slice(6, 9),
      monthlyData.slice(9, 12),
    ]
  }, [monthlyData])

  const displayData = period === 'year' ? monthlyData : (quarters[+period.replace('q','') - 1] || [])
  const annualRevenue  = monthlyData.reduce((s,m) => s + (+m.revenue||0),  0)
  const annualExpenses = monthlyData.reduce((s,m) => s + (+m.expenses||0), 0)

  // Project status counts
  const projectStatus = useMemo(() => {
    const statuses = ['planning','in_progress','on_hold','completed','cancelled']
    return statuses.map(st => ({
      status: st,
      count:  projects.filter(p => p.status === st).length,
    }))
  }, [projects])

  if (loading) return <ReportsSkeleton lang={lang} lbl={lbl} />

  if (error) return (
    <div className={styles.page}>
      <div style={{ padding:40, textAlign:'center', color:'#C8102E' }}>{error}</div>
    </div>
  )

  const COLORS = { planning:'#1565C0', in_progress:'#E65100', on_hold:'#7B1FA2', completed:'#2E7D32', cancelled:'#757575' }
  const LABELS_NL = { planning:'In planning', in_progress:'Lopend', on_hold:'On hold', completed:'Afgerond', cancelled:'Geannuleerd' }
  const LABELS_EN = { planning:'Planning', in_progress:'In progress', on_hold:'On hold', completed:'Completed', cancelled:'Cancelled' }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Rapporten & Analytics','Reports & Analytics')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Financieel overzicht en projectanalyse','Financial overview and project analysis')}</p>
        </div>
        <div className={styles.headerBtns}>
          <select className={styles.periodSelect} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="year">{lbl('Volledig jaar','Full year')}</option>
            <option value="q1">Q1</option>
            <option value="q2">Q2</option>
            <option value="q3">Q3</option>
            <option value="q4">Q4</option>
          </select>
          <button className={styles.exportBtn}><Download size={14}/> {lbl('Exporteer Excel','Export Excel')}</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        <KPICard icon={TrendingUp}   label={lbl('Totale omzet','Total revenue')}     value={fmtEur(kpis.totalRevenue)}   color="blue"/>
        <KPICard icon={TrendingDown} label={lbl('Totale uitgaven','Total expenses')}  value={fmtEur(kpis.totalExpenses)}  color="red"/>
        <KPICard icon={Euro}         label={lbl('Nettoresultaat','Net result')}        value={fmtEur(kpis.result)}         color={kpis.result>=0?'green':'red'}/>
        <KPICard icon={Target}       label={lbl('Conversie offertes','Quote conv.')}   value={fmtPct(kpis.conversionRate)} color="orange" sub={`${kpis.openOffertes} open`}/>
        <KPICard icon={FolderKanban} label={lbl('Budget gebruik','Budget used')}       value={fmtPct(kpis.globalBudgetPct)} color="sky" sub={fmtEur(kpis.totalSpent)+' / '+fmtEur(kpis.totalBudget)}/>
        <KPICard icon={Users}        label={lbl('Pipeline offertes','Quote pipeline')} value={fmtEur(kpis.offerteValue)} color="purple" sub={`${kpis.openOffertes} ${lbl('open','open')}`}/>
      </div>

      {/* Revenue vs expenses chart */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{lbl('Omzet vs Uitgaven','Revenue vs Expenses')} {new Date().getFullYear()}</h2>
          <div className={styles.quarterBtns}>
            {['year','q1','q2','q3','q4'].map(q => (
              <button key={q} className={`${styles.qBtn} ${period===q?styles.qBtnActive:''}`} onClick={() => setPeriod(q)}>
                {q==='year' ? lbl('Jaar','Year') : q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.card}>
          {displayData.length > 0 ? (
            <BarChart data={displayData} lang={lang}/>
          ) : (
            <div style={{ textAlign:'center', padding:40, color:'var(--grey-400)' }}>{lbl('Geen data beschikbaar','No data available')}</div>
          )}
          <div className={styles.chartSummary}>
            {[
              { label:lbl('Omzet','Revenue'),   value:fmtEur(annualRevenue),               color:'var(--blue)' },
              { label:lbl('Uitgaven','Expenses'),value:fmtEur(annualExpenses),              color:'#E53935' },
              { label:lbl('Resultaat','Result'), value:fmtEur(annualRevenue-annualExpenses),color:'#43A047' },
            ].map(s => (
              <div key={s.label} className={styles.summaryItem}>
                <span className={styles.summaryLbl}>{s.label}</span>
                <span className={styles.summaryVal} style={{ color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns: projects + top clients */}
      <div className={styles.twoCol}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>{lbl('Budget per project','Budget per project')}</h2></div>
          <div className={styles.card}>
            {projects.filter(p => (+p.budget||0) > 0).map(p => <BudgetBar key={p.id} project={p}/>)}
            {projects.filter(p => (+p.budget||0) > 0).length === 0 && (
              <p style={{ textAlign:'center', padding:20, color:'var(--grey-400)' }}>{lbl('Geen projecten met budget','No projects with budget')}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>{lbl('Top klanten','Top clients')}</h2></div>
          <div className={styles.card}>
            {topClients.map((cl, i) => {
              const rev = +cl.revenue || 0
              const pct = maxClientRevenue > 0 ? (rev / maxClientRevenue * 100) : 0
              const clientName = cl.client_name || cl.name || ''
              return (
                <div key={clientName} className={styles.clientRow}>
                  <span className={styles.clientRank}>#{i+1}</span>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>{clientName}</span>
                    <span className={styles.clientInv}>{cl.invoices} {lbl('facturen','invoices')}</span>
                  </div>
                  <div className={styles.clientRight}>
                    <span className={styles.clientRevenue}>{fmtEur(rev)}</span>
                    <div className={styles.clientBar}><div className={styles.clientFill} style={{ width: pct+'%' }}/></div>
                  </div>
                </div>
              )
            })}
            {topClients.length === 0 && (
              <p style={{ textAlign:'center', padding:20, color:'var(--grey-400)' }}>{lbl('Geen data','No data')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quarterly table */}
      {quarters[0].length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>{lbl('Kwartaaloverzicht','Quarterly overview')}</h2></div>
          <div className={styles.card} style={{ padding:0, overflow:'hidden' }}>
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
                  const qRev = q.reduce((s,m) => s + (+m.revenue||0),  0)
                  const qExp = q.reduce((s,m) => s + (+m.expenses||0), 0)
                  return (
                    <React.Fragment key={qi}>
                      <tr className={styles.qRowRev}>
                        <td className={styles.qLabel}>Q{qi+1} {lbl('Omzet','Revenue')}</td>
                        {q.map((m,i) => <td key={i} className={styles.qCell}>{+m.revenue>0?fmtEur(m.revenue):'—'}</td>)}
                        <td className={styles.qTotal} style={{ color:'var(--blue)' }}>{fmtEur(qRev)}</td>
                      </tr>
                      <tr className={styles.qRowExp}>
                        <td className={styles.qLabel}>Q{qi+1} {lbl('Uitgaven','Expenses')}</td>
                        {q.map((m,i) => <td key={i} className={styles.qCell}>{+m.expenses>0?fmtEur(m.expenses):'—'}</td>)}
                        <td className={styles.qTotal} style={{ color:'#E53935' }}>{fmtEur(qExp)}</td>
                      </tr>
                      <tr className={styles.qRowResult}>
                        <td className={styles.qLabel}>Q{qi+1} {lbl('Resultaat','Result')}</td>
                        {q.map((m,i) => <td key={i} className={styles.qCell} style={{ color:+m.revenue-+m.expenses>=0?'#2E7D32':'#C8102E', fontWeight:600 }}>
                          {+m.revenue-+m.expenses!==0?fmtEur(+m.revenue-+m.expenses):'—'}
                        </td>)}
                        <td className={styles.qTotal} style={{ color:qRev-qExp>=0?'#2E7D32':'#C8102E' }}>{fmtEur(qRev-qExp)}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project status */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>{lbl('Projectstatus overzicht','Project status overview')}</h2></div>
        <div className={styles.statusGrid}>
          {projectStatus.map(({ status, count }) => {
            const pct = projects.length > 0 ? count / projects.length * 100 : 0
            return (
              <div key={status} className={styles.statusCard} style={{ borderTopColor: COLORS[status] }}>
                <div className={styles.statusNum} style={{ color: COLORS[status] }}>{count}</div>
                <div className={styles.statusLabel}>{lang==='nl'?LABELS_NL[status]:LABELS_EN[status]}</div>
                <div className={styles.statusBar}><div className={styles.statusFill} style={{ width:pct+'%', background:COLORS[status] }}/></div>
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
  const COLORS = { blue:'#1A3E6F', red:'#C8102E', green:'#2E7D32', orange:'#E65100', sky:'#1565C0', purple:'#7B1FA2' }
  const BG     = { blue:'#EEF5FF', red:'#FFF0F3', green:'#E8F5E9', orange:'#FFF3E0', sky:'#E3F2FD', purple:'#F3E5F5' }
  const c  = COLORS[color] || COLORS.blue
  const bg = BG[color]     || BG.blue
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: c }}>
      <div className={styles.kpiIcon} style={{ background: bg }}><Icon size={16} style={{ color: c }}/></div>
      <div>
        <div className={styles.kpiVal} style={{ color: c }}>{value}</div>
        <div className={styles.kpiLbl}>{label}</div>
        {sub && <div className={styles.kpiSub}>{sub}</div>}
      </div>
    </div>
  )
}

/* ───────────────────────── SKELETON ───────────────────────── */

function Shimmer({ w = '100%', h = 14, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      ...style
    }} />
  )
}

function SkeletonKPICard({ color }) {
  const COLORS = { blue:'#1A3E6F', red:'#C8102E', green:'#2E7D32', orange:'#E65100', sky:'#1565C0', purple:'#7B1FA2' }
  const BG     = { blue:'#EEF5FF', red:'#FFF0F3', green:'#E8F5E9', orange:'#FFF3E0', sky:'#E3F2FD', purple:'#F3E5F5' }
  const c  = COLORS[color] || COLORS.blue
  const bg = BG[color]     || BG.blue
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: c, pointerEvents: 'none', opacity: 0.75 }}>
      <div className={styles.kpiIcon} style={{ background: bg }}>
        <Shimmer w={16} h={16} r={4} />
      </div>
      <div style={{ flex: 1 }}>
        <Shimmer w={90} h={20} style={{ marginBottom: 6 }} />
        <Shimmer w={110} h={11} style={{ marginBottom: 4 }} />
        <Shimmer w={70} h={10} />
      </div>
    </div>
  )
}

function SkeletonBarChart() {
  const months = 12
  // Heights pseudo-aléatoires mais stables pour un rendu naturel
  const heights = [45, 62, 38, 71, 55, 80, 48, 66, 52, 74, 58, 68]
  return (
    <div className={styles.chartWrap}>
      <div className={styles.chart}>
        {Array.from({ length: months }).map((_, i) => (
          <div key={i} className={styles.chartCol}>
            <div className={styles.chartBars}>
              <div className={styles.barGroup}>
                <Shimmer w="100%" h={`${heights[i]}%`} r={4} style={{ position: 'absolute', bottom: 0, left: 0 }} />
                <Shimmer w="100%" h={`${Math.max(15, heights[i] - 20)}%`} r={4} style={{ position: 'absolute', bottom: 0, right: 0 }} />
              </div>
            </div>
            <Shimmer w={24} h={11} />
          </div>
        ))}
      </div>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <Shimmer w={10} h={10} r={5} />
          <Shimmer w={55} h={11} />
        </span>
        <span className={styles.legendItem}>
          <Shimmer w={10} h={10} r={5} />
          <Shimmer w={65} h={11} />
        </span>
      </div>
    </div>
  )
}

function SkeletonBudgetRow({ index }) {
  const widths = ['60%', '75%', '55%', '70%']
  return (
    <div className={styles.projectBudgetRow} style={{ pointerEvents: 'none' }}>
      <div className={styles.pbInfo}>
        <Shimmer w={widths[index % widths.length]} h={13} style={{ marginBottom: 6 }} />
        <Shimmer w="50%" h={11} />
      </div>
      <div className={styles.pbBars}>
        <div className={styles.pbBarRow}>
          <Shimmer w={50} h={11} />
          <Shimmer w="100%" h={8} r={4} />
          <Shimmer w={30} h={11} />
        </div>
        <div className={styles.pbNumbers} style={{ marginTop: 6 }}>
          <Shimmer w={100} h={10} />
          <Shimmer w={70} h={10} />
        </div>
      </div>
    </div>
  )
}

function SkeletonClientRow({ index }) {
  const widths = ['65%', '80%', '55%', '70%']
  return (
    <div className={styles.clientRow} style={{ pointerEvents: 'none' }}>
      <Shimmer w={30} h={14} />
      <div className={styles.clientInfo} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Shimmer w={widths[index % widths.length]} h={12} />
        <Shimmer w={70} h={10} />
      </div>
      <div className={styles.clientRight}>
        <Shimmer w={70} h={12} style={{ marginBottom: 4 }} />
        <Shimmer w="100%" h={5} r={3} />
      </div>
    </div>
  )
}

function SkeletonStatusCard() {
  return (
    <div className={styles.statusCard} style={{ borderTopColor: '#e0e0e0', pointerEvents: 'none' }}>
      <Shimmer w={40} h={26} style={{ marginBottom: 8 }} />
      <Shimmer w={90} h={12} style={{ marginBottom: 12 }} />
      <Shimmer w="100%" h={6} r={3} style={{ marginBottom: 6 }} />
      <Shimmer w={35} h={11} />
    </div>
  )
}

function ReportsSkeleton({ lang, lbl }) {
  const statuses = ['planning','in_progress','on_hold','completed','cancelled']

  return (
    <div className={styles.page}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Rapporten & Analytics','Reports & Analytics')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Financieel overzicht en projectanalyse','Financial overview and project analysis')}</p>
        </div>
        <div className={styles.headerBtns}>
          <Shimmer w={150} h={38} r={8} />
          <Shimmer w={150} h={38} r={8} />
        </div>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <SkeletonKPICard color="blue" />
        <SkeletonKPICard color="red" />
        <SkeletonKPICard color="green" />
        <SkeletonKPICard color="orange" />
        <SkeletonKPICard color="sky" />
        <SkeletonKPICard color="purple" />
      </div>

      {/* Revenue vs expenses chart */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Shimmer w={280} h={18} />
          <div className={styles.quarterBtns}>
            {['year','q1','q2','q3','q4'].map(q => (
              <Shimmer key={q} w={45} h={32} r={6} />
            ))}
          </div>
        </div>
        <div className={styles.card}>
          <SkeletonBarChart />
          <div className={styles.chartSummary}>
            {[0,1,2].map(i => (
              <div key={i} className={styles.summaryItem}>
                <Shimmer w={80} h={11} style={{ marginBottom: 6 }} />
                <Shimmer w={100} h={16} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns: budget per project + top clients */}
      <div className={styles.twoCol}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shimmer w={180} h={18} />
          </div>
          <div className={styles.card}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBudgetRow key={i} index={i} />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shimmer w={140} h={18} />
          </div>
          <div className={styles.card}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonClientRow key={i} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Project status overview */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Shimmer w={250} h={18} />
        </div>
        <div className={styles.statusGrid}>
          {statuses.map((_, i) => <SkeletonStatusCard key={i} />)}
        </div>
      </div>
    </div>
  )
}