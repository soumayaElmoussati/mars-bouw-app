import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, Trash2, Pencil,
  CheckSquare, Square, Calendar, User,
  Briefcase, Tag, AlertTriangle, Clock
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import TaskForm from './TaskForm'
import styles from './TasksPage.module.css'

const PRIORITY_STYLE = {
  low:    { bg: '#F1F8E9', color: '#558B2F', label_nl: 'Laag',   label_en: 'Low' },
  medium: { bg: '#E3F2FD', color: '#1565C0', label_nl: 'Normaal',label_en: 'Medium' },
  high:   { bg: '#FFF3E0', color: '#E65100', label_nl: 'Hoog',   label_en: 'High' },
  urgent: { bg: '#FFEBEE', color: '#B71C1C', label_nl: 'Urgent', label_en: 'Urgent' },
}

const STATUS_COLS = ['todo', 'in_progress', 'done']
const COL_LABELS = {
  todo:        { nl: 'Te doen',  en: 'To do' },
  in_progress: { nl: 'Bezig',    en: 'In progress' },
  done:        { nl: 'Afgerond', en: 'Done' },
}
const COL_COLORS = {
  todo: '#1A3E6F', in_progress: '#E65100', done: '#2E7D32'
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false
  return task.dueDate < new Date().toISOString().slice(0, 10)
}

function fmtDate(d) {
  if (!d) return ''
  const raw = d.includes('T') ? d.slice(0, 10) : d
  const [y, m, day] = raw.split('-')
  return `${day}-${m}-${y}`
}

// API (snake_case) → UI (camelCase)
function fromApi(row) {
  return {
    id:          row.id,
    title:       row.title || '',
    description: row.description || '',
    projectId:   row.project_id || '',
    projectName: row.project_name || '',
    assignee:    row.assignee || '',
    dueDate:     row.due_date ? row.due_date.slice(0, 10) : '',
    priority:    row.priority || 'medium',
    status:      row.status || 'todo',
    category:    row.category || '',
    tags:        row.tags || [],
    createdAt:   row.created_at ? row.created_at.slice(0, 10) : '',
  }
}

// UI (camelCase) → API (camelCase, le backend attend ça)
function toApi(data) {
  return {
    title:       data.title,
    description: data.description || null,
    projectId:   data.projectId || null,
    projectName: data.projectName || null,
    assignee:    data.assignee || null,
    dueDate:     data.dueDate || null,
    priority:    data.priority || 'medium',
    status:      data.status || 'todo',
    category:    data.category || null,
    tags:        data.tags || [],
  }
}

export default function TasksPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [tasks, setTasks]             = useState([])
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterProject, setFilterProject]   = useState('')
  const [view, setView]               = useState('kanban')
  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteId, setDeleteId]       = useState(null)
  const [saving, setSaving]           = useState(false)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await api.get('/tasks')
      setTasks(rows.map(fromApi))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const rows = await api.get('/projects')
      setProjects(rows.map(r => ({ id: r.id, name: r.name })))
    } catch { /* silencieux */ }
  }, [])

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterProject && String(t.projectId) !== String(filterProject)) return false
      return true
    })
  }, [tasks, search, filterPriority, filterProject])

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
  }), [tasks])

  function openAdd()     { setEditTarget(null); setFormOpen(true) }
  function openEdit(t)   { setEditTarget(t);    setFormOpen(true) }
  function closeForm()   { setFormOpen(false);  setEditTarget(null) }

  // ── Save (create/update) ────────────────────────────────────
  async function handleSave(data) {
    setSaving(true)
    try {
      if (data.id) {
        const updated = await api.put(`/tasks/${data.id}`, toApi(data))
        setTasks(ts => ts.map(t => t.id === data.id ? fromApi(updated) : t))
      } else {
        const created = await api.post('/tasks', toApi(data))
        setTasks(ts => [fromApi(created), ...ts])
      }
      closeForm()
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle done ─────────────────────────────────────────────
  async function toggleDone(id) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    const nextStatus = t.status === 'done' ? 'todo' : 'done'
    // Optimistic update
    setTasks(ts => ts.map(x => x.id === id ? { ...x, status: nextStatus } : x))
    try {
      await api.patch(`/tasks/${id}/status`, { status: nextStatus })
    } catch (e) {
      // Rollback
      setTasks(ts => ts.map(x => x.id === id ? { ...x, status: t.status } : x))
      alert('Update mislukt: ' + e.message)
    }
  }

  // ── Move (kanban) ───────────────────────────────────────────
  async function moveTask(id, status) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    // Optimistic
    setTasks(ts => ts.map(x => x.id === id ? { ...x, status } : x))
    try {
      await api.patch(`/tasks/${id}/status`, { status })
    } catch (e) {
      setTasks(ts => ts.map(x => x.id === id ? { ...x, status: t.status } : x))
      alert('Verplaatsen mislukt: ' + e.message)
    }
  }

  // ── Delete ──────────────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(ts => ts.filter(t => t.id !== id))
      setDeleteId(null)
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Taken', 'Tasks')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Overzicht van alle openstaande taken', 'Overview of all open tasks')}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewBtnActive : ''}`} onClick={() => setView('kanban')}>
              ⊞ {lbl('Kanban', 'Kanban')}
            </button>
            <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')}>
              ☰ {lbl('Lijst', 'List')}
            </button>
          </div>
          <button className={styles.addBtn} onClick={openAdd}>
            <Plus size={16} /> {lbl('Nieuwe taak', 'New task')}
          </button>
        </div>
      </div>

      {loading ? (
        <TasksSkeleton lang={lang} lbl={lbl} view={view} />
      ) : error ? (
        <p style={{ padding: 24, textAlign: 'center', color: '#C8102E' }}>Fout: {error}</p>
      ) : (
        <>
          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}><span className={styles.statNum}>{stats.total}</span><span className={styles.statLbl}>{lbl('Totaal', 'Total')}</span></div>
            <div className={styles.stat}><span className={styles.statNum} style={{ color: '#1565C0' }}>{stats.todo}</span><span className={styles.statLbl}>{lbl('Te doen', 'To do')}</span></div>
            <div className={styles.stat}><span className={styles.statNum} style={{ color: '#E65100' }}>{stats.inProgress}</span><span className={styles.statLbl}>{lbl('Bezig', 'In progress')}</span></div>
            <div className={styles.stat}><span className={styles.statNum} style={{ color: '#2E7D32' }}>{stats.done}</span><span className={styles.statLbl}>{lbl('Afgerond', 'Done')}</span></div>
            {stats.overdue > 0 && (
              <div className={styles.stat}>
                <span className={styles.statNum} style={{ color: '#C8102E' }}>{stats.overdue}</span>
                <span className={styles.statLbl}>{lbl('Verlopen', 'Overdue')}</span>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder={lbl('Taken zoeken…', 'Search tasks…')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filters}>
              <Filter size={14} style={{ color: 'var(--grey-300)' }} />
              <select className={styles.filterSelect} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">{lbl('Alle prioriteiten', 'All priorities')}</option>
                {Object.entries(PRIORITY_STYLE).map(([k, v]) => (
                  <option key={k} value={k}>{lang === 'nl' ? v.label_nl : v.label_en}</option>
                ))}
              </select>
              <select className={styles.filterSelect} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="">{lbl('Alle projecten', 'All projects')}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* KANBAN VIEW */}
          {view === 'kanban' && (
            <div className={styles.kanban}>
              {STATUS_COLS.map(col => {
                const colTasks = filtered.filter(t => t.status === col)
                return (
                  <div key={col} className={styles.kanbanCol}>
                    <div className={styles.kanbanHeader}>
                      <span className={styles.kanbanDot} style={{ background: COL_COLORS[col] }} />
                      <span className={styles.kanbanTitle}>{lang === 'nl' ? COL_LABELS[col].nl : COL_LABELS[col].en}</span>
                      <span className={styles.kanbanCount}>{colTasks.length}</span>
                    </div>
                    <div className={styles.kanbanCards}>
                      {colTasks.length === 0 && (
                        <div className={styles.emptyCol}>{lbl('Geen taken', 'No tasks')}</div>
                      )}
                      {colTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          lang={lang}
                          onToggle={() => toggleDone(task.id)}
                          onEdit={() => openEdit(task)}
                          onDelete={() => setDeleteId(task.id)}
                          onMove={status => moveTask(task.id, status)}
                          allCols={STATUS_COLS}
                          colLabels={COL_LABELS}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div className={styles.listWrap}>
              {[...filtered].sort((a, b) => {
                const order = { urgent: 0, high: 1, medium: 2, low: 3 }
                return (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
              }).map(task => {
                const overdue = isOverdue(task)
                const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium
                return (
                  <div key={task.id} className={`${styles.listRow} ${task.status === 'done' ? styles.listRowDone : ''}`}>
                    <button className={styles.checkBtn} onClick={() => toggleDone(task.id)}>
                      {task.status === 'done'
                        ? <CheckSquare size={18} className={styles.checkDone} />
                        : <Square size={18} className={styles.checkEmpty} />}
                    </button>
                    <div className={styles.listMain}>
                      <span className={`${styles.listTitle} ${task.status === 'done' ? styles.strikethrough : ''}`}>{task.title}</span>
                      <div className={styles.listMeta}>
                        {task.projectName && <span className={styles.metaItem}><Briefcase size={11} />{task.projectName}</span>}
                        {task.assignee   && <span className={styles.metaItem}><User size={11} />{task.assignee}</span>}
                        {task.dueDate    && (
                          <span className={`${styles.metaItem} ${overdue ? styles.metaOverdue : ''}`}>
                            <Calendar size={11} />{fmtDate(task.dueDate)}
                            {overdue && <AlertTriangle size={10} />}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={styles.priorityBadge} style={{ background: ps.bg, color: ps.color }}>
                      {lang === 'nl' ? ps.label_nl : ps.label_en}
                    </span>
                    <div className={styles.listActions}>
                      <button className={styles.actionBtn} onClick={() => openEdit(task)}><Pencil size={13} /></button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => setDeleteId(task.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Form */}
      {formOpen && (
        <TaskForm
          task={editTarget}
          projects={projects}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>{lbl('Taak verwijderen?', 'Delete task?')}</h3>
            <p className={styles.modalMsg}>{lbl('Deze actie kan niet ongedaan worden gemaakt.', 'This action cannot be undone.')}</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>{lbl('Annuleren', 'Cancel')}</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(deleteId)}>{lbl('Verwijderen', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, lang, onToggle, onEdit, onDelete, onMove, allCols, colLabels }) {
  const overdue = isOverdue(task)
  const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.priorityBadge} style={{ background: ps.bg, color: ps.color }}>
          {lang === 'nl' ? ps.label_nl : ps.label_en}
        </span>
        <div className={styles.cardActions}>
          <button className={styles.actionBtn} onClick={onEdit}><Pencil size={13} /></button>
          <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={onDelete}><Trash2 size={13} /></button>
        </div>
      </div>

      <div className={styles.cardTitleRow}>
        <button className={styles.checkBtn} onClick={onToggle}>
          {task.status === 'done'
            ? <CheckSquare size={16} className={styles.checkDone} />
            : <Square size={16} className={styles.checkEmpty} />}
        </button>
        <span className={`${styles.cardTitle} ${task.status === 'done' ? styles.strikethrough : ''}`}>{task.title}</span>
      </div>

      {task.description && <p className={styles.cardDesc}>{task.description}</p>}

      <div className={styles.cardMeta}>
        {task.projectName && <span className={styles.metaItem}><Briefcase size={11} />{task.projectName}</span>}
        {task.assignee    && <span className={styles.metaItem}><User size={11} />{task.assignee}</span>}
        {task.dueDate     && (
          <span className={`${styles.metaItem} ${overdue ? styles.metaOverdue : ''}`}>
            <Calendar size={11} />{fmtDate(task.dueDate)}
            {overdue && <AlertTriangle size={10} />}
          </span>
        )}
      </div>

      {task.tags?.length > 0 && (
        <div className={styles.tags}>
          {task.tags.map(tag => <span key={tag} className={styles.tag}><Tag size={9} />{tag}</span>)}
        </div>
      )}

      <div className={styles.moveBtns}>
        {allCols.filter(c => c !== task.status).map(c => (
          <button key={c} className={styles.moveBtn} onClick={() => onMove(c)}>
            → {lang === 'nl' ? colLabels[c].nl : colLabels[c].en}
          </button>
        ))}
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

function SkeletonTaskCard({ index }) {
  const titleWidths = ['70%', '85%', '60%', '75%', '65%']
  const descWidths  = ['90%', '80%', '95%', '70%']

  return (
    <div className={styles.card} style={{ pointerEvents: 'none' }}>
      <div className={styles.cardTop}>
        <Shimmer w={65} h={18} r={9} />
        <div className={styles.cardActions}>
          <Shimmer w={24} h={24} r={5} />
          <Shimmer w={24} h={24} r={5} />
        </div>
      </div>

      <div className={styles.cardTitleRow}>
        <Shimmer w={16} h={16} r={4} />
        <Shimmer w={titleWidths[index % titleWidths.length]} h={13} />
      </div>

      <div style={{ marginTop: 8, marginBottom: 10 }}>
        <Shimmer w={descWidths[index % descWidths.length]} h={10} style={{ marginBottom: 5 }} />
        <Shimmer w={`${55 + (index % 3) * 10}%`} h={10} />
      </div>

      <div className={styles.cardMeta} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <Shimmer w={80} h={10} />
        <Shimmer w={60} h={10} />
        <Shimmer w={70} h={10} />
      </div>

      <div className={styles.moveBtns} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <Shimmer w={75} h={22} r={6} />
        <Shimmer w={75} h={22} r={6} />
      </div>
    </div>
  )
}

function SkeletonKanbanColumn({ col, count, lang, lbl }) {
  return (
    <div className={styles.kanbanCol}>
      <div className={styles.kanbanHeader}>
        <span className={styles.kanbanDot} style={{ background: COL_COLORS[col] }} />
        <span className={styles.kanbanTitle}>{lang === 'nl' ? COL_LABELS[col].nl : COL_LABELS[col].en}</span>
        <Shimmer w={22} h={18} r={9} />
      </div>
      <div className={styles.kanbanCards}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonTaskCard key={i} index={i} />
        ))}
      </div>
    </div>
  )
}

function SkeletonListRow({ index }) {
  const widths = ['55%', '70%', '60%', '65%', '80%']
  return (
    <div className={styles.listRow} style={{ pointerEvents: 'none' }}>
      <Shimmer w={18} h={18} r={4} />
      <div className={styles.listMain} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer w={widths[index % widths.length]} h={13} />
        <div style={{ display: 'flex', gap: 12 }}>
          <Shimmer w={80} h={10} />
          <Shimmer w={65} h={10} />
          <Shimmer w={70} h={10} />
        </div>
      </div>
      <Shimmer w={65} h={20} r={10} />
      <div className={styles.listActions} style={{ display: 'flex', gap: 4 }}>
        <Shimmer w={26} h={26} r={5} />
        <Shimmer w={26} h={26} r={5} />
      </div>
    </div>
  )
}

function TasksSkeleton({ lang, lbl, view }) {
  // Nombre de cartes fantômes par colonne (varié pour un rendu naturel)
  const kanbanCounts = { todo: 3, in_progress: 2, done: 2 }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Stats row */}
      <div className={styles.statsRow}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={styles.stat}>
            <Shimmer w={32} h={22} style={{ marginBottom: 6 }} />
            <Shimmer w={60} h={11} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Shimmer w={15} h={15} r={4} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <Shimmer w="100%" h={36} r={8} />
        </div>
        <div className={styles.filters}>
          <Shimmer w={14} h={14} r={4} />
          <Shimmer w={140} h={36} r={8} />
          <Shimmer w={140} h={36} r={8} />
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className={styles.kanban}>
          {STATUS_COLS.map(col => (
            <SkeletonKanbanColumn
              key={col}
              col={col}
              count={kanbanCounts[col]}
              lang={lang}
              lbl={lbl}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className={styles.listWrap}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonListRow key={i} index={i} />
          ))}
        </div>
      )}
    </>
  )
}