import { useState, useMemo } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, X,
  CalendarDays, Clock, User, Briefcase, Filter
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { planningSeed } from '../../data/planningSeed'
import { projectsSeed } from '../../data/projectsSeed'
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
    const nd = new Date(monday)
    nd.setDate(monday.getDate() + i)
    return nd
  })
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function eventOverlapsDay(ev, dayStr) {
  return ev.startDate <= dayStr && ev.endDate >= dayStr
}

export default function PlanningPage() {
  const { lang, t } = useLang()
  const DAYS   = lang === 'nl' ? DAYS_NL   : DAYS_EN
  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN

  const [events, setEvents] = useState(planningSeed)
  const [baseDate, setBaseDate] = useState(new Date())
  const [view, setView] = useState('week') // 'week' | 'list'
  const [filterProject, setFilterProject] = useState('')
  const [filterType, setFilterType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [selected, setSelected] = useState(null)

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])

  const filtered = useMemo(() => events.filter(ev => {
    if (filterProject && String(ev.projectId) !== filterProject) return false
    if (filterType && ev.type !== filterType) return false
    return true
  }), [events, filterProject, filterType])

  function prevWeek() { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d) }
  function nextWeek() { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d) }
  function goToday()  { setBaseDate(new Date()) }

  function openAdd(date)   { setEditTarget(date ? { startDate: isoDate(date), endDate: isoDate(date) } : null); setFormOpen(true) }
  function openEdit(ev)    { setEditTarget(ev); setFormOpen(true) }
  function closeForm()     { setFormOpen(false); setEditTarget(null) }

  function handleSave(data) {
    if (data.id) {
      setEvents(es => es.map(e => e.id === data.id ? data : e))
    } else {
      const newId = Math.max(0, ...events.map(e => e.id)) + 1
      setEvents(es => [...es, { ...data, id: newId }])
    }
    closeForm()
  }

  function handleDelete(id) {
    setEvents(es => es.filter(e => e.id !== id))
    setSelected(null)
  }

  const todayStr = isoDate(new Date())

  // Week label
  const weekStart = weekDates[0]
  const weekEnd   = weekDates[6]
  const weekLabel = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} — ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lang === 'nl' ? 'Planning' : 'Planning'}</h1>
          <p className={styles.pageSubtitle}>{lang === 'nl' ? 'Weekoverzicht van alle werkzaamheden' : 'Weekly overview of all work'}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'week' ? styles.viewBtnActive : ''}`} onClick={() => setView('week')}>
              <CalendarDays size={14} /> {lang === 'nl' ? 'Week' : 'Week'}
            </button>
            <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')}>
              ☰ {lang === 'nl' ? 'Lijst' : 'List'}
            </button>
          </div>
          <button className={styles.addBtn} onClick={() => openAdd(null)}>
            <Plus size={16} /> {lang === 'nl' ? 'Inplannen' : 'Schedule'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.navGroup}>
          <button className={styles.navBtn} onClick={prevWeek}><ChevronLeft size={16} /></button>
          <span className={styles.weekLabel}>{weekLabel}</span>
          <button className={styles.navBtn} onClick={nextWeek}><ChevronRight size={16} /></button>
          <button className={styles.todayBtn} onClick={goToday}>{lang === 'nl' ? 'Vandaag' : 'Today'}</button>
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-300)' }} />
          <select className={styles.filterSelect} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">{lang === 'nl' ? 'Alle projecten' : 'All projects'}</option>
            {projectsSeed.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">{lang === 'nl' ? 'Alle types' : 'All types'}</option>
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
            {/* Day headers */}
            {weekDates.map((date, i) => {
              const isToday = isoDate(date) === todayStr
              return (
                <div key={i} className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
                  <span className={styles.dayName}>{DAYS[date.getDay()]}</span>
                  <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ''}`}>{date.getDate()}</span>
                </div>
              )
            })}

            {/* Day columns */}
            {weekDates.map((date, i) => {
              const dayStr = isoDate(date)
              const dayEvents = filtered.filter(ev => eventOverlapsDay(ev, dayStr))
              const isToday = dayStr === todayStr
              return (
                <div
                  key={i}
                  className={`${styles.dayCol} ${isToday ? styles.dayColToday : ''}`}
                  onClick={() => openAdd(date)}
                >
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      className={styles.eventPill}
                      style={{ background: ev.color + '22', borderLeft: `3px solid ${ev.color}` }}
                      onClick={e => { e.stopPropagation(); setSelected(ev) }}
                    >
                      <span className={styles.eventTime}>{ev.startTime}</span>
                      <span className={styles.eventTitle}>{ev.title}</span>
                      {ev.assignee && <span className={styles.eventAssignee}><User size={9} />{ev.assignee}</span>}
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className={styles.emptyDay} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className={styles.listWrap}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>{lang === 'nl' ? 'Geen activiteiten gevonden' : 'No activities found'}</p>
            </div>
          ) : (
            [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate)).map(ev => {
              const st = STATUS_STYLE[ev.status] || STATUS_STYLE.planned
              return (
                <div key={ev.id} className={styles.listRow} onClick={() => setSelected(ev)}>
                  <div className={styles.listColor} style={{ background: ev.color }} />
                  <div className={styles.listMain}>
                    <span className={styles.listTitle}>{ev.title}</span>
                    {ev.projectName && <span className={styles.listProject}><Briefcase size={11} />{ev.projectName}</span>}
                  </div>
                  <div className={styles.listMeta}>
                    <span className={styles.listDate}><CalendarDays size={12} />{ev.startDate} → {ev.endDate}</span>
                    <span className={styles.listTime}><Clock size={12} />{ev.startTime} – {ev.endTime}</span>
                    {ev.assignee && <span className={styles.listAssignee}><User size={12} />{ev.assignee}</span>}
                  </div>
                  <span className={styles.listStatus} style={{ background: st.bg, color: st.color }}>
                    {lang === 'nl'
                      ? { planned: 'Gepland', in_progress: 'Lopend', done: 'Klaar', cancelled: 'Geannuleerd' }[ev.status]
                      : { planned: 'Planned', in_progress: 'In progress', done: 'Done', cancelled: 'Cancelled' }[ev.status]
                    }
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <div className={styles.detailOverlay} onClick={() => setSelected(null)}>
          <div className={styles.detailCard} onClick={e => e.stopPropagation()}>
            <div className={styles.detailHeader} style={{ borderLeft: `4px solid ${selected.color}` }}>
              <div>
                <h3 className={styles.detailTitle}>{selected.title}</h3>
                {selected.projectName && <p className={styles.detailProject}>{selected.projectName}</p>}
              </div>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className={styles.detailBody}>
              <DetailRow icon={CalendarDays} label={lang === 'nl' ? 'Periode' : 'Period'} value={`${selected.startDate} → ${selected.endDate}`} />
              <DetailRow icon={Clock}        label={lang === 'nl' ? 'Tijd'    : 'Time'}   value={`${selected.startTime} – ${selected.endTime}`} />
              {selected.assignee && <DetailRow icon={User} label={lang === 'nl' ? 'Uitvoerder' : 'Assignee'} value={selected.assignee} />}
              {selected.notes && (
                <div className={styles.detailNotes}>
                  <p className={styles.detailNotesLabel}>{lang === 'nl' ? 'Notities' : 'Notes'}</p>
                  <p>{selected.notes}</p>
                </div>
              )}
            </div>
            <div className={styles.detailFooter}>
              <button className={styles.deleteSmBtn} onClick={() => handleDelete(selected.id)}>
                {lang === 'nl' ? 'Verwijderen' : 'Delete'}
              </button>
              <button className={styles.editSmBtn} onClick={() => { openEdit(selected); setSelected(null) }}>
                {lang === 'nl' ? 'Bewerken' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {formOpen && (
        <PlanningForm event={editTarget} onSave={handleSave} onClose={closeForm} />
      )}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className={styles.detailRow}>
      <Icon size={14} className={styles.detailIcon} />
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  )
}