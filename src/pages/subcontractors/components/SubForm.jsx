import { useState, useEffect } from 'react'
import { X, ChevronRight, Star } from 'lucide-react'
import styles from './SubForm.module.css'

const SPECS = ['elektra','sanitair','dakwerk','schilderwerk','tegelwerk','timmerwerk','isolatie','stucwerk','overig']
const EMPTY = { name:'',specialty:'elektra',contactPerson:'',phone:'',email:'',kvk:'',btw:'',iban:'',address:'',rating:3,status:'actief',notes:'' }

export default function SubForm({ sub, lang, onSave, onClose }) {
  const lbl = (nl,en) => lang==='nl'?nl:en
  const [data, setData] = useState(EMPTY)
  useEffect(()=>{ setData(sub?{...EMPTY,...sub}:EMPTY) },[sub])
  function set(k,v) { setData(d=>({...d,[k]:v})) }
  function handleSubmit(e) { e.preventDefault(); if (!data.name.trim()) return; onSave(data) }

  return (
    <div className={styles.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>{sub?lbl('Onderaannemer bewerken','Edit subcontractor'):lbl('Nieuwe onderaannemer','New subcontractor')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>
            <Section label={lbl('Bedrijfsgegevens','Company details')}>
              <Field label={lbl('Bedrijfsnaam','Company name')} req>
                <input className={styles.input} value={data.name} onChange={e=>set('name',e.target.value)} placeholder="ElektroBouw BV…" />
              </Field>
              <div className={styles.row}>
                <Field label={lbl('Specialisme','Specialty')}>
                  <select className={styles.select} value={data.specialty} onChange={e=>set('specialty',e.target.value)}>
                    {SPECS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label={lbl('Status','Status')}>
                  <select className={styles.select} value={data.status} onChange={e=>set('status',e.target.value)}>
                    <option value="actief">{lbl('Actief','Active')}</option>
                    <option value="inactief">{lbl('Inactief','Inactive')}</option>
                  </select>
                </Field>
              </div>
              <div className={styles.row}>
                <Field label={lbl('Contactpersoon','Contact person')}>
                  <input className={styles.input} value={data.contactPerson} onChange={e=>set('contactPerson',e.target.value)} />
                </Field>
                <Field label={lbl('Telefoon','Phone')}>
                  <input className={styles.input} value={data.phone} onChange={e=>set('phone',e.target.value)} placeholder="+31 6…" />
                </Field>
              </div>
              <div className={styles.row}>
                <Field label="E-mail">
                  <input className={styles.input} type="email" value={data.email} onChange={e=>set('email',e.target.value)} />
                </Field>
                <Field label={lbl('Adres','Address')}>
                  <input className={styles.input} value={data.address} onChange={e=>set('address',e.target.value)} />
                </Field>
              </div>
            </Section>
            <Section label={lbl('Financieel','Financial')}>
              <div className={styles.row}>
                <Field label="KvK"><input className={styles.input} value={data.kvk} onChange={e=>set('kvk',e.target.value)} maxLength={8}/></Field>
                <Field label="BTW-nummer"><input className={styles.input} value={data.btw} onChange={e=>set('btw',e.target.value)} /></Field>
              </div>
              <Field label="IBAN"><input className={styles.input} value={data.iban} onChange={e=>set('iban',e.target.value)} placeholder="NL00BANK0000000000"/></Field>
            </Section>
            <Section label={lbl('Beoordeling & Notities','Rating & Notes')}>
              <Field label={lbl('Beoordeling','Rating')}>
                <div className={styles.starRow}>
                  {[1,2,3,4,5].map(i=>(
                    <button key={i} type="button" onClick={()=>set('rating',i)} className={styles.starBtn}>
                      <Star size={22} fill={i<=data.rating?'#FFC107':'none'} stroke={i<=data.rating?'#FFC107':'#DDD'}/>
                    </button>
                  ))}
                  <span className={styles.ratingVal}>{data.rating}/5</span>
                </div>
              </Field>
              <Field label={lbl('Notities','Notes')}>
                <textarea className={styles.textarea} rows={3} value={data.notes} onChange={e=>set('notes',e.target.value)} placeholder="…"/>
              </Field>
            </Section>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}><ChevronRight size={14}/>{sub?lbl('Bijwerken','Update'):lbl('Opslaan','Save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
function Section({label,children}){return <div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div>}
function Field({label,req,children}){return <div className={styles.field}><label className={styles.lbl}>{label}{req&&<span style={{color:'var(--red)',marginLeft:2}}>*</span>}</label>{children}</div>}