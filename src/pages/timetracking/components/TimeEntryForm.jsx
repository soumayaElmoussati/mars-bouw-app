import { useState, useEffect } from 'react'
import { X, ChevronRight, Clock } from 'lucide-react'
import { projectsSeed } from '../../../data/projectsSeed'
import styles from './TimeEntryForm.module.css'

const WORK_TYPES = [
  { key:'normaal',  nl:'Normaal',  en:'Normal' },
  { key:'overwerk', nl:'Overwerk', en:'Overtime' },
  { key:'verlof',   nl:'Verlof',   en:'Leave' },
  { key:'ziek',     nl:'Ziek',     en:'Sick leave' },
]
const STATUSES = [
  { key:'concept',           nl:'Concept',        en:'Draft' },
  { key:'wacht_goedkeuring', nl:'Wacht goedkeuring',en:'Pending approval' },
  { key:'goedgekeurd',       nl:'Goedgekeurd',    en:'Approved' },
]

const EMPTY = {
  workerId: '',
  projectId: '',
  projectName: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '07:30',
  endTime: '16:30',
  breakMinutes: 30,
  workType: 'normaal',
  description: '',
  status: 'wacht_goedkeuring',
}

function computeHours(start, end, breakMins) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const total = (eh * 60 + em) - (sh * 60 + sm) - (breakMins || 0)
  return Math.max(0, total / 60)
}

export default function TimeEntryForm({ entry, workers, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => { setData(entry ? { ...EMPTY, ...entry } : EMPTY) }, [entry])

  function set(k, v) {
    setData(d => ({ ...d, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: false }))
  }

  function handleProject(id) {
    const p = projectsSeed.find(p => String(p.id) === id)
    setData(d => ({ ...d, projectId: id, projectName: p ? p.name : '' }))
  }

  const worker     = workers.find(w => String(w.id) === String(data.workerId))
  const hours      = computeHours(data.startTime, data.endTime, +data.breakMinutes)
  const rate       = data.workType === 'overwerk' ? (worker?.overtimeRate || 0) : (worker?.hourlyRate || 0)
  const cost       = hours * rate

  function validate() {
    const e = {}
    if (!data.workerId)         e.workerId = true
    if (!data.date)             e.date     = true
    if (!data.startTime)        e.startTime = true
    if (!data.endTime)          e.endTime   = true
    if (hours <= 0)             e.endTime   = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave(data)
  }

  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{entry ? lbl('Uren bewerken','Edit entry') : lbl('Uren invoeren','Log hours')}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            {/* Live preview */}
            {worker && hours > 0 && (
              <div className={styles.preview} style={{ borderLeftColor: worker.color }}>
                <div className={styles.previewLeft}>
                  <div className={styles.previewAvatar} style={{ background: worker.color }}>
                    {worker.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <p className={styles.previewName}>{worker.name}</p>
                    <p className={styles.previewRole}>{worker.role}</p>
                  </div>
                </div>
                <div className={styles.previewRight}>
                  <div className={styles.previewStat}>
                    <span className={styles.previewVal}>{hours.toFixed(2)} u</span>
                    <span className={styles.previewLbl}>{lbl('Uren','Hours')}</span>
                  </div>
                  <div className={styles.previewSep} />
                  <div className={styles.previewStat}>
                    <span className={styles.previewVal}>{fmtEur(rate)}</span>
                    <span className={styles.previewLbl}>{lbl('Tarief/u','Rate/h')}</span>
                  </div>
                  <div className={styles.previewSep} />
                  <div className={styles.previewStat}>
                    <span className={styles.previewVal} style={{color:'#2E7D32'}}>{fmtEur(cost)}</span>
                    <span className={styles.previewLbl}>{lbl('Loonkost','Cost')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Who */}
            <Section label={lbl('Medewerker','Worker')}>
              <Field label={lbl('Medewerker','Worker')} req error={errors.workerId} hint={lbl('Verplicht','Required')}>
                <div className={styles.workerGrid}>
                  {workers.filter(w=>w.status==='actief').map(w => (
                    <label key={w.id} className={`${styles.workerOption} ${String(data.workerId)===String(w.id)?styles.workerOptionActive:''}`}
                      style={String(data.workerId)===String(w.id)?{borderColor:w.color,background:w.color+'12'}:{}}>
                      <input type="radio" name="worker" value={w.id} checked={String(data.workerId)===String(w.id)}
                        onChange={()=>set('workerId',String(w.id))} className={styles.radioHidden}/>
                      <div className={styles.workerOptionAvatar} style={{background: w.color}}>
                        {w.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div className={styles.workerOptionInfo}>
                        <span className={styles.workerOptionName}>{w.name}</span>
                        <span className={styles.workerOptionRole}>{w.role}</span>
                        <span className={styles.workerOptionRate}>€ {data.workType==='overwerk'?w.overtimeRate:w.hourlyRate}/u</span>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>
            </Section>

            {/* Section: When */}
            <Section label={lbl('Datum & Tijd','Date & Time')}>
              <Field label={lbl('Datum','Date')} req error={errors.date} hint={lbl('Verplicht','Required')}>
                <input type="date" className={`${styles.input} ${errors.date?styles.inputError:''}`}
                  value={data.date} onChange={e=>set('date',e.target.value)} />
              </Field>
              <div className={styles.row}>
                <Field label={lbl('Starttijd','Start time')} req error={errors.startTime} hint={lbl('Verplicht','Required')}>
                  <input type="time" className={`${styles.input} ${errors.startTime?styles.inputError:''}`}
                    value={data.startTime} onChange={e=>set('startTime',e.target.value)} />
                </Field>
                <Field label={lbl('Eindtijd','End time')} req error={errors.endTime} hint={lbl('Verplicht','Required')}>
                  <input type="time" className={`${styles.input} ${errors.endTime?styles.inputError:''}`}
                    value={data.endTime} onChange={e=>set('endTime',e.target.value)} />
                </Field>
                <Field label={lbl('Pauze (min)','Break (min)')}>
                  <select className={styles.select} value={data.breakMinutes} onChange={e=>set('breakMinutes',+e.target.value)}>
                    {[0,15,30,45,60].map(m=><option key={m} value={m}>{m} min</option>)}
                  </select>
                </Field>
              </div>

              {/* Time visual */}
              {hours > 0 && (
                <div className={styles.timeSummary}>
                  <Clock size={14} style={{color:'var(--blue-light)'}}/>
                  <span>{data.startTime} → {data.endTime}</span>
                  <span className={styles.timeMinus}>- {data.breakMinutes}min pauze</span>
                  <span className={styles.timeResult}><strong>{hours.toFixed(2)} uur</strong></span>
                </div>
              )}
            </Section>

            {/* Section: What */}
            <Section label={lbl('Project & Werk','Project & Work')}>
              <Field label={lbl('Project','Project')}>
                <select className={styles.select} value={data.projectId} onChange={e=>handleProject(e.target.value)}>
                  <option value="">— {lbl('Geen project','No project')} —</option>
                  {projectsSeed.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <div className={styles.row}>
                <Field label={lbl('Type werk','Work type')}>
                  <div className={styles.typeGroup}>
                    {WORK_TYPES.map(t=>(
                      <label key={t.key} className={`${styles.typeOption} ${data.workType===t.key?styles.typeActive:''}`}>
                        <input type="radio" name="workType" value={t.key} checked={data.workType===t.key}
                          onChange={()=>set('workType',t.key)} className={styles.radioHidden}/>
                        {lang==='nl'?t.nl:t.en}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label={lbl('Status','Status')}>
                  <select className={styles.select} value={data.status} onChange={e=>set('status',e.target.value)}>
                    {STATUSES.map(s=><option key={s.key} value={s.key}>{lang==='nl'?s.nl:s.en}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={lbl('Omschrijving werkzaamheden','Work description')}>
                <textarea className={styles.textarea} rows={3} value={data.description}
                  onChange={e=>set('description',e.target.value)}
                  placeholder={lbl('Wat is er gedaan?','What was done?')} />
              </Field>
            </Section>

          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}>
              <ChevronRight size={14}/>
              {entry ? lbl('Bijwerken','Update') : lbl('Uren opslaan','Save hours')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({label,children}){return<div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div>}
function Field({label,req,error,hint,children}){
  return(
    <div className={styles.field}>
      <label className={styles.lbl}>{label}{req&&<span style={{color:'var(--red)',marginLeft:2}}>*</span>}</label>
      {children}
      {error&&hint&&<span className={styles.errMsg}>{hint}</span>}
    </div>
  )
}