import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import styles from './GanttPage.module.css'

const MONTHS_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_COLORS = {
  planning:    '#1E88E5',
  in_progress: '#FB8C00',
  on_hold:     '#AB47BC',
  completed:   '#43A047',
  cancelled:   '#BDBDBD',
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}
function addDays(date, days) {
  const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10)
}

export default function GanttPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const MONTHS = lang === 'nl' ? MONTHS_NL : MONTHS_EN

  const [projects,     setProjects]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [viewStart,    setViewStart]    = useState('2024-08-01')
  const [zoom,         setZoom]         = useState(28)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedId,   setSelectedId]   = useState(null)

  const DAY_W = 32

  useEffect(() => {
    api.get('/projects')
      .then(data => { setProjects(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [])

  const today  = new Date().toISOString().slice(0, 10)
  const rows   = useMemo(() =>
    projects
      .filter(p => !filterStatus || p.status === filterStatus)
      .map(p => ({
        id:         p.id,
        name:       p.name,
        clientName: p.client_name,
        status:     p.status,
        start:      p.start_date,
        end:        p.estimated_end_date,
        tasks:      (p.tasks || []).slice(0, 5),
        budget:     +p.budget || 0,
        spent:      +p.spent_budget || 0,
        color:      STATUS_COLORS[p.status] || '#1A3E6F',
      }))
  , [projects, filterStatus])

  const headerDays = useMemo(() => {
    const days = []
    const start = new Date(viewStart)
    for (let i = 0; i < zoom; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      days.push({
        date:      d.toISOString().slice(0, 10),
        day:       d.getDate(),
        month:     d.getMonth(),
        year:      d.getFullYear(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday:   d.toISOString().slice(0, 10) === today,
      })
    }
    return days
  }, [viewStart, zoom])

  const monthGroups = useMemo(() => {
    const groups = []
    headerDays.forEach(d => {
      const last = groups[groups.length - 1]
      if (last && last.month === d.month && last.year === d.year) last.count++
      else groups.push({ month: d.month, year: d.year, count: 1 })
    })
    return groups
  }, [headerDays])

  function barStyle(start, end) {
    if (!start || !end) return null
    const s = Math.max(0, daysBetween(viewStart, start))
    const e = Math.min(zoom, daysBetween(viewStart, end) + 1)
    if (e <= 0 || s >= zoom) return null
    return { left: s * DAY_W, width: Math.max(DAY_W, (e - s) * DAY_W) }
  }

  const totalWidth = zoom * DAY_W

  if (loading) return <GanttSkeleton lbl={lbl} MONTHS={MONTHS} />

  if (error) return (
    <div className={styles.page}>
      <div style={{ padding: 40, color: '#C8102E', textAlign: 'center' }}>Fout: {error}</div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Planningsbord', 'Planning board')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Gantt-overzicht van alle projecten', 'Gantt overview of all projects')}</p>
        </div>
        <div className={styles.headerControls}>
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{lbl('Alle statussen', 'All statuses')}</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(STATUS_COLORS).map(([st, c]) => (
          <span key={st} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: c }}/>
            {st.replace('_', ' ')}
          </span>
        ))}
        <span className={styles.legendItem}><span className={styles.legendToday}/>{lbl('Vandaag', 'Today')}</span>
      </div>

      {/* Nav */}
      <div className={styles.ganttNav}>
        <div className={styles.navLeft}>
          <button className={styles.navBtn} onClick={() => setViewStart(addDays(viewStart, -Math.round(zoom / 2)))}><ChevronLeft size={16}/></button>
          <button className={styles.navBtn} onClick={() => setViewStart(addDays(viewStart,  Math.round(zoom / 2)))}><ChevronRight size={16}/></button>
          <button className={styles.todayBtn} onClick={() => setViewStart(addDays(today, -7))}>{lbl('Vandaag', 'Today')}</button>
        </div>
        <div className={styles.navRight}>
          <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.min(90, z + 14))}><ZoomOut size={14}/></button>
          <span className={styles.zoomLabel}>{zoom} {lbl('dagen', 'days')}</span>
          <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.max(14, z - 14))}><ZoomIn size={14}/></button>
        </div>
      </div>

      {/* Gantt chart */}
      <div className={styles.ganttWrap}>
        <div className={styles.gantt}>
          {/* Left: project labels */}
          <div className={styles.ganttLeft}>
            <div className={styles.ganttLeftHeader}><span>{lbl('Project', 'Project')}</span></div>
            {rows.map(row => (
              <div key={row.id}
                className={`${styles.ganttRow} ${selectedId === row.id ? styles.ganttRowSelected : ''}`}
                onClick={() => setSelectedId(selectedId === row.id ? null : row.id)}>
                <div className={styles.rowDot} style={{ background: row.color }}/>
                <div className={styles.rowInfo}>
                  <span className={styles.rowName}>{row.name}</span>
                  <span className={styles.rowClient}>{row.clientName}</span>
                </div>
                <span className={styles.rowStatus} style={{ background: row.color + '20', color: row.color }}>
                  {row.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>

          {/* Right: bars */}
          <div className={styles.ganttRight}>
            {/* Month header */}
            <div className={styles.monthHeader} style={{ width: totalWidth }}>
              {monthGroups.map((mg, i) => (
                <div key={i} className={styles.monthCell} style={{ width: mg.count * DAY_W }}>
                  {MONTHS[mg.month]} {mg.year}
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className={styles.dayHeader} style={{ width: totalWidth }}>
              {headerDays.map((d, i) => (
                <div key={i}
                  className={`${styles.dayCell} ${d.isWeekend ? styles.dayCellWeekend : ''} ${d.isToday ? styles.dayCellToday : ''}`}
                  style={{ width: DAY_W }}>
                  {d.day}
                </div>
              ))}
            </div>

            {/* Bars area */}
            <div className={styles.barsArea} style={{ width: totalWidth }}>
              {/* Weekend + today columns */}
              <div className={styles.colOverlay} style={{ width: totalWidth }}>
                {headerDays.map((d, i) => (
                  <div key={i}
                    className={`${d.isWeekend ? styles.weekendCol : ''} ${d.isToday ? styles.todayCol : ''}`}
                    style={{ left: i * DAY_W, width: DAY_W }}/>
                ))}
              </div>

              {rows.map(row => {
                const bs = barStyle(row.start, row.end)
                const budgetPct = row.budget > 0 ? Math.min(100, row.spent / row.budget * 100) : 0
                const isSelected = selectedId === row.id

                return (
                  <div key={row.id} className={`${styles.barRow} ${isSelected ? styles.barRowSelected : ''}`}>
                    {bs && (
                      <div className={styles.bar}
                        style={{ left: bs.left, width: bs.width, background: row.color }}
                        title={`${row.name}: ${row.start} → ${row.end}`}>
                        <div className={styles.barProgress} style={{ width: budgetPct + '%', background: 'rgba(255,255,255,.3)' }}/>
                        <span className={styles.barLabel}>{row.name}</span>
                      </div>
                    )}
                    {/* Task bars when selected */}
                    {isSelected && (row.tasks || []).map((task, ti) => {
                      const taskStart = addDays(row.start || today, ti * 5)
                      const taskEnd   = addDays(taskStart, 4)
                      const tbs = barStyle(taskStart, taskEnd)
                      return tbs ? (
                        <div key={task.id} className={styles.taskBar}
                          style={{
                            left: tbs.left, width: tbs.width,
                            background: task.done ? '#43A047' : 'rgba(0,0,0,.15)',
                            top: 36 + ti * 22,
                          }}>
                          <span className={styles.taskBarLabel}>{task.text}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected project detail */}
      {selectedId && (() => {
        const proj = rows.find(r => r.id === selectedId)
        if (!proj) return null
        const tasksDone = (proj.tasks || []).filter(t => t.done).length
        const budgetPct = proj.budget > 0 ? (proj.spent / proj.budget * 100).toFixed(0) : 0
        return (
          <div className={styles.projectDetail}>
            <div className={styles.pdHeader} style={{ borderLeftColor: proj.color }}>
              <h3 className={styles.pdName}>{proj.name}</h3>
              <span className={styles.pdClient}>{proj.clientName}</span>
            </div>
            <div className={styles.pdStats}>
              <div className={styles.pdStat}>
                <span className={styles.pdStatVal}>{proj.start} → {proj.end}</span>
                <span className={styles.pdStatLbl}>{lbl('Periode', 'Period')}</span>
              </div>
              <div className={styles.pdStat}>
                <span className={styles.pdStatVal}>€ {proj.spent.toLocaleString('nl-NL')} / € {proj.budget.toLocaleString('nl-NL')}</span>
                <span className={styles.pdStatLbl}>{lbl('Budget', 'Budget')} ({budgetPct}%)</span>
              </div>
              <div className={styles.pdStat}>
                <span className={styles.pdStatVal}>{tasksDone}/{(proj.tasks || []).length}</span>
                <span className={styles.pdStatLbl}>{lbl('Taken', 'Tasks')}</span>
              </div>
            </div>
          </div>
        )
      })()}
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

function GanttSkeleton({ lbl, MONTHS }) {
  const DAY_W = 32
  const ZOOM = 28
  const totalWidth = ZOOM * DAY_W
  const leftRows = 7

  // Build a fake header: 2 mois + jours
  const fakeDays = Array.from({ length: ZOOM }).map((_, i) => {
    const d = new Date('2024-08-01'); d.setDate(d.getDate() + i)
    return {
      day: d.getDate(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday: false,
    }
  })

  // Regroupe les mois pour l'en-tête
  const fakeMonthGroups = (() => {
    const groups = []
    fakeDays.forEach(d => {
      const last = groups[groups.length - 1]
      if (last && last.count < 14 && groups.length === 0) last.count++
      else groups.push({ count: 1 })
    })
    return [
      { label: `${MONTHS[7]} 2024`, count: 14 },
      { label: `${MONTHS[8]} 2024`, count: 14 },
    ]
  })()

  // Fake bars with random-looking positions
  const fakeBars = [
    { left: 2 * DAY_W, width: 6 * DAY_W },
    { left: 5 * DAY_W, width: 8 * DAY_W },
    { left: 9 * DAY_W, width: 5 * DAY_W },
    { left: 3 * DAY_W, width: 10 * DAY_W },
    { left: 12 * DAY_W, width: 7 * DAY_W },
    { left: 6 * DAY_W, width: 9 * DAY_W },
    { left: 1 * DAY_W, width: 6 * DAY_W },
  ]

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
          <h1 className={styles.pageTitle}>{lbl('Planningsbord', 'Planning board')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Gantt-overzicht van alle projecten', 'Gantt overview of all projects')}</p>
        </div>
        <div className={styles.headerControls}>
          <Shimmer w={150} h={36} r={8} />
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={styles.legendItem}>
            <Shimmer w={10} h={10} r={5} />
            <Shimmer w={60} h={11} />
          </span>
        ))}
      </div>

      {/* Nav */}
      <div className={styles.ganttNav}>
        <div className={styles.navLeft}>
          <Shimmer w={32} h={32} r={6} />
          <Shimmer w={32} h={32} r={6} />
          <Shimmer w={90} h={32} r={6} />
        </div>
        <div className={styles.navRight}>
          <Shimmer w={32} h={32} r={6} />
          <Shimmer w={70} h={14} />
          <Shimmer w={32} h={32} r={6} />
        </div>
      </div>

      {/* Gantt */}
      <div className={styles.ganttWrap}>
        <div className={styles.gantt}>
          {/* Left: rows */}
          <div className={styles.ganttLeft}>
            <div className={styles.ganttLeftHeader}><span>{lbl('Project', 'Project')}</span></div>
            {Array.from({ length: leftRows }).map((_, i) => (
              <div key={i} className={styles.ganttRow} style={{ pointerEvents: 'none' }}>
                <Shimmer w={10} h={10} r={5} />
                <div className={styles.rowInfo} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Shimmer w={`${55 + (i % 3) * 12}%`} h={12} />
                  <Shimmer w={`${35 + (i % 2) * 10}%`} h={10} />
                </div>
                <Shimmer w={55} h={18} r={10} />
              </div>
            ))}
          </div>

          {/* Right: header + bars */}
          <div className={styles.ganttRight}>
            {/* Month header */}
            <div className={styles.monthHeader} style={{ width: totalWidth }}>
              {fakeMonthGroups.map((mg, i) => (
                <div key={i} className={styles.monthCell} style={{ width: mg.count * DAY_W }}>
                  <Shimmer w={60} h={12} />
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className={styles.dayHeader} style={{ width: totalWidth }}>
              {fakeDays.map((d, i) => (
                <div key={i}
                  className={`${styles.dayCell} ${d.isWeekend ? styles.dayCellWeekend : ''}`}
                  style={{ width: DAY_W }}>
                  <Shimmer w={14} h={11} />
                </div>
              ))}
            </div>

            {/* Bars area */}
            <div className={styles.barsArea} style={{ width: totalWidth }}>
              <div className={styles.colOverlay} style={{ width: totalWidth }}>
                {fakeDays.map((d, i) => (
                  <div key={i}
                    className={d.isWeekend ? styles.weekendCol : ''}
                    style={{ left: i * DAY_W, width: DAY_W }}/>
                ))}
              </div>

              {fakeBars.map((bar, i) => (
                <div key={i} className={styles.barRow} style={{ pointerEvents: 'none' }}>
                  <Shimmer
                    w={bar.width}
                    h={22}
                    r={6}
                    style={{ position: 'absolute', left: bar.left, top: 10 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}