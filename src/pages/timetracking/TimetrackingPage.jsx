import { useState, useMemo } from 'react'
import {
  Plus, Search, Filter, Clock, Euro, Users,
  CheckCircle, AlertTriangle, BarChart2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { timeEntriesSeed, workersSeed, computeEntry } from '../../data/timetrackingSeed'
import { projectsSeed } from '../../data/projectsSeed'
import TimeEntryForm from './components/TimeEntryForm'
import TimeEntryList from './components/TimeEntryList'
import WorkersPanel from './components/WorkersPanel'
import TimeReportView from './components/TimeReportView'
import styles from './TimetrackingPage.module.css'

const TABS = ['registraties', 'medewerkers', 'rapport']

export default function TimetrackingPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [entries,  setEntries]  = useState(timeEntriesSeed)
  const [workers,  setWorkers]  = useState(workersSeed)
  const [tab,      setTab]      = useState('registraties')
  const [search,   setSearch]   = useState('')
  const [filterWorker,  setFilterWorker]  = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterWeek,    setFilterWeek]    = useState(() => {
    // current Monday
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })
  const [entryForm, setEntryForm] = useState(null)

  // Computed entries with hours & cost
  const computed = useMemo(() =>
    entries.map(e => computeEntry(e, workers)),
    [entries, workers]
  )

  // Week dates
  const weekDates = useMemo(() => {
    const mon = new Date(filterWeek)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
  }, [filterWeek])

  function prevWeek() {
    const d = new Date(filterWeek); d.setDate(d.getDate() - 7)
    setFilterWeek(d.toISOString().slice(0, 10))
  }
  function nextWeek() {
    const d = new Date(filterWeek); d.setDate(d.getDate() + 7)
    setFilterWeek(d.toISOString().slice(0, 10))
  }
  function goThisWeek() {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    setFilterWeek(d.toISOString().slice(0, 10))
  }

  // Stats (all time)
  const stats = useMemo(() => {
    const totalHours   = computed.reduce((s, e) => s + e.hours, 0)
    const totalCost    = computed.reduce((s, e) => s + e.cost, 0)
    const pending      = computed.filter(e => e.status === 'wacht_goedkeuring').length
    const thisWeek     = computed.filter(e => weekDates.includes(e.date))
    const weekHours    = thisWeek.reduce((s, e) => s + e.hours, 0)
    const weekCost     = thisWeek.reduce((s, e) => s + e.cost, 0)
    return { totalHours, totalCost, pending, weekHours, weekCost, activeWorkers: workers.filter(w => w.status === 'actief').length }
  }, [computed, weekDates, workers])

  // Filtered entries
  const filtered = useMemo(() => {
    return computed.filter(e => {
      if (!weekDates.includes(e.date)) return false
      const q = search.toLowerCase()
      if (q && !e.description?.toLowerCase().includes(q) && !e.workerName?.toLowerCase().includes(q) && !e.projectName?.toLowerCase().includes(q)) return false
      if (filterWorker  && String(e.workerId)  !== filterWorker)  return false
      if (filterProject && String(e.projectId) !== filterProject) return false
      if (filterStatus  && e.status !== filterStatus)             return false
      return true
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  }, [computed, weekDates, search, filterWorker, filterProject, filterStatus])

  // CRUD
  function saveEntry(data) {
    const full = computeEntry(data, workers)
    if (data.id) {
      setEntries(es => es.map(e => e.id === data.id ? full : e))
    } else {
      const id = Math.max(0, ...entries.map(e => e.id)) + 1
      setEntries(es => [...es, { ...full, id, status: 'concept' }])
    }
    setEntryForm(null)
  }

  function deleteEntry(id) { setEntries(es => es.filter(e => e.id !== id)) }

  function approveEntry(id) {
    setEntries(es => es.map(e => e.id === id ? { ...e, status: 'goedgekeurd', approvedBy: 'Jan de Vries' } : e))
  }
  function approveAll() {
    const pending = filtered.filter(e => e.status === 'wacht_goedkeuring').map(e => e.id)
    setEntries(es => es.map(e => pending.includes(e.id) ? { ...e, status: 'goedgekeurd', approvedBy: 'Jan de Vries' } : e))
  }

  function saveWorker(data) {
    if (data.id) setWorkers(ws => ws.map(w => w.id === data.id ? data : w))
    else {
      const id = Math.max(0, ...workers.map(w => w.id)) + 1
      setWorkers(ws => [...ws, { ...data, id }])
    }
  }

  const TAB_LABELS = {
    registraties: { nl: 'Registraties', en: 'Time entries' },
    medewerkers:  { nl: 'Medewerkers',  en: 'Workers' },
    rapport:      { nl: 'Rapport',       en: 'Report' },
  }

  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })
  const fmtH   = n => n.toFixed(1) + ' u'

  // Week label
  const mon = new Date(filterWeek)
  const sun = new Date(filterWeek); sun.setDate(mon.getDate() + 6)
  const MONTHS_NL = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']
  const weekLabel = `${mon.getDate()} ${MONTHS_NL[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_NL[sun.getMonth()]} ${sun.getFullYear()}`

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Tijdregistratie', 'Time tracking')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Uren per medewerker en project', 'Hours per worker and project')}</p>
        </div>
        <div className={styles.headerBtns}>
          {stats.pending > 0 && (
            <button className={styles.approveAllBtn} onClick={approveAll}>
              <CheckCircle size={14} />
              {lbl(`${stats.pending} goedkeuren`, `Approve ${stats.pending}`)}
            </button>
          )}
          {tab === 'registraties' && (
            <button className={styles.addBtn} onClick={() => setEntryForm('new')}>
              <Plus size={15} /> {lbl('Uren invoeren', 'Log hours')}
            </button>
          )}
        </div>
      </div>

      {/* KPI stats */}
      <div className={styles.statsRow}>
        <StatCard icon={Clock}  label={lbl('Deze week','This week')}       value={fmtH(stats.weekHours)}  color="blue"   sub={fmtEur(stats.weekCost)} />
        <StatCard icon={Clock}  label={lbl('Totaal uren','Total hours')}   value={fmtH(stats.totalHours)} color="sky" />
        <StatCard icon={Euro}   label={lbl('Totale loonkost','Total cost')} value={fmtEur(stats.totalCost)} color="orange" />
        <StatCard icon={AlertTriangle} label={lbl('Te goedkeuren','Pending approval')} value={stats.pending} color={stats.pending>0?'red':'green'} alert={stats.pending>0} />
        <StatCard icon={Users}  label={lbl('Medewerkers','Workers')}       value={stats.activeWorkers}    color="purple" />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`}
            onClick={() => { setTab(t); setSearch('') }}>
            {lang==='nl' ? TAB_LABELS[t].nl : TAB_LABELS[t].en}
            {t === 'registraties' && stats.pending > 0 && (
              <span className={styles.tabBadge}>{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Week nav — only for registraties tab */}
      {tab === 'registraties' && (
        <div className={styles.weekNav}>
          <div className={styles.weekNavLeft}>
            <button className={styles.weekBtn} onClick={prevWeek}><ChevronLeft size={16}/></button>
            <span className={styles.weekLabel}>{weekLabel}</span>
            <button className={styles.weekBtn} onClick={nextWeek}><ChevronRight size={16}/></button>
            <button className={styles.todayBtn} onClick={goThisWeek}>{lbl('Deze week','This week')}</button>
          </div>
          <div className={styles.weekSummary}>
            <span className={styles.weekStat}><Clock size={13}/>{fmtH(filtered.reduce((s,e)=>s+e.hours,0))}</span>
            <span className={styles.weekStat}><Euro size={13}/>{fmtEur(filtered.reduce((s,e)=>s+e.cost,0))}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {tab === 'registraties' && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon}/>
            <input className={styles.searchInput}
              placeholder={lbl('Zoeken op omschrijving, medewerker…','Search description, worker…')}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.filters}>
            <Filter size={14} style={{color:'var(--grey-300)'}}/>
            <select className={styles.filterSelect} value={filterWorker} onChange={e=>setFilterWorker(e.target.value)}>
              <option value="">{lbl('Alle medewerkers','All workers')}</option>
              {workers.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select className={styles.filterSelect} value={filterProject} onChange={e=>setFilterProject(e.target.value)}>
              <option value="">{lbl('Alle projecten','All projects')}</option>
              {projectsSeed.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className={styles.filterSelect} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">{lbl('Alle statussen','All statuses')}</option>
              <option value="concept">{lbl('Concept','Draft')}</option>
              <option value="wacht_goedkeuring">{lbl('Wacht goedkeuring','Pending approval')}</option>
              <option value="goedgekeurd">{lbl('Goedgekeurd','Approved')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab content */}
      {tab === 'registraties' && (
        <TimeEntryList
          entries={filtered}
          weekDates={weekDates}
          workers={workers}
          lang={lang}
          onEdit={e => setEntryForm(e)}
          onDelete={deleteEntry}
          onApprove={approveEntry}
        />
      )}

      {tab === 'medewerkers' && (
        <WorkersPanel
          workers={workers}
          entries={computed}
          lang={lang}
          onSave={saveWorker}
          onDelete={id => setWorkers(ws => ws.filter(w => w.id !== id))}
        />
      )}

      {tab === 'rapport' && (
        <TimeReportView entries={computed} workers={workers} lang={lang} />
      )}

      {/* Entry form */}
      {entryForm && (
        <TimeEntryForm
          entry={entryForm === 'new' ? null : entryForm}
          workers={workers}
          lang={lang}
          onSave={saveEntry}
          onClose={() => setEntryForm(null)}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, sub, alert }) {
  const COLORS = { blue:'#1A3E6F', sky:'#1565C0', orange:'#E65100', red:'#C8102E', green:'#2E7D32', purple:'#7B1FA2' }
  const BG     = { blue:'#EEF5FF', sky:'#E3F2FD', orange:'#FFF3E0', red:'#FFEBEE', green:'#E8F5E9', purple:'#F3E5F5' }
  const c = COLORS[color]||COLORS.blue
  return (
    <div className={`${styles.statCard} ${alert?styles.statAlert:''}`} style={{ borderLeftColor: c }}>
      <div className={styles.statIcon} style={{ background: BG[color]||BG.blue }}>
        <Icon size={16} style={{ color: c }} />
      </div>
      <div>
        <div className={styles.statVal} style={{ color: c }}>{value}</div>
        <div className={styles.statLbl}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  )
}