import { useState, useMemo, useEffect } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, X,
  CalendarDays, Clock, User, Briefcase, Filter
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import PlanningForm from './PlanningForm'
import styles from './PlanningPage.module.css'

const DAYS_NL = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS_NL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

const TYPE_LABELS = {
  sloop:        { nl: 'Sloopwerk',    en: 'Demolition' },
  installatie:  { nl: 'Installatie',  en: 'Installation' },
  specialisme:  { nl: 'Specialisme',  en: 'Specialist' },
  administratie:{ nl: 'Administratie',en: 'Administration' },
  inspectie:    { nl: 'Inspectie',    en: 'Inspection' },
  afwerking:    { nl: 'Afwerking',    en: 'Finishing' },
  overig:       { nl: 'Overig',       en: 'Other' },
}

const STATUS_STYLE = {
  planned:     { bg: '#E3F2FD', color: '#1565C0' },
  in_progress: { bg: '#FFF3E0', color: '#E65100' },
  done:        { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled:   { bg: '#F5F5F5', color: '#757575' },
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(monday); nd.setDate(monday.getDate() + i); return nd
  })
}

function isoDate(d) { return d.toISOString().slice(0, 10) }

// Support snake_case (DB) and camelCase (form)
function g(o, camel, snake) { return o[camel] !== undefined ? o[camel] : o[snake] }

function eventOverlapsDay(ev, dayStr) {
  const start = g(ev, 'startDate', 'start_date') || ''
  const end   = g(ev, 'endDate',   'end_date')   || ''
  return start <= dayStr && end >= dayStr
}

export default function PlanningPage() {
  const { lang } = useLang()
  const DAYS   = lang === 'nl' ? DAYS_NL   : DAYS_EN
  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [events,        setEvents]        = useState([])
  const [projects,      setProjects]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [baseDate,      setBaseDate]      = useState(new Date())
  const [view,          setView]          = useState('week')
  const [filterProject, setFilterProject] = useState('')
  const [filterType,    setFilterType]    = useState('')
  const [formOpen,      setFormOpen]      = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [selected,      setSelected]      = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [ev, pr] = await Promise.all([api.get('/planning'), api.get('/projects')])
      setEvents(ev); setProjects(pr)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])

  const filtered = useMemo(() => events.filter(ev => {
    if (filterProject && String(g(ev,'projectId','project_id')) !== filterProject) return false
    if (filterType    && ev.type !== filterType) return false
    return true
  }), [events, filterProject, filterType])

  function prevWeek() { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d) }
  function nextWeek() { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d) }
  function goToday()  { setBaseDate(new Date()) }

  function openAdd(date) { setEditTarget(date ? { startDate: isoDate(date), endDate: isoDate(date) } : null); setFormOpen(true) }
  function openEdit(ev)  { setEditTarget(ev); setFormOpen(true) }
  function closeForm()   { setFormOpen(false); setEditTarget(null) }

  async function handleSave(data) {
    try {
      const payload = {
        title:       data.title,
        projectId:   data.projectId   || data.project_id   || null,
        projectName: data.projectName || data.project_name || '',
        assignee:    data.assignee    || '',
        startDate:   data.startDate   || data.start_date,
        endDate:     data.endDate     || data.end_date,
        startTime:   data.startTime   || data.start_time   || '08:00',
        endTime:     data.endTime     || data.end_time     || '17:00',
        type:        data.type        || 'overig',
        status:      data.status      || 'planned',
        color:       data.color       || '#1A3E6F',
        notes:       data.notes       || '',
      }
      if (data.id) {
        const updated = await api.put(`/planning/${data.id}`, payload)
        setEvents(es => es.map(e => e.id === data.id ? updated : e))
      } else {
        const created = await api.post('/planning', payload)
        setEvents(es => [...es, created])
      }
    } catch (e) { alert(e.message) }
    closeForm()
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/planning/${id}`)
      setEvents(es => es.filter(e => e.id !== id))
      setSelected(null)
    } catch (e) { alert(e.message) }
  }

  const todayStr  = isoDate(new Date())
  const weekStart = weekDates[0]
  const weekEnd   = weekDates[6]
  const weekLabel = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} — ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  if (loading) return <PlanningSkeleton lang={lang} DAYS={DAYS} MONTHS={MONTHS} lbl={lbl} />

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Planning', 'Planning')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Weekoverzicht van alle werkzaamheden', 'Weekly overview of all work')}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'week' ? styles.viewBtnActive : ''}`} onClick={() => setView('week')}>
              <CalendarDays size={14}/> {lbl('Week', 'Week')}
            </button>
            <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')}>
              ☰ {lbl('Lijst', 'List')}
            </button>
          </div>
          <button className={styles.addBtn} onClick={() => openAdd(null)}>
            <Plus size={16}/> {lbl('Inplannen', 'Schedule')}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.navGroup}>
          <button className={styles.navBtn} onClick={prevWeek}><ChevronLeft size={16}/></button>
          <span className={styles.weekLabel}>{weekLabel}</span>
          <button className={styles.navBtn} onClick={nextWeek}><ChevronRight size={16}/></button>
          <button className={styles.todayBtn} onClick={goToday}>{lbl('Vandaag', 'Today')}</button>
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-300)' }}/>
          <select className={styles.filterSelect} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">{lbl('Alle projecten', 'All projects')}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">{lbl('Alle types', 'All types')}</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'nl' ? v.nl : v.en}</option>
            ))}
          </select>
        </div>
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div className={styles.calendarWrap}>
          <div className={styles.calendar}>
            {weekDates.map((date, i) => {
              const isToday = isoDate(date) === todayStr
              return (
                <div key={i} className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
                  <span className={styles.dayName}>{DAYS[date.getDay()]}</span>
                  <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ''}`}>{date.getDate()}</span>
                </div>
              )
            })}
            {weekDates.map((date, i) => {
              const dayStr    = isoDate(date)
              const dayEvents = filtered.filter(ev => eventOverlapsDay(ev, dayStr))
              const isToday   = dayStr === todayStr
              return (
                <div key={i} className={`${styles.dayCol} ${isToday ? styles.dayColToday : ''}`}
                  onClick={() => openAdd(date)}>
                  {dayEvents.map(ev => (
                    <div key={ev.id} className={styles.eventPill}
                      style={{ background: (ev.color || '#1A3E6F') + '22', borderLeft: `3px solid ${ev.color || '#1A3E6F'}` }}
                      onClick={e => { e.stopPropagation(); setSelected(ev) }}>
                      <span className={styles.eventTime}>{g(ev,'startTime','start_time')}</span>
                      <span className={styles.eventTitle}>{ev.title}</span>
                      {ev.assignee && <span className={styles.eventAssignee}><User size={9}/>{ev.assignee}</span>}
                    </div>
                  ))}
                  {dayEvents.length === 0 && <div className={styles.emptyDay}/>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className={styles.listWrap}>
          {filtered.length === 0
            ? <div className={styles.empty}><p>{lbl('Geen activiteiten gevonden', 'No activities found')}</p></div>
            : [...filtered].sort((a, b) => (g(a,'startDate','start_date') || '').localeCompare(g(b,'startDate','start_date') || '')).map(ev => {
              const st = STATUS_STYLE[ev.status] || STATUS_STYLE.planned
              return (
                <div key={ev.id} className={styles.listRow} onClick={() => setSelected(ev)}>
                  <div className={styles.listColor} style={{ background: ev.color || '#1A3E6F' }}/>
                  <div className={styles.listMain}>
                    <span className={styles.listTitle}>{ev.title}</span>
                    {g(ev,'projectName','project_name') && <span className={styles.listProject}><Briefcase size={11}/>{g(ev,'projectName','project_name')}</span>}
                  </div>
                  <div className={styles.listMeta}>
                    <span className={styles.listDate}><CalendarDays size={12}/>{g(ev,'startDate','start_date')} → {g(ev,'endDate','end_date')}</span>
                    <span className={styles.listTime}><Clock size={12}/>{g(ev,'startTime','start_time')} – {g(ev,'endTime','end_time')}</span>
                    {ev.assignee && <span className={styles.listAssignee}><User size={12}/>{ev.assignee}</span>}
                  </div>
                  <span className={styles.listStatus} style={{ background: st.bg, color: st.color }}>
                    {lang === 'nl'
                      ? { planned:'Gepland', in_progress:'Lopend', done:'Klaar', cancelled:'Geannuleerd' }[ev.status]
                      : { planned:'Planned', in_progress:'In progress', done:'Done', cancelled:'Cancelled' }[ev.status]
                    }
                  </span>
                </div>
              )
            })
          }
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <div className={styles.detailOverlay} onClick={() => setSelected(null)}>
          <div className={styles.detailCard} onClick={e => e.stopPropagation()}>
            <div className={styles.detailHeader} style={{ borderLeft: `4px solid ${selected.color || '#1A3E6F'}` }}>
              <div>
                <h3 className={styles.detailTitle}>{selected.title}</h3>
                {g(selected,'projectName','project_name') && <p className={styles.detailProject}>{g(selected,'projectName','project_name')}</p>}
              </div>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={16}/></button>
            </div>
            <div className={styles.detailBody}>
              <DetailRow icon={CalendarDays} label={lbl('Periode','Period')} value={`${g(selected,'startDate','start_date')} → ${g(selected,'endDate','end_date')}`}/>
              <DetailRow icon={Clock}        label={lbl('Tijd','Time')}     value={`${g(selected,'startTime','start_time')} – ${g(selected,'endTime','end_time')}`}/>
              {selected.assignee && <DetailRow icon={User} label={lbl('Uitvoerder','Assignee')} value={selected.assignee}/>}
              {selected.notes && (
                <div className={styles.detailNotes}>
                  <p className={styles.detailNotesLabel}>{lbl('Notities','Notes')}</p>
                  <p>{selected.notes}</p>
                </div>
              )}
            </div>
            <div className={styles.detailFooter}>
              <button className={styles.deleteSmBtn} onClick={() => handleDelete(selected.id)}>
                {lbl('Verwijderen','Delete')}
              </button>
              <button className={styles.editSmBtn} onClick={() => { openEdit(selected); setSelected(null) }}>
                {lbl('Bewerken','Edit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {formOpen && <PlanningForm event={editTarget} projects={projects} onSave={handleSave} onClose={closeForm}/>}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className={styles.detailRow}>
      <Icon size={14} className={styles.detailIcon}/>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
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

function SkeletonEventPill({ index }) {
  const widths = ['60%', '75%', '55%', '70%']
  return (
    <div className={styles.eventPill}
      style={{
        background: '#f5f5f5',
        borderLeft: '3px solid #e0e0e0',
        pointerEvents: 'none',
        opacity: 0.85,
      }}>
      <Shimmer w={34} h={10} style={{ marginBottom: 4 }} />
      <Shimmer w={widths[index % widths.length]} h={11} style={{ marginBottom: 4 }} />
      <Shimmer w={45} h={9} />
    </div>
  )
}

function SkeletonListRow({ index }) {
  const widths = ['55%', '70%', '60%', '65%']
  return (
    <div className={styles.listRow} style={{ pointerEvents: 'none' }}>
      <Shimmer w={4} h={44} r={2} />
      <div className={styles.listMain} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer w={widths[index % widths.length]} h={13} />
        <Shimmer w={120} h={10} />
      </div>
      <div className={styles.listMeta} style={{ display: 'flex', gap: 16 }}>
        <Shimmer w={140} h={11} />
        <Shimmer w={90} h={11} />
        <Shimmer w={80} h={11} />
      </div>
      <Shimmer w={70} h={20} r={10} />
    </div>
  )
}

function PlanningSkeleton({ lang, DAYS, MONTHS, lbl }) {
  // Fake dates pour l'en-tête de semaine
  const fakeWeekDates = (() => {
    const d = new Date()
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(monday); nd.setDate(monday.getDate() + i); return nd
    })
  })()

  const todayStr = isoDate(new Date())

  // Nombre d'events fantômes par jour (varié pour un rendu naturel)
  const eventsPerDay = [2, 1, 3, 0, 2, 1, 2]

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
          <h1 className={styles.pageTitle}>{lbl('Planning', 'Planning')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Weekoverzicht van alle werkzaamheden', 'Weekly overview of all work')}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <Shimmer w={90} h={32} r={6} />
            <Shimmer w={90} h={32} r={6} />
          </div>
          <Shimmer w={120} h={36} r={8} />
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.navGroup}>
          <Shimmer w={32} h={32} r={6} />
          <Shimmer w={200} h={16} />
          <Shimmer w={32} h={32} r={6} />
          <Shimmer w={80} h={32} r={6} />
        </div>
        <div className={styles.filters}>
          <Shimmer w={14} h={14} r={4} />
          <Shimmer w={150} h={36} r={8} />
          <Shimmer w={130} h={36} r={8} />
        </div>
      </div>

      {/* Week calendar */}
      <div className={styles.calendarWrap}>
        <div className={styles.calendar}>
          {fakeWeekDates.map((date, i) => {
            const isToday = isoDate(date) === todayStr
            return (
              <div key={i} className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
                <span className={styles.dayName}>{DAYS[date.getDay()]}</span>
                <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ''}`}>{date.getDate()}</span>
              </div>
            )
          })}
          {fakeWeekDates.map((date, i) => {
            const isToday = isoDate(date) === todayStr
            const count   = eventsPerDay[i]
            return (
              <div key={i}
                className={`${styles.dayCol} ${isToday ? styles.dayColToday : ''}`}
                style={{ pointerEvents: 'none' }}>
                {Array.from({ length: count }).map((_, j) => (
                  <SkeletonEventPill key={j} index={j + i} />
                ))}
                {count === 0 && <div className={styles.emptyDay}/>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PlanningListSkeleton() {
  return (
    <div className={styles.listWrap}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonListRow key={i} index={i} />
      ))}
    </div>
  )
}