import { useState, useEffect, useRef } from 'react'
import {
  X, ChevronRight, Plus, Trash2, CheckSquare, Square,
  AlertTriangle, CheckCircle, UploadCloud, FileText,
  FileImage, File, XCircle
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clientsSeed } from '../../data/clientsSeed'
import styles from './ProjectForm.module.css'

const EMPTY = {
  name: '',
  clientId: '',
  clientName: '',
  status: 'planning',
  priority: 'medium',
  startDate: '',
  estimatedEndDate: '',
  budget: '',
  spentBudget: '',
  address: '',
  description: '',
  notes: '',
  tasks: [],
  problems: [],
  attachments: [],
}

function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return FileImage
  if (['pdf'].includes(ext)) return FileText
  return File
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ProjectForm({ project, onSave, onClose }) {
  const { t } = useLang()
  const f = t.projects.form
  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [newTask, setNewTask] = useState('')
  const [newProblem, setNewProblem] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => {
    if (project) setData({ ...EMPTY, ...project })
    else setData(EMPTY)
  }, [project])

  function set(key, val) {
    setData(d => ({ ...d, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }))
  }

  function addTask() {
    const txt = newTask.trim()
    if (!txt) return
    set('tasks', [...data.tasks, { id: Date.now(), text: txt, done: false }])
    setNewTask('')
  }
  function toggleTask(id) {
    set('tasks', data.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  function removeTask(id) {
    set('tasks', data.tasks.filter(t => t.id !== id))
  }

  function addProblem() {
    const txt = newProblem.trim()
    if (!txt) return
    set('problems', [...data.problems, {
      id: Date.now(),
      text: txt,
      date: new Date().toISOString().slice(0, 10),
      resolved: false
    }])
    setNewProblem('')
  }
  function toggleProblem(id) {
    set('problems', data.problems.map(p => p.id === id ? { ...p, resolved: !p.resolved } : p))
  }
  function removeProblem(id) {
    set('problems', data.problems.filter(p => p.id !== id))
  }

  function handleFiles(files) {
    const list = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }))
    set('attachments', [...data.attachments, ...list])
  }
  function removeAttachment(id) {
    set('attachments', data.attachments.filter(a => a.id !== id))
  }

  function handleClientChange(clientId) {
    const cl = clientsSeed.find(c => String(c.id) === String(clientId))
    setData(d => ({
      ...d,
      clientId,
      clientName: cl ? cl.companyName || `${cl.firstName} ${cl.lastName}` : '',
    }))
  }

  const budgetNum = parseFloat(data.budget) || 0
  const spentNum  = parseFloat(data.spentBudget) || 0
  const pct       = budgetNum > 0 ? Math.min(100, (spentNum / budgetNum) * 100) : 0
  const budgetColor = pct >= 90 ? '#C8102E' : pct >= 70 ? '#FB8C00' : '#2E7D32'

  function validate() {
    const e = {}
    if (!data.name.trim())          e.name = true
    if (!data.startDate)            e.startDate = true
    if (!data.estimatedEndDate)     e.estimatedEndDate = true
    if (!data.address.trim())       e.address = true
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
          <h2 className={styles.panelTitle}>{project ? f.title_edit : f.title_add}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            {/* GENERAL */}
            <Section label={f.section_general}>
              <Field label={f.name} required error={errors.name} hint={f.required}>
                <input
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={data.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Renovatie café centrum…"
                />
              </Field>

              <Field label={f.client}>
                <select
                  className={styles.select}
                  value={data.clientId}
                  onChange={e => handleClientChange(e.target.value)}
                >
                  <option value="">— Selecteer klant —</option>
                  {clientsSeed.map(cl => (
                    <option key={cl.id} value={cl.id}>
                      {cl.companyName || `${cl.firstName} ${cl.lastName}`}
                    </option>
                  ))}
                </select>
              </Field>

              <div className={styles.row}>
                <Field label={f.status}>
                  <select className={styles.select} value={data.status} onChange={e => set('status', e.target.value)}>
                    {Object.entries(t.projects.statuses).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label={f.priority}>
                  <div className={styles.priorityGroup}>
                    {Object.entries(t.projects.priorities).map(([k, v]) => (
                      <label key={k} className={styles.priorityLabel}>
                        <input
                          type="radio"
                          name="priority"
                          value={k}
                          checked={data.priority === k}
                          onChange={() => set('priority', k)}
                          className={styles.radioHidden}
                        />
                        <span className={`${styles.priorityPill} ${styles['pri_' + k]} ${data.priority === k ? styles.priorityActive : ''}`}>
                          {v}
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label={f.description}>
                <textarea
                  className={styles.textarea}
                  value={data.description}
                  onChange={e => set('description', e.target.value)}
                  rows={3}
                  placeholder="Omschrijving van de werkzaamheden…"
                />
              </Field>
            </Section>

            {/* PLANNING & BUDGET */}
            <Section label={f.section_planning}>
              <div className={styles.row}>
                <Field label={f.startDate} required error={errors.startDate} hint={f.required}>
                  <input
                    type="date"
                    className={`${styles.input} ${errors.startDate ? styles.inputError : ''}`}
                    value={data.startDate}
                    onChange={e => set('startDate', e.target.value)}
                  />
                </Field>
                <Field label={f.estimatedEndDate} required error={errors.estimatedEndDate} hint={f.required}>
                  <input
                    type="date"
                    className={`${styles.input} ${errors.estimatedEndDate ? styles.inputError : ''}`}
                    value={data.estimatedEndDate}
                    onChange={e => set('estimatedEndDate', e.target.value)}
                  />
                </Field>
              </div>

              <div className={styles.row}>
                <Field label={f.budget}>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>€</span>
                    <input
                      type="number" min="0"
                      className={`${styles.input} ${styles.inputWithPrefix}`}
                      value={data.budget}
                      onChange={e => set('budget', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </Field>
                <Field label={f.spentBudget}>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>€</span>
                    <input
                      type="number" min="0"
                      className={`${styles.input} ${styles.inputWithPrefix}`}
                      value={data.spentBudget}
                      onChange={e => set('spentBudget', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </Field>
              </div>

              {budgetNum > 0 && (
                <div className={styles.budgetBar}>
                  <div className={styles.budgetBarLabels}>
                    <span>€ {spentNum.toLocaleString('nl-NL')} besteed</span>
                    <span style={{ color: budgetColor }}>{pct.toFixed(0)}%</span>
                    <span>€ {budgetNum.toLocaleString('nl-NL')}</span>
                  </div>
                  <div className={styles.budgetTrack}>
                    <div className={styles.budgetFill} style={{ width: pct + '%', background: budgetColor }} />
                  </div>
                </div>
              )}
            </Section>

            {/* LOCATION */}
            <Section label={f.section_location}>
              <Field label={f.address} required error={errors.address} hint={f.required}>
                <input
                  className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                  value={data.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Straat 1, 1234 AB Amsterdam"
                />
              </Field>
            </Section>

            {/* TASKS */}
            <Section label={f.section_tasks}>
              <div className={styles.taskList}>
                {data.tasks.length === 0 && <p className={styles.emptyHint}>{f.noTasks}</p>}
                {data.tasks.map(task => (
                  <div key={task.id} className={styles.taskRow}>
                    <button type="button" className={styles.checkBtn} onClick={() => toggleTask(task.id)}>
                      {task.done
                        ? <CheckSquare size={16} className={styles.checkDone} />
                        : <Square size={16} className={styles.checkEmpty} />}
                    </button>
                    <span className={`${styles.taskText} ${task.done ? styles.taskDone : ''}`}>{task.text}</span>
                    <button type="button" className={styles.removeBtn} onClick={() => removeTask(task.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.addRow}>
                <input
                  className={styles.input}
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder={f.taskPlaceholder}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTask())}
                />
                <button type="button" className={styles.addRowBtn} onClick={addTask}><Plus size={15} /></button>
              </div>
              {data.tasks.length > 0 && (
                <div className={styles.taskProgress}>
                  <div className={styles.taskTrack}>
                    <div className={styles.taskFill} style={{ width: (data.tasks.filter(t => t.done).length / data.tasks.length * 100) + '%' }} />
                  </div>
                  <span className={styles.taskProgressLabel}>
                    {data.tasks.filter(t => t.done).length} / {data.tasks.length} taken
                  </span>
                </div>
              )}
            </Section>

            {/* PROBLEMS */}
            <Section label={f.section_problems}>
              <div className={styles.problemList}>
                {data.problems.length === 0 && <p className={styles.emptyHint}>{f.noProblems}</p>}
                {data.problems.map(prob => (
                  <div key={prob.id} className={`${styles.problemRow} ${prob.resolved ? styles.problemResolved : ''}`}>
                    <div className={styles.problemIcon}>
                      {prob.resolved
                        ? <CheckCircle size={15} className={styles.iconResolved} />
                        : <AlertTriangle size={15} className={styles.iconOpen} />}
                    </div>
                    <div className={styles.problemContent}>
                      <span className={styles.problemText}>{prob.text}</span>
                      <span className={styles.problemDate}>{prob.date}</span>
                    </div>
                    <div className={styles.problemActions}>
                      <button
                        type="button"
                        className={`${styles.smallBtn} ${prob.resolved ? styles.smallBtnGreen : styles.smallBtnGrey}`}
                        onClick={() => toggleProblem(prob.id)}
                      >
                        {prob.resolved ? f.open : f.resolved}
                      </button>
                      <button type="button" className={styles.removeBtn} onClick={() => removeProblem(prob.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.addRow}>
                <input
                  className={styles.input}
                  value={newProblem}
                  onChange={e => setNewProblem(e.target.value)}
                  placeholder={f.problemPlaceholder}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addProblem())}
                />
                <button type="button" className={styles.addRowBtn} onClick={addProblem}><Plus size={15} /></button>
              </div>
            </Section>

            {/* ATTACHMENTS */}
            <Section label={f.section_attachments}>
              <div
                className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current.click()}
              >
                <UploadCloud size={22} className={styles.uploadIcon} />
                <p className={styles.dropText}>{f.dropFiles}</p>
                <p className={styles.dropHint}>{f.fileTypes}</p>
                <input ref={fileInputRef} type="file" multiple className={styles.fileInput} onChange={e => handleFiles(e.target.files)} />
              </div>
              {data.attachments.length > 0 && (
                <div className={styles.attachList}>
                  {data.attachments.map(att => {
                    const Icon = fileIcon(att.name)
                    return (
                      <div key={att.id} className={styles.attachRow}>
                        <Icon size={16} className={styles.attachIcon} />
                        <div className={styles.attachInfo}>
                          <span className={styles.attachName}>{att.name}</span>
                          <span className={styles.attachSize}>{formatBytes(att.size)}</span>
                        </div>
                        <button type="button" className={styles.removeBtn} onClick={() => removeAttachment(att.id)}>
                          <XCircle size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            {/* OTHER */}
            <Section label={f.section_other}>
              <Field label={f.notes}>
                <textarea
                  className={styles.textarea}
                  value={data.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Interne opmerkingen, afspraken…"
                />
              </Field>
            </Section>

          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{f.cancel}</button>
            <button type="submit" className={styles.saveBtn}>
              <ChevronRight size={15} />
              {project ? f.update : f.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{label}</p>
      {children}
    </div>
  )
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}{required && <span className={styles.asterisk}>*</span>}
      </label>
      {children}
      {error && hint && <span className={styles.errorMsg}>{hint}</span>}
    </div>
  )
}