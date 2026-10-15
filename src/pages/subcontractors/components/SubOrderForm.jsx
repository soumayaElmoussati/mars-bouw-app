import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { projectsSeed } from '../../../data/projectsSeed'
import styles from './SubForm.module.css'

const EMPTY = {
  subcontractorId:'',subcontractorName:'',projectId:'',projectName:'',
  type:'offerte',description:'',amount:'',btw:21,
  status:'concept',sentDate:new Date().toISOString().slice(0,10),
  startDate:'',endDate:'',paymentStatus:'te_betalen',notes:'',
}

export default function SubOrderForm({ order, subs, lang, onSave, onClose }) {
  const lbl = (nl,en) => lang==='nl'?nl:en
  const [data, setData] = useState(EMPTY)
  useEffect(()=>{ setData(order?{...EMPTY,...order}:EMPTY) },[order])
  function set(k,v) { setData(d=>({...d,[k]:v})) }

  function handleSub(id) {
    const s=subs.find(s=>String(s.id)===id)
    setData(d=>({...d,subcontractorId:+id,subcontractorName:s?s.name:''}))
  }
  function handleProject(id) {
    const p=projectsSeed.find(p=>String(p.id)===id)
    setData(d=>({...d,projectId:+id,projectName:p?p.name:''}))
  }

  const totalIncl = (+data.amount||0) * (1 + data.btw/100)

  function handleSubmit(e) { e.preventDefault(); if(!data.subcontractorId||!data.description.trim()) return; onSave(data) }

  return (
    <div className={styles.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={styles.panel} style={{maxWidth:620}}>
        <div className={styles.header}>
          <h2 className={styles.title}>{order?lbl('Opdracht bewerken','Edit order'):lbl('Nieuwe opdracht','New order')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>
            <Section label={lbl('Onderaannemer & Project','Subcontractor & Project')}>
              <Field label={lbl('Onderaannemer','Subcontractor')} req>
                <select className={styles.select} value={data.subcontractorId} onChange={e=>handleSub(e.target.value)}>
                  <option value="">— {lbl('Selecteer','Select')} —</option>
                  {subs.map(s=><option key={s.id} value={s.id}>{s.name} ({s.specialty})</option>)}
                </select>
              </Field>
              <Field label={lbl('Project','Project')}>
                <select className={styles.select} value={data.projectId} onChange={e=>handleProject(e.target.value)}>
                  <option value="">— {lbl('Geen project','No project')} —</option>
                  {projectsSeed.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </Section>

            <Section label={lbl('Opdracht details','Order details')}>
              <div className={styles.row}>
                <Field label={lbl('Type','Type')}>
                  <select className={styles.select} value={data.type} onChange={e=>set('type',e.target.value)}>
                    <option value="offerte">{lbl('Offerte','Quote')}</option>
                    <option value="opdracht">{lbl('Opdracht','Order')}</option>
                  </select>
                </Field>
                <Field label={lbl('Status','Status')}>
                  <select className={styles.select} value={data.status} onChange={e=>set('status',e.target.value)}>
                    {['concept','goedgekeurd','in_uitvoering','afgerond','geannuleerd'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={lbl('Omschrijving','Description')} req>
                <textarea className={styles.textarea} rows={2} value={data.description} onChange={e=>set('description',e.target.value)} placeholder={lbl('Werkzaamheden…','Work description…')}/>
              </Field>
            </Section>

            <Section label={lbl('Planning','Planning')}>
              <div className={styles.row}>
                <Field label={lbl('Verzenddatum','Send date')}>
                  <input type="date" className={styles.input} value={data.sentDate} onChange={e=>set('sentDate',e.target.value)}/>
                </Field>
                <Field label={lbl('Startdatum','Start date')}>
                  <input type="date" className={styles.input} value={data.startDate} onChange={e=>set('startDate',e.target.value)}/>
                </Field>
              </div>
              <Field label={lbl('Einddatum','End date')}>
                <input type="date" className={styles.input} value={data.endDate} onChange={e=>set('endDate',e.target.value)}/>
              </Field>
            </Section>

            <Section label={lbl('Financieel','Financial')}>
              <div className={styles.row}>
                <Field label={lbl('Bedrag excl. BTW (€)','Amount excl. VAT (€)')}>
                  <input type="number" min="0" step="0.01" className={styles.input} value={data.amount} onChange={e=>set('amount',+e.target.value)}/>
                </Field>
                <Field label="BTW %">
                  <select className={styles.select} value={data.btw} onChange={e=>set('btw',+e.target.value)}>
                    <option value={0}>0%</option>
                    <option value={9}>9%</option>
                    <option value={21}>21%</option>
                  </select>
                </Field>
              </div>
              {totalIncl > 0 && (
                <div style={{background:'var(--blue)',borderRadius:'var(--radius)',padding:'10px 16px',display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'rgba(255,255,255,.8)',fontSize:13}}>{lbl('Totaal incl. BTW','Total incl. VAT')}</span>
                  <strong style={{color:'var(--white)',fontSize:16}}>€ {totalIncl.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong>
                </div>
              )}
            </Section>

            <Section label={lbl('Notities','Notes')}>
              <textarea className={styles.textarea} rows={3} value={data.notes} onChange={e=>set('notes',e.target.value)} placeholder="…"/>
            </Section>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}><ChevronRight size={14}/>{order?lbl('Bijwerken','Update'):lbl('Opslaan','Save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
function Section({label,children}){return <div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div>}
function Field({label,req,children}){return <div className={styles.field}><label className={styles.lbl}>{label}{req&&<span style={{color:'var(--red)',marginLeft:2}}>*</span>}</label>{children}</div>}