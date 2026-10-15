import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Pencil, Trash2, Filter,
  CalendarDays, Euro, MapPin, CheckSquare,
  AlertTriangle, Paperclip, Clock, TrendingUp
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import ProjectForm from './ProjectForm'
import styles from './ProjectsPage.module.css'

const STATUS_STYLE = {
  planning:    { bg: '#E3F2FD', color: '#1565C0', dot: '#1E88E5' },
  in_progress: { bg: '#FFF3E0', color: '#E65100', dot: '#FB8C00' },
  on_hold:     { bg: '#F3E5F5', color: '#6A1B9A', dot: '#AB47BC' },
  completed:   { bg: '#E8F5E9', color: '#2E7D32', dot: '#43A047' },
  cancelled:   { bg: '#FAFAFA', color: '#757575', dot: '#BDBDBD' },
}

const PRIORITY_STYLE = {
  low:    { color: '#558B2F', bg: '#F1F8E9' },
  medium: { color: '#1565C0', bg: '#E3F2FD' },
  high:   { color: '#E65100', bg: '#FFF3E0' },
  urgent: { color: '#B71C1C', bg: '#FFEBEE' },
}

function fmtDate(d) {
  if (!d) return '—'
  const raw = d.includes('T') ? d.slice(0, 10) : d
  const [y, m, day] = raw.split('-')
  return `${day}-${m}-${y}`
}

function fmtEur(n) {
  return '€ ' + Number(n || 0).toLocaleString('nl-NL')
}

// API (snake_case) → UI (camelCase)
function fromApi(row) {
  return {
    id:               row.id,
    name:             row.name || '',
    clientId:         row.client_id || '',
    clientName:       row.client_name || '',
    status:           row.status || 'planning',
    priority:         row.priority || 'medium',
    startDate:        row.start_date ? row.start_date.slice(0, 10) : '',
    estimatedEndDate: row.estimated_end_date ? row.estimated_end_date.slice(0, 10) : '',
    budget:           row.budget ?? '',
    spentBudget:      row.spent_budget ?? '',
    address:          row.address || '',
    description:      row.description || '',
    notes:            row.notes || '',
    createdAt:        row.created_at ? row.created_at.slice(0, 10) : '',
    tasks:            (row.tasks || []).map(t => ({
      id:   t.id,
      text: t.text,
      done: t.done,
    })),
    problems: (row.problems || []).map(pb => ({
      id:       pb.id,
      text:     pb.text,
      date:     pb.date ? pb.date.slice(0, 10) : '',
      resolved: pb.resolved,
    })),
    attachments: row.attachments || [],
  }
}

// UI (camelCase) → API (camelCase — le backend attend ça)
function toApi(data) {
  return {
    name:             data.name,
    clientId:         data.clientId || null,
    clientName:       data.clientName || null,
    status:           data.status || 'planning',
    priority:         data.priority || 'medium',
    startDate:        data.startDate || null,
    estimatedEndDate: data.estimatedEndDate || null,
    budget:           data.budget !== '' ? Number(data.budget) : 0,
    spentBudget:      data.spentBudget !== '' ? Number(data.spentBudget) : 0,
    address:          data.address || null,
    description:      data.description || null,
    notes:            data.notes || null,
    tasks:            (data.tasks || []).map(t => ({ text: t.text, done: !!t.done })),
  }
}

export default function ProjectsPage() {
  const { t } = useLang()
  const p = t.projects

  const [projects, setProjects]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [formOpen, setFormOpen]             = useState(false)
  const [editTarget, setEditTarget]         = useState(null)
  const [deleteId, setDeleteId]             = useState(null)
  const [saving, setSaving]                 = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await api.get('/projects')
      setProjects(rows.map(fromApi))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return projects.filter(pr => {
      if (q && !pr.name.toLowerCase().includes(q) && !pr.clientName?.toLowerCase().includes(q) && !pr.address?.toLowerCase().includes(q)) return false
      if (filterStatus && pr.status !== filterStatus) return false
      if (filterPriority && pr.priority !== filterPriority) return false
      return true
    })
  }, [projects, search, filterStatus, filterPriority])

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((s, pr) => s + (parseFloat(pr.budget) || 0), 0)
    return {
      total: projects.length,
      inProgress: projects.filter(pr => pr.status === 'in_progress').length,
      completed: projects.filter(pr => pr.status === 'completed').length,
      planning: projects.filter(pr => pr.status === 'planning').length,
      totalBudget,
    }
  }, [projects])

  function openAdd()    { setEditTarget(null); setFormOpen(true) }
  function openEdit(pr) { setEditTarget(pr);   setFormOpen(true) }
  function closeForm()  { setFormOpen(false);  setEditTarget(null) }

  async function handleSave(data) {
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await api.put(`/projects/${editTarget.id}`, toApi(data))
        // On recharge pour récupérer les tasks/problems complets
        await load()
      } else {
        await api.post('/projects', toApi(data))
        await load()
      }
      closeForm()
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/projects/${id}`)
      setProjects(ps => ps.filter(pr => pr.id !== id))
      setDeleteId(null)
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{p.title}</h1>
          <p className={styles.pageSubtitle}>{p.subtitle}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <Plus size={16} />
          {p.addProject}
        </button>
      </div>

      <div className={styles.statsRow}>
        <StatCard icon={TrendingUp}   label={p.total}      value={stats.total}               accent="blue" />
        <StatCard icon={Clock}        label={p.inProgress} value={stats.inProgress}          accent="orange" />
        <StatCard icon={CheckSquare}  label={p.completed}  value={stats.completed}           accent="green" />
        <StatCard icon={CalendarDays} label={p.planning}   value={stats.planning}            accent="sky" />
        <StatCard icon={Euro}         label={p.budget}     value={fmtEur(stats.totalBudget)} accent="purple" wide />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={p.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-300)' }} />
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{p.filterStatus}</option>
            {Object.entries(p.statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">{p.filterPriority}</option>
            {Object.entries(p.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Laden…</p>
        </div>
      ) : error ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Fout: {error}</p>
          <button className={styles.addBtn} onClick={load} style={{ marginTop: 12 }}>
            Opnieuw proberen
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{p.noResults}</p>
          <p className={styles.emptyHint}>{p.noResultsHint}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(pr => {
            const statusStyle   = STATUS_STYLE[pr.status]    || STATUS_STYLE.planning
            const priorityStyle = PRIORITY_STYLE[pr.priority] || PRIORITY_STYLE.medium
            const budgetNum    = parseFloat(pr.budget) || 0
            const spentNum     = parseFloat(pr.spentBudget) || 0
            const pct          = budgetNum > 0 ? Math.min(100, (spentNum / budgetNum) * 100) : 0
            const barColor     = pct >= 90 ? '#C8102E' : pct >= 70 ? '#FB8C00' : '#43A047'
            const tasksDone    = pr.tasks?.filter(t => t.done).length || 0
            const tasksTotal   = pr.tasks?.length || 0
            const taskPct      = tasksTotal > 0 ? (tasksDone / tasksTotal * 100) : 0
            const openProblems = pr.problems?.filter(pb => !pb.resolved).length || 0

            return (
              <div key={pr.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardBadges}>
                    <span className={styles.statusBadge} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      <span className={styles.statusDot} style={{ background: statusStyle.dot }} />
                      {p.statuses[pr.status]}
                    </span>
                    <span className={styles.priorityBadge} style={{ background: priorityStyle.bg, color: priorityStyle.color }}>
                      {p.priorities[pr.priority]}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(pr)} title={p.edit}>
                      <Pencil size={14} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => setDeleteId(pr.id)} title={p.delete}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{pr.name}</h3>
                {pr.clientName && <p className={styles.cardClient}>{pr.clientName}</p>}

                {pr.address && (
                  <div className={styles.cardMeta}>
                    <MapPin size={12} />
                    <span>{pr.address}</span>
                  </div>
                )}

                <div className={styles.cardDates}>
                  <div className={styles.cardDate}><CalendarDays size={12} /><span>{fmtDate(pr.startDate)}</span></div>
                  <span className={styles.dateSep}>→</span>
                  <div className={styles.cardDate}><CalendarDays size={12} /><span>{fmtDate(pr.estimatedEndDate)}</span></div>
                </div>

                {budgetNum > 0 && (
                  <div className={styles.budgetSection}>
                    <div className={styles.budgetLabels}>
                      <span className={styles.budgetLabel}>{p.budget}</span>
                      <span className={styles.budgetValues}>
                        <span style={{ color: barColor, fontWeight: 600 }}>{fmtEur(spentNum)}</span>
                        <span className={styles.budgetSep}>/</span>
                        {fmtEur(budgetNum)}
                      </span>
                    </div>
                    <div className={styles.budgetTrack}>
                      <div className={styles.budgetFill} style={{ width: pct + '%', background: barColor }} />
                    </div>
                  </div>
                )}

                {tasksTotal > 0 && (
                  <div className={styles.taskSection}>
                    <div className={styles.taskLabels}>
                      <span className={styles.taskLabel}>Taken</span>
                      <span className={styles.taskCount}>{tasksDone}/{tasksTotal}</span>
                    </div>
                    <div className={styles.taskTrack}>
                      <div className={styles.taskFill} style={{ width: taskPct + '%' }} />
                    </div>
                  </div>
                )}

                <div className={styles.cardFooter}>
                  {openProblems > 0 && (
                    <span className={styles.chip} style={{ background: '#FFEBEE', color: '#B71C1C' }}>
                      <AlertTriangle size={11} />
                      {openProblems} probleem{openProblems > 1 ? 'en' : ''}
                    </span>
                  )}
                  {pr.attachments?.length > 0 && (
                    <span className={styles.chip} style={{ background: 'var(--grey-100)', color: 'var(--grey-700)' }}>
                      <Paperclip size={11} />
                      {pr.attachments.length} bijlage{pr.attachments.length > 1 ? 'n' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.tableFooter}>
        {filtered.length} / {projects.length} projecten
      </div>

      {formOpen && (
        <ProjectForm
          project={editTarget}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}

      {deleteId !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>{p.confirmDelete}</h3>
            <p className={styles.modalMsg}>{p.confirmDeleteMsg}</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>{p.cancel}</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(deleteId)}>{p.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent, wide }) {
  return (
    <div className={`${styles.statCard} ${styles['accent_' + accent]} ${wide ? styles.statWide : ''}`}>
      <div className={styles.statIcon}><Icon size={16} /></div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  )
}