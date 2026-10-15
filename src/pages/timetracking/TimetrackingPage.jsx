import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, Clock, Euro, Users,
  CheckCircle, AlertTriangle, BarChart2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import TimeEntryForm from './components/TimeEntryForm'
import TimeEntryList from './components/TimeEntryList'
import WorkersPanel from './components/WorkersPanel'
import TimeReportView from './components/TimeReportView'
import styles from './TimetrackingPage.module.css'

const TABS = ['registraties', 'medewerkers', 'rapport']

// ── Helpers API → UI ─────────────────────────────────────────────────────────
function workerFromApi(row) {
  return {
    id:            row.id,
    name:          row.name || '',
    role:          row.role || '',
    hourlyRate:    Number(row.hourly_rate) || 0,
    overtimeRate:  Number(row.overtime_rate) || 0,
    phone:         row.phone || '',
    email:         row.email || '',
    status:        row.status || 'actief',
    color:         row.color || '#1A3E6F',
  }
}

function entryFromApi(row) {
  return {
    id:            row.id,
    workerId:      row.worker_id,
    workerName:    row.worker_name || '',
    workerRole:    row.worker_role || '',
    workerColor:   row.worker_color || '#1A3E6F',
    projectId:     row.project_id || '',
    projectName:   row.project_name || '',
    date:          row.date ? row.date.slice(0, 10) : '',
    startTime:     (row.start_time || '').slice(0, 5),
    endTime:       (row.end_time   || '').slice(0, 5),
    breakMinutes:  row.break_minutes ?? 30,
    workType:      row.work_type || 'normaal',
    description:   row.description || '',
    status:        row.status || 'concept',
    approvedBy:    row.approved_by || '',
    hours:         Number(row.hours) || 0,
    cost:          Number(row.cost)  || 0,
    effectiveRate: Number(row.effectiveRate) || 0,
  }
}

function toApiEntry(data) {
  return {
    workerId:     data.workerId,
    projectId:    data.projectId || null,
    projectName:  data.projectName || null,
    date:         data.date,
    startTime:    data.startTime,
    endTime:      data.endTime,
    breakMinutes: Number(data.breakMinutes) || 30,
    workType:     data.workType || 'normaal',
    description:  data.description || null,
    status:       data.status || 'concept',
  }
}

function toApiWorker(data) {
  return {
    name:         data.name,
    role:         data.role,
    hourlyRate:   Number(data.hourlyRate) || 0,
    overtimeRate: Number(data.overtimeRate) || 0,
    phone:        data.phone || null,
    email:        data.email || null,
    status:       data.status || 'actief',
    color:        data.color || '#1A3E6F',
  }
}

export default function TimetrackingPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [entries, setEntries]       = useState([])
  const [workers, setWorkers]       = useState([])
  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [tab, setTab]               = useState('registraties')
  const [search, setSearch]         = useState('')
  const [filterWorker, setFilterWorker]   = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [filterWeek, setFilterWeek] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })
  const [entryForm, setEntryForm] = useState(null)

  // ── Charger les données ─────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [eRows, wRows, pRows] = await Promise.all([
        api.get('/timetracking/entries'),
        api.get('/timetracking/workers'),
        api.get('/projects').catch(() => []),
      ])
      setEntries(eRows.map(entryFromApi))
      setWorkers(wRows.map(workerFromApi))
      setProjects((pRows || []).map(r => ({ id: r.id, name: r.name })))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Week dates ──────────────────────────────────────────────
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

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalHours = entries.reduce((s, e) => s + e.hours, 0)
    const totalCost  = entries.reduce((s, e) => s + e.cost, 0)
    const pending    = entries.filter(e => e.status === 'wacht_goedkeuring').length
    const thisWeek   = entries.filter(e => weekDates.includes(e.date))
    const weekHours  = thisWeek.reduce((s, e) => s + e.hours, 0)
    const weekCost   = thisWeek.reduce((s, e) => s + e.cost, 0)
    return {
      totalHours, totalCost, pending, weekHours, weekCost,
      activeWorkers: workers.filter(w => w.status === 'actief').length,
    }
  }, [entries, weekDates, workers])

  // ── Filtered ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (!weekDates.includes(e.date)) return false
      const q = search.toLowerCase()
      if (q && !e.description?.toLowerCase().includes(q) && !e.workerName?.toLowerCase().includes(q) && !e.projectName?.toLowerCase().includes(q)) return false
      if (filterWorker  && String(e.workerId)  !== filterWorker)  return false
      if (filterProject && String(e.projectId) !== filterProject) return false
      if (filterStatus  && e.status !== filterStatus)             return false
      return true
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  }, [entries, weekDates, search, filterWorker, filterProject, filterStatus])

  // ── CRUD Entries ────────────────────────────────────────────
  async function saveEntry(data) {
    setSaving(true)
    try {
      if (data.id) {
        await api.put(`/timetracking/entries/${data.id}`, toApiEntry(data))
      } else {
        await api.post('/timetracking/entries', toApiEntry(data))
      }
      // Recharger pour avoir hours + cost calculés par le backend
      const eRows = await api.get('/timetracking/entries')
      setEntries(eRows.map(entryFromApi))
      setEntryForm(null)
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(id) {
    try {
      await api.delete(`/timetracking/entries/${id}`)
      setEntries(es => es.filter(e => e.id !== id))
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  async function approveEntry(id) {
    try {
      const updated = await api.patch(`/timetracking/entries/${id}/approve`)
      // Le backend ne renvoie que l'entry sans hours/cost ; on recharge
      const eRows = await api.get('/timetracking/entries')
      setEntries(eRows.map(entryFromApi))
    } catch (e) {
      alert('Goedkeuren mislukt: ' + e.message)
    }
  }

  async function approveAll() {
    const toApprove = filtered.filter(e => e.status === 'wacht_goedkeuring')
    if (toApprove.length === 0) return
    try {
      for (const e of toApprove) {
        await api.patch(`/timetracking/entries/${e.id}/approve`)
      }
      const eRows = await api.get('/timetracking/entries')
      setEntries(eRows.map(entryFromApi))
    } catch (e) {
      alert('Goedkeuren mislukt: ' + e.message)
    }
  }

  // ── CRUD Workers ────────────────────────────────────────────
  async function saveWorker(data) {
    setSaving(true)
    try {
      if (data.id) {
        const updated = await api.put(`/timetracking/workers/${data.id}`, toApiWorker(data))
        setWorkers(ws => ws.map(w => w.id === data.id ? workerFromApi(updated) : w))
      } else {
        const created = await api.post('/timetracking/workers', toApiWorker(data))
        setWorkers(ws => [...ws, workerFromApi(created)])
      }
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteWorker(id) {
    try {
      await api.delete(`/timetracking/workers/${id}`)
      setWorkers(ws => ws.filter(w => w.id !== id))
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  const TAB_LABELS = {
    registraties: { nl: 'Registraties', en: 'Time entries' },
    medewerkers:  { nl: 'Medewerkers',  en: 'Workers' },
    rapport:      { nl: 'Rapport',       en: 'Report' },
  }

  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })
  const fmtH   = n => n.toFixed(1) + ' u'

  const mon = new Date(filterWeek)
  const sun = new Date(filterWeek); sun.setDate(mon.getDate() + 6)
  const MONTHS_NL = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']
  const weekLabel = `${mon.getDate()} ${MONTHS_NL[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_NL[sun.getMonth()]} ${sun.getFullYear()}`

  return (
    <div className={styles.page}>

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

      <div className={styles.statsRow}>
        <StatCard icon={Clock}  label={lbl('Deze week','This week')}       value={fmtH(stats.weekHours)}  color="blue"   sub={fmtEur(stats.weekCost)} />
        <StatCard icon={Clock}  label={lbl('Totaal uren','Total hours')}   value={fmtH(stats.totalHours)} color="sky" />
        <StatCard icon={Euro}   label={lbl('Totale loonkost','Total cost')} value={fmtEur(stats.totalCost)} color="orange" />
        <StatCard icon={AlertTriangle} label={lbl('Te goedkeuren','Pending approval')} value={stats.pending} color={stats.pending>0?'red':'green'} alert={stats.pending>0} />
        <StatCard icon={Users}  label={lbl('Medewerkers','Workers')}       value={stats.activeWorkers}    color="purple" />
      </div>

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
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
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

      {loading ? (
        <p style={{ padding: 24, textAlign: 'center', color: '#666' }}>Laden…</p>
      ) : error ? (
        <p style={{ padding: 24, textAlign: 'center', color: '#C8102E' }}>Fout: {error}</p>
      ) : (
        <>
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
              entries={entries}
              lang={lang}
              onSave={saveWorker}
              onDelete={deleteWorker}
            />
          )}

          {tab === 'rapport' && (
            <TimeReportView entries={entries} workers={workers} lang={lang} />
          )}
        </>
      )}

      {entryForm && (
        <TimeEntryForm
          entry={entryForm === 'new' ? null : entryForm}
          workers={workers}
          projects={projects}
          lang={lang}
          onSave={saveEntry}
          onClose={() => setEntryForm(null)}
          saving={saving}
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