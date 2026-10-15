import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { projectsSeed } from '../../../data/projectsSeed'
import styles from './DocForm.module.css'

const CATEGORIES = ['materialen','transport','gereedschap','veiligheid','onderhoud','subcontractor','overig']
const METHODS     = ['pin','contant','overschrijving','ideal','creditcard']

const EMPTY = {
  date: new Date().toISOString().slice(0,10), description: '', category: 'materialen',
  projectId: '', projectName: '', supplier: '', amount: '', btw: 21, btwAmount: '',
  paymentMethod: 'overschrijving', status: 'betaald', notes: '',
}

export default function UitgavenForm({ uitgaaf, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState(EMPTY)
  useEffect(() => { setData(uitgaaf ? { ...EMPTY, ...uitgaaf } : EMPTY) }, [uitgaaf])

  function set(k, v) {
    setData(d => {
      const nd = { ...d, [k]: v }
      if (k === 'amount' || k === 'btw') {
        const amt = +(k === 'amount' ? v : nd.amount) || 0
        const pct = +(k === 'btw' ? v : nd.btw) || 0
        nd.btwAmount = +(amt * pct / 100).toFixed(2)
      }
      return nd
    })
  }

  function handleProject(id) {
    const p = projectsSeed.find(p => String(p.id) === id)
    setData(d => ({ ...d, projectId: id, projectName: p ? p.name : '' }))
  }

  function handleSubmit(e) { e.preventDefault(); onSave(data) }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} style={{ maxWidth: 580 }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{uitgaaf ? lbl('Uitgave bewerken','Edit expense') : lbl('Nieuwe uitgave','New expense')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <Section label={lbl('Details','Details')}>
              <div className={styles.row}>
                <Field label={lbl('Datum','Date')}><input type="date" className={styles.input} value={data.date} onChange={e => set('date',e.target.value)} /></Field>
                <Field label={lbl('Categorie','Category')}>
                  <select className={styles.select} value={data.category} onChange={e => set('category',e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={lbl('Omschrijving','Description')}><input className={styles.input} value={data.description} onChange={e => set('description',e.target.value)} placeholder={lbl('Materialen, diensten…','Materials, services…')} /></Field>
              <Field label={lbl('Leverancier','Supplier')}><input className={styles.input} value={data.supplier} onChange={e => set('supplier',e.target.value)} /></Field>
              <Field label={lbl('Project','Project')}>
                <select className={styles.select} value={data.projectId} onChange={e => handleProject(e.target.value)}>
                  <option value="">— {lbl('Geen project','No project')} —</option>
                  {projectsSeed.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </Section>

            <Section label={lbl('Bedrag & BTW','Amount & VAT')}>
              <div className={styles.row}>
                <Field label={lbl('Bedrag excl. BTW (€)','Amount excl. VAT (€)')}>
                  <input type="number" min="0" step="0.01" className={styles.input} value={data.amount} onChange={e => set('amount',+e.target.value)} />
                </Field>
                <Field label="BTW %">
                  <select className={styles.select} value={data.btw} onChange={e => set('btw',+e.target.value)}>
                    <option value={0}>0%</option>
                    <option value={9}>9%</option>
                    <option value={21}>21%</option>
                  </select>
                </Field>
              </div>
              <div className={styles.row}>
                <Field label={lbl('BTW bedrag (€)','VAT amount (€)')}>
                  <input type="number" min="0" step="0.01" className={styles.input} value={data.btwAmount} onChange={e => set('btwAmount',+e.target.value)} />
                </Field>
                <Field label={lbl('Totaal incl. BTW','Total incl. VAT')}>
                  <input className={styles.input} readOnly value={'€ ' + ((+data.amount||0) + (+data.btwAmount||0)).toLocaleString('nl-NL',{minimumFractionDigits:2})} style={{ background:'var(--grey-50)', fontWeight:700, color:'var(--blue)' }} />
                </Field>
              </div>
            </Section>

            <Section label={lbl('Betaling','Payment')}>
              <div className={styles.row}>
                <Field label={lbl('Betaalmethode','Method')}>
                  <select className={styles.select} value={data.paymentMethod} onChange={e => set('paymentMethod',e.target.value)}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label={lbl('Status','Status')}>
                  <select className={styles.select} value={data.status} onChange={e => set('status',e.target.value)}>
                    {['betaald','te_betalen','besteld'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}><ChevronRight size={14}/>{uitgaaf ? lbl('Bijwerken','Update') : lbl('Opslaan','Save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
function Section({ label, children }) { return <div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div> }
function Field({ label, children }) { return <div className={styles.field}><label className={styles.lbl}>{label}</label>{children}</div> }