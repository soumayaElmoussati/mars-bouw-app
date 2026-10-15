import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import styles from './PlanningForm.module.css'

const TYPE_OPTIONS = [
  { key: 'sloop',         nl: 'Sloopwerk',     en: 'Demolition' },
  { key: 'installatie',   nl: 'Installatie',   en: 'Installation' },
  { key: 'specialisme',   nl: 'Specialisme',   en: 'Specialist' },
  { key: 'administratie', nl: 'Administratie', en: 'Administration' },
  { key: 'inspectie',     nl: 'Inspectie',     en: 'Inspection' },
  { key: 'afwerking',     nl: 'Afwerking',     en: 'Finishing' },
  { key: 'overig',        nl: 'Overig',        en: 'Other' },
]

const STATUS_OPTIONS = [
  { key: 'planned',     nl: 'Gepland',     en: 'Planned' },
  { key: 'in_progress', nl: 'Lopend',      en: 'In progress' },
  { key: 'done',        nl: 'Klaar',       en: 'Done' },
  { key: 'cancelled',   nl: 'Geannuleerd', en: 'Cancelled' },
]

const COLORS = ['#1A3E6F','#C8102E','#2D6BB5','#2E7D32','#E65100','#7B1FA2','#00838F','#F57F17']

const EMPTY = {
  title: '', projectId: '', projectName: '',
  assignee: '', startDate: '', endDate: '',
  startTime: '08:00', endTime: '17:00',
  type: 'sloop', status: 'planned',
  color: '#1A3E6F', notes: '',
}

// projects passed as prop from PlanningPage (already loaded from API)
export default function PlanningForm({ event, projects = [], onSave, onClose }) {
  const { lang } = useLang()
  const [data,   setData]   = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (event) {
      // Map snake_case DB fields to camelCase form fields
      setData({
        ...EMPTY,
        ...event,
        projectId:   event.projectId   || event.project_id   || '',
        projectName: event.projectName || event.project_name || '',
        startDate:   event.startDate   || event.start_date   || '',
        endDate:     event.endDate     || event.end_date     || '',
        startTime:   event.startTime   || event.start_time   || '08:00',
        endTime:     event.endTime     || event.end_time     || '17:00',
      })
    } else {
      setData(EMPTY)
    }
  }, [event])

  function set(key, val) {
    setData(d => ({ ...d, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }))
  }

  function handleProject(id) {
    const pr = projects.find(p => String(p.id) === id)
    setData(d => ({ ...d, projectId: id, projectName: pr ? pr.name : '' }))
  }

  function validate() {
    const e = {}
    if (!data.title.trim()) e.title     = true
    if (!data.startDate)    e.startDate = true
    if (!data.endDate)      e.endDate   = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave(data)
  }

  const lbl = (nl, en) => lang === 'nl' ? nl : en

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {data.id ? lbl('Activiteit bewerken','Edit activity') : lbl('Activiteit inplannen','Schedule activity')}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Titel','Title')} <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                value={data.title}
                onChange={e => set('title', e.target.value)}
                placeholder={lbl('Omschrijf de activiteit…','Describe the activity…')}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Project','Project')}</label>
              <select className={styles.select} value={data.projectId} onChange={e => handleProject(e.target.value)}>
                <option value="">— {lbl('Geen project','No project')} —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Type','Type')}</label>
                <select className={styles.select} value={data.type} onChange={e => set('type', e.target.value)}>
                  {TYPE_OPTIONS.map(t => <option key={t.key} value={t.key}>{lang === 'nl' ? t.nl : t.en}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Status','Status')}</label>
                <select className={styles.select} value={data.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{lang === 'nl' ? s.nl : s.en}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Startdatum','Start date')} <span className={styles.req}>*</span></label>
                <input type="date" className={`${styles.input} ${errors.startDate ? styles.inputError : ''}`}
                  value={data.startDate} onChange={e => set('startDate', e.target.value)}/>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Einddatum','End date')} <span className={styles.req}>*</span></label>
                <input type="date" className={`${styles.input} ${errors.endDate ? styles.inputError : ''}`}
                  value={data.endDate} onChange={e => set('endDate', e.target.value)}/>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Starttijd','Start time')}</label>
                <input type="time" className={styles.input} value={data.startTime} onChange={e => set('startTime', e.target.value)}/>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Eindtijd','End time')}</label>
                <input type="time" className={styles.input} value={data.endTime} onChange={e => set('endTime', e.target.value)}/>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Uitvoerder','Assignee')}</label>
              <input className={styles.input} value={data.assignee}
                onChange={e => set('assignee', e.target.value)}
                placeholder={lbl('Naam of team…','Name or team…')}/>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Kleur','Color')}</label>
              <div className={styles.colorPicker}>
                {COLORS.map(c => (
                  <button key={c} type="button"
                    className={`${styles.colorDot} ${data.color === c ? styles.colorDotActive : ''}`}
                    style={{ background: c }}
                    onClick={() => set('color', c)}/>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Notities','Notes')}</label>
              <textarea className={styles.textarea} rows={3} value={data.notes}
                onChange={e => set('notes', e.target.value)} placeholder="…"/>
            </div>

          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {lbl('Annuleren','Cancel')}
            </button>
            <button type="submit" className={styles.saveBtn}>
              <ChevronRight size={15}/>
              {data.id ? lbl('Bijwerken','Update') : lbl('Inplannen','Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}