import { useState, useEffect } from 'react'
import { X, ChevronRight, Plus, Trash2 } from 'lucide-react'
import LineEditor from './LineEditor'
import styles from './DocForm.module.css'

const EMPTY = {
  clientName: '', clientAddress: '', date: new Date().toISOString().slice(0,10),
  validDays: 14, status: 'concept', projectName: '', intro: '',
  lines: [{ id: 1, description: '', qty: 1, unit: 'forfait', unitPrice: 0, btw: 21, section: '' }],
  optionalLines: [],
  paymentTerms: [{ label: 'Bij opdracht', pct: 30 },{ label: 'Na oplevering', pct: 70 }],
  notes: '',
}

export default function OfferteForm({ offerte, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState(EMPTY)

  useEffect(() => { setData(offerte ? { ...EMPTY, ...offerte } : EMPTY) }, [offerte])

  function set(k, v) { setData(d => ({ ...d, [k]: v })) }

  function addPaymentTerm() { set('paymentTerms', [...data.paymentTerms, { label: '', pct: 0 }]) }
  function setPaymentTerm(i, k, v) {
    const pt = [...data.paymentTerms]; pt[i] = { ...pt[i], [k]: v }; set('paymentTerms', pt)
  }
  function removePaymentTerm(i) { set('paymentTerms', data.paymentTerms.filter((_,j) => j!==i)) }

  const totalPct = data.paymentTerms.reduce((s,t) => s + (+t.pct||0), 0)

  function handleSubmit(e) {
    e.preventDefault()
    onSave(data)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>{offerte ? lbl('Offerte bewerken','Edit quote') : lbl('Nieuwe offerte','New quote')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <Section label={lbl('Klantgegevens','Client details')}>
              <div className={styles.row}>
                <Field label={lbl('Naam klant','Client name')}><input className={styles.input} value={data.clientName} onChange={e => set('clientName',e.target.value)} /></Field>
                <Field label={lbl('Adres','Address')}><input className={styles.input} value={data.clientAddress} onChange={e => set('clientAddress',e.target.value)} /></Field>
              </div>
            </Section>

            <Section label={lbl('Offerte details','Quote details')}>
              <div className={styles.row}>
                <Field label={lbl('Project','Project')}><input className={styles.input} value={data.projectName} onChange={e => set('projectName',e.target.value)} /></Field>
                <Field label={lbl('Status','Status')}>
                  <select className={styles.select} value={data.status} onChange={e => set('status',e.target.value)}>
                    {['concept','verzonden','goedgekeurd','afgewezen','verlopen'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div className={styles.row}>
                <Field label={lbl('Offertedatum','Quote date')}><input type="date" className={styles.input} value={data.date} onChange={e => set('date',e.target.value)} /></Field>
                <Field label={lbl('Geldigheid (dagen)','Valid (days)')}><input type="number" min="1" className={styles.input} value={data.validDays} onChange={e => set('validDays',+e.target.value)} /></Field>
              </div>
              <Field label={lbl('Inleiding / aanhef','Intro / greeting')}>
                <textarea className={styles.textarea} rows={3} value={data.intro} onChange={e => set('intro',e.target.value)} placeholder={lbl('Beste [naam], Bedankt voor…','Dear [name], Thank you for…')} />
              </Field>
            </Section>

            <Section label={lbl('Regeloverzicht','Line items')}>
              <LineEditor lines={data.lines} onChange={lines => set('lines',lines)} lang={lang} showSection />
            </Section>

            {data.optionalLines.length > 0 && (
              <Section label={lbl('Optionele posten','Optional items')}>
                <LineEditor lines={data.optionalLines} onChange={lines => set('optionalLines',lines)} lang={lang} />
              </Section>
            )}
            <button type="button" className={styles.addOptBtn} onClick={() => set('optionalLines',[...data.optionalLines,{id:Date.now(),description:'',qty:1,unit:'forfait',unitPrice:0,btw:21}])}>
              <Plus size={13} /> {lbl('Optionele post toevoegen','Add optional item')}
            </button>

            <Section label={lbl('Betalingsschema','Payment schedule')}>
              {data.paymentTerms.map((pt, i) => (
                <div key={i} className={styles.ptRow}>
                  <input className={`${styles.input} ${styles.ptLabel}`} value={pt.label} onChange={e => setPaymentTerm(i,'label',e.target.value)} placeholder={lbl('Termijn omschrijving…','Term description…')} />
                  <div className={styles.ptPct}>
                    <input type="number" min="0" max="100" className={styles.input} value={pt.pct} onChange={e => setPaymentTerm(i,'pct',+e.target.value)} />
                    <span>%</span>
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => removePaymentTerm(i)}><Trash2 size={13}/></button>
                </div>
              ))}
              <div className={styles.ptTotal} style={{ color: totalPct === 100 ? '#2E7D32' : '#C8102E' }}>
                {lbl('Totaal','Total')}: {totalPct}% {totalPct !== 100 && '⚠ moet 100% zijn'}
              </div>
              <button type="button" className={styles.addOptBtn} onClick={addPaymentTerm}><Plus size={13}/>{lbl('Termijn toevoegen','Add term')}</button>
            </Section>

            <Section label={lbl('Opmerkingen & uitsluitingen','Notes & exclusions')}>
              <textarea className={styles.textarea} rows={4} value={data.notes} onChange={e => set('notes',e.target.value)} placeholder="…" />
            </Section>

          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}><ChevronRight size={14}/>{offerte ? lbl('Bijwerken','Update') : lbl('Offerte opslaan','Save quote')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return <div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div>
}
function Field({ label, children }) {
  return <div className={styles.field}><label className={styles.lbl}>{label}</label>{children}</div>
}