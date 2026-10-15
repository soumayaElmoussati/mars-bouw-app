import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import LineEditor from './LineEditor'
import styles from './DocForm.module.css'

const EMPTY = {
  clientName: '', clientAddress: '', date: new Date().toISOString().slice(0,10),
  dueDate: '', status: 'openstaand', projectName: '', notes: '',
  lines: [{ id: 1, description: '', qty: 1, unit: 'stuk', unitPrice: 0, btw: 21 }],
  payments: [],
}

export default function FactuurForm({ factuur, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState(EMPTY)
  useEffect(() => { setData(factuur ? { ...EMPTY, ...factuur } : EMPTY) }, [factuur])
  function set(k, v) { setData(d => ({ ...d, [k]: v })) }

  function handleSubmit(e) { e.preventDefault(); onSave(data) }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>{factuur ? lbl('Factuur bewerken','Edit invoice') : lbl('Nieuwe factuur','New invoice')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <Section label={lbl('Klantgegevens','Client')}>
              <div className={styles.row}>
                <Field label={lbl('Naam','Name')}><input className={styles.input} value={data.clientName} onChange={e => set('clientName',e.target.value)} /></Field>
                <Field label={lbl('Adres','Address')}><input className={styles.input} value={data.clientAddress} onChange={e => set('clientAddress',e.target.value)} /></Field>
              </div>
            </Section>

            <Section label={lbl('Factuurdetails','Invoice details')}>
              <div className={styles.row}>
                <Field label={lbl('Project','Project')}><input className={styles.input} value={data.projectName} onChange={e => set('projectName',e.target.value)} /></Field>
                <Field label={lbl('Status','Status')}>
                  <select className={styles.select} value={data.status} onChange={e => set('status',e.target.value)}>
                    {['openstaand','gedeeltelijk','betaald','vervallen'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div className={styles.row}>
                <Field label={lbl('Factuurdatum','Invoice date')}><input type="date" className={styles.input} value={data.date} onChange={e => set('date',e.target.value)} /></Field>
                <Field label={lbl('Vervaldatum','Due date')}><input type="date" className={styles.input} value={data.dueDate} onChange={e => set('dueDate',e.target.value)} /></Field>
              </div>
            </Section>

            <Section label={lbl('Regeloverzicht','Line items')}>
              <LineEditor lines={data.lines} onChange={lines => set('lines',lines)} lang={lang} />
            </Section>

            <Section label={lbl('Notities','Notes')}>
              <textarea className={styles.textarea} rows={3} value={data.notes} onChange={e => set('notes',e.target.value)} placeholder="t.n.v. Mars Bouw onder vermelding van het factuurnummer." />
            </Section>

          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}><ChevronRight size={14}/>{factuur ? lbl('Bijwerken','Update') : lbl('Factuur opslaan','Save invoice')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
function Section({ label, children }) { return <div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div> }
function Field({ label, children }) { return <div className={styles.field}><label className={styles.lbl}>{label}</label>{children}</div> }