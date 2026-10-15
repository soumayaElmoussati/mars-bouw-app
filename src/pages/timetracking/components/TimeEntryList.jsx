import { Pencil, Trash2, CheckCircle, Clock, AlertTriangle, FileEdit } from 'lucide-react'
import styles from './TimeEntryList.module.css'

const STATUS_STYLE = {
  concept:           { bg:'#F5F5F5', color:'#757575', label_nl:'Concept',         label_en:'Draft',    Icon: FileEdit },
  wacht_goedkeuring: { bg:'#FFF3E0', color:'#E65100', label_nl:'Te goedkeuren',   label_en:'Pending',  Icon: AlertTriangle },
  goedgekeurd:       { bg:'#E8F5E9', color:'#2E7D32', label_nl:'Goedgekeurd',     label_en:'Approved', Icon: CheckCircle },
}

const WORKTYPE_STYLE = {
  normaal:  { bg:'#E3F2FD', color:'#1565C0', label_nl:'Normaal',  label_en:'Normal' },
  overwerk: { bg:'#FFEBEE', color:'#B71C1C', label_nl:'Overwerk', label_en:'Overtime' },
  verlof:   { bg:'#F3E5F5', color:'#6A1B9A', label_nl:'Verlof',   label_en:'Leave' },
  ziek:     { bg:'#FFF8E1', color:'#F57F17', label_nl:'Ziek',     label_en:'Sick' },
}

const DAYS_NL = ['Zo','Ma','Di','Wo','Do','Vr','Za']

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${DAYS_NL[dt.getDay()]} ${dt.getDate()}-${String(dt.getMonth()+1).padStart(2,'0')}`
}

function fmtEur(n) { return '€ ' + Number(n||0).toLocaleString('nl-NL',{minimumFractionDigits:2}) }

export default function TimeEntryList({ entries, weekDates, workers, lang, onEdit, onDelete, onApprove }) {
  const lbl = (nl,en) => lang==='nl'?nl:en

  if (entries.length === 0) return (
    <div className={styles.empty}>
      <Clock size={40} style={{color:'var(--grey-200)',display:'block',margin:'0 auto 12px'}}/>
      <p>{lbl('Geen uren gevonden voor deze week','No hours found for this week')}</p>
      <p className={styles.emptySub}>{lbl('Klik op "Uren invoeren" om te beginnen','Click "Log hours" to get started')}</p>
    </div>
  )

  // Group by day
  const byDay = {}
  weekDates.forEach(d => { byDay[d] = [] })
  entries.forEach(e => { if (byDay[e.date]) byDay[e.date].push(e) })

  return (
    <div className={styles.wrap}>
      {weekDates.map(day => {
        const dayEntries = byDay[day] || []
        const dayHours   = dayEntries.reduce((s,e)=>s+e.hours, 0)
        const dayCost    = dayEntries.reduce((s,e)=>s+e.cost,  0)
        const dt         = new Date(day)
        const isWeekend  = dt.getDay() === 0 || dt.getDay() === 6
        const isToday    = day === new Date().toISOString().slice(0,10)

        return (
          <div key={day} className={`${styles.dayBlock} ${isWeekend?styles.weekend:''} ${isToday?styles.today:''}`}>
            <div className={styles.dayHeader}>
              <div className={styles.dayInfo}>
                <span className={`${styles.dayName} ${isToday?styles.todayLabel:''}`}>{fmtDate(day)}</span>
                {isToday && <span className={styles.todayBadge}>{lbl('Vandaag','Today')}</span>}
              </div>
              {dayHours > 0 && (
                <div className={styles.daySummary}>
                  <span className={styles.dayHours}>{dayHours.toFixed(1)} u</span>
                  <span className={styles.dayCost}>{fmtEur(dayCost)}</span>
                </div>
              )}
            </div>

            {dayEntries.length === 0 ? (
              <div className={styles.emptyDay}>{isWeekend ? lbl('Weekend','Weekend') : lbl('Geen registraties','No entries')}</div>
            ) : (
              <div className={styles.entries}>
                {dayEntries.map(entry => {
                  const st  = STATUS_STYLE[entry.status]  || STATUS_STYLE.concept
                  const wt  = WORKTYPE_STYLE[entry.workType] || WORKTYPE_STYLE.normaal
                  const StatusIcon = st.Icon
                  const worker = workers.find(w => w.id === entry.workerId)

                  return (
                    <div key={entry.id} className={`${styles.entry} ${entry.status==='goedgekeurd'?styles.entryApproved:''}`}>
                      {/* Left color strip */}
                      <div className={styles.entryStrip} style={{ background: worker?.color || 'var(--blue)' }} />

                      {/* Worker avatar */}
                      <div className={styles.workerAvatar} style={{ background: worker?.color || 'var(--blue)' }}>
                        {(worker?.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>

                      {/* Main content */}
                      <div className={styles.entryMain}>
                        <div className={styles.entryTop}>
                          <span className={styles.workerName}>{entry.workerName}</span>
                          <span className={styles.workerRole}>{entry.workerRole}</span>
                          <span className={styles.projectBadge}>{entry.projectName}</span>
                        </div>
                        <p className={styles.description}>{entry.description || '—'}</p>
                        <div className={styles.entryMeta}>
                          <span className={styles.timeRange}>
                            <Clock size={11}/> {entry.startTime} – {entry.endTime}
                          </span>
                          {entry.breakMinutes > 0 && <span className={styles.breakTime}>-{entry.breakMinutes}m pauze</span>}
                          <span className={styles.workTypeBadge} style={{background:wt.bg,color:wt.color}}>
                            {lang==='nl'?wt.label_nl:wt.label_en}
                          </span>
                        </div>
                      </div>

                      {/* Hours & cost */}
                      <div className={styles.entryNumbers}>
                        <span className={styles.entryHours}>{entry.hours.toFixed(1)} u</span>
                        <span className={styles.entryRate}>× {fmtEur(entry.hourlyRate)}</span>
                        <span className={styles.entryCost}>{fmtEur(entry.cost)}</span>
                      </div>

                      {/* Status & actions */}
                      <div className={styles.entryRight}>
                        <span className={styles.statusBadge} style={{background:st.bg,color:st.color}}>
                          <StatusIcon size={11}/>
                          {lang==='nl'?st.label_nl:st.label_en}
                        </span>
                        <div className={styles.entryActions}>
                          {entry.status === 'wacht_goedkeuring' && (
                            <button className={styles.approveBtn} onClick={()=>onApprove(entry.id)} title={lbl('Goedkeuren','Approve')}>
                              <CheckCircle size={14}/>
                            </button>
                          )}
                          <button className={styles.actionBtn} onClick={()=>onEdit(entry)}><Pencil size={13}/></button>
                          <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={()=>onDelete(entry.id)}><Trash2 size={13}/></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Week totals footer */}
      <div className={styles.weekFooter}>
        <span className={styles.weekFooterLabel}>{lbl('Week totaal','Week total')}</span>
        <div className={styles.weekFooterNums}>
          <span>{entries.length} {lbl('registraties','entries')}</span>
          <span className={styles.footerHours}>{entries.reduce((s,e)=>s+e.hours,0).toFixed(1)} u</span>
          <span className={styles.footerCost}>{fmtEur(entries.reduce((s,e)=>s+e.cost,0))}</span>
        </div>
      </div>
    </div>
  )
}