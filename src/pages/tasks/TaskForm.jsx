import { useState, useEffect } from 'react'
import { X, ChevronRight, Plus, XCircle } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import styles from './TaskForm.module.css'

const EMPTY = {
  title: '', description: '', projectId: '', projectName: '',
  assignee: '', dueDate: '', priority: 'medium',
  status: 'todo', category: '', tags: [],
}

const PRIORITIES = [
  { key: 'low',    nl: 'Laag',    en: 'Low' },
  { key: 'medium', nl: 'Normaal', en: 'Medium' },
  { key: 'high',   nl: 'Hoog',    en: 'High' },
  { key: 'urgent', nl: 'Urgent',  en: 'Urgent' },
]
const STATUSES = [
  { key: 'todo',        nl: 'Te doen',  en: 'To do' },
  { key: 'in_progress', nl: 'Bezig',    en: 'In progress' },
  { key: 'done',        nl: 'Afgerond', en: 'Done' },
]
const CATEGORIES = [
  { key: 'administratie', nl: 'Administratie', en: 'Administration' },
  { key: 'inkoop',        nl: 'Inkoop',        en: 'Purchasing' },
  { key: 'planning',      nl: 'Planning',      en: 'Planning' },
  { key: 'financieel',    nl: 'Financieel',    en: 'Financial' },
  { key: 'veiligheid',    nl: 'Veiligheid',    en: 'Safety' },
  { key: 'technisch',     nl: 'Technisch',     en: 'Technical' },
  { key: 'overig',        nl: 'Overig',        en: 'Other' },
]

export default function TaskForm({ task, projects = [], onSave, onClose, saving }) {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (task) setData({ ...EMPTY, ...task })
    else setData(EMPTY)
  }, [task])

  function set(key, val) {
    setData(d => ({ ...d, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }))
  }

  function handleProject(id) {
    const pr = projects.find(p => String(p.id) === String(id))
    setData(d => ({ ...d, projectId: id, projectName: pr ? pr.name : '' }))
  }

  function addTag() {
    const t = newTag.trim().toLowerCase()
    if (!t || data.tags.includes(t)) return
    set('tags', [...data.tags, t])
    setNewTag('')
  }
  function removeTag(tag) { set('tags', data.tags.filter(t => t !== tag)) }

  function validate() {
    const e = {}
    if (!data.title.trim()) e.title = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave(data)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {task ? lbl('Taak bewerken', 'Edit task') : lbl('Nieuwe taak', 'New task')}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Titel', 'Title')} <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                value={data.title}
                onChange={e => set('title', e.target.value)}
                placeholder={lbl('Omschrijf de taak…', 'Describe the task…')}
              />
              {errors.title && <span className={styles.errorMsg}>{lbl('Verplicht veld', 'Required field')}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Beschrijving', 'Description')}</label>
              <textarea className={styles.textarea} rows={3} value={data.description}
                onChange={e => set('description', e.target.value)}
                placeholder={lbl('Extra details…', 'More details…')} />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Status', 'Status')}</label>
                <select className={styles.select} value={data.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{lang === 'nl' ? s.nl : s.en}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Prioriteit', 'Priority')}</label>
                <div className={styles.priGroup}>
                  {PRIORITIES.map(p => (
                    <label key={p.key} className={styles.priLabel}>
                      <input type="radio" name="priority" value={p.key}
                        checked={data.priority === p.key} onChange={() => set('priority', p.key)}
                        className={styles.radioHidden} />
                      <span className={`${styles.priPill} ${styles['pri_' + p.key]} ${data.priority === p.key ? styles.priActive : ''}`}>
                        {lang === 'nl' ? p.nl : p.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Project', 'Project')}</label>
              <select className={styles.select} value={data.projectId} onChange={e => handleProject(e.target.value)}>
                <option value="">— {lbl('Geen project', 'No project')} —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Uitvoerder', 'Assignee')}</label>
                <input className={styles.input} value={data.assignee}
                  onChange={e => set('assignee', e.target.value)}
                  placeholder={lbl('Naam…', 'Name…')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{lbl('Deadline', 'Due date')}</label>
                <input type="date" className={styles.input} value={data.dueDate}
                  onChange={e => set('dueDate', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Categorie', 'Category')}</label>
              <select className={styles.select} value={data.category} onChange={e => set('category', e.target.value)}>
                <option value="">— {lbl('Selecteer', 'Select')} —</option>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{lang === 'nl' ? c.nl : c.en}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{lbl('Tags', 'Tags')}</label>
              <div className={styles.tagInputRow}>
                <input className={styles.input} value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder={lbl('Tag toevoegen…', 'Add tag…')}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button type="button" className={styles.tagAddBtn} onClick={addTag}>
                  <Plus size={14} />
                </button>
              </div>
              {data.tags.length > 0 && (
                <div className={styles.tagsList}>
                  {data.tags.map(tag => (
                    <span key={tag} className={styles.tagChip}>
                      {tag}
                      <button type="button" className={styles.tagRemove} onClick={() => removeTag(tag)}>
                        <XCircle size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
              {lbl('Annuleren', 'Cancel')}
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              <ChevronRight size={15} />
              {saving ? '…' : (task ? lbl('Bijwerken', 'Update') : lbl('Taak opslaan', 'Save task'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}