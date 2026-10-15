import { useState } from 'react'
import { Pencil, Trash2, Plus, X, ChevronRight } from 'lucide-react'
import styles from './WorkersPanel.module.css'

const ROLES   = ['Uitvoerder','Elektricien','Dakdekker','Tegelzetter','Schilder','Stukadoor','Loodgieter','Timmerman','Metselaar','Overig']
const COLORS  = ['#1A3E6F','#2D6BB5','#2E7D32','#E65100','#7B1FA2','#C8102E','#00838F','#F57F17','#6D4C41','#607D8B']
const EMPTY_W = { name:'',role:'Uitvoerder',hourlyRate:45,overtimeRate:67.5,phone:'',email:'',status:'actief',color:COLORS[0] }

function fmtEur(n) { return '€ '+Number(n||0).toLocaleString('nl-NL',{minimumFractionDigits:2}) }

export default function WorkersPanel({ workers, entries, lang, onSave, onDelete }) {
  const lbl = (nl,en) => lang==='nl'?nl:en
  const [form,     setForm]     = useState(null)
  const [formData, setFormData] = useState(EMPTY_W)

  function workerStats(wId) {
    const we = entries.filter(e => e.workerId === wId)
    return {
      totalHours: we.reduce((s,e)=>s+e.hours,0),
      totalCost:  we.reduce((s,e)=>s+e.cost, 0),
      projects:   [...new Set(we.map(e=>e.projectId))].length,
    }
  }

  function openNew()   { setFormData({...EMPTY_W}); setForm('new') }
  function openEdit(w) { setFormData({...w});       setForm(w.id) }

  function handleSave() {
    if (!formData.name.trim()) return
    onSave({ ...formData, id: form === 'new' ? undefined : form })
    setForm(null)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>{lbl('Medewerkers overzicht','Workers overview')}</h3>
        <button className={styles.addBtn} onClick={openNew}><Plus size={14}/>{lbl('Toevoegen','Add')}</button>
      </div>

      <div className={styles.grid}>
        {workers.map(w => {
          const s = workerStats(w.id)
          return (
            <div key={w.id} className={styles.card} style={{ borderTopColor: w.color }}>
              <div className={styles.cardTop}>
                <div className={styles.avatar} style={{background:w.color}}>
                  {w.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{w.name}</span>
                  <span className={styles.role}>{w.role}</span>
                </div>
                <span className={styles.statusDot} style={{background:w.status==='actief'?'#43A047':'#9E9E9E'}}/>
              </div>

              <div className={styles.rates}>
                <div className={styles.rate}>
                  <span className={styles.rateLbl}>{lbl('Normaal','Normal')}</span>
                  <span className={styles.rateVal}>{fmtEur(w.hourlyRate)}/u</span>
                </div>
                <div className={styles.rateSep}/>
                <div className={styles.rate}>
                  <span className={styles.rateLbl}>{lbl('Overwerk','Overtime')}</span>
                  <span className={styles.rateVal} style={{color:'#B71C1C'}}>{fmtEur(w.overtimeRate)}/u</span>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{s.totalHours.toFixed(0)} u</span>
                  <span className={styles.statLbl}>{lbl('Uren','Hours')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal} style={{color:'var(--blue)',fontSize:13}}>{fmtEur(s.totalCost)}</span>
                  <span className={styles.statLbl}>{lbl('Kost','Cost')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{s.projects}</span>
                  <span className={styles.statLbl}>{lbl('Projecten','Projects')}</span>
                </div>
              </div>

              {w.phone && <p className={styles.contact}>{w.phone}</p>}

              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={()=>openEdit(w)}><Pencil size={13}/></button>
                <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={()=>onDelete(w.id)}><Trash2 size={13}/></button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form modal */}
      {form && (
        <div className={styles.overlay} onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h3>{form==='new'?lbl('Medewerker toevoegen','Add worker'):lbl('Bewerken','Edit')}</h3>
              <button className={styles.formClose} onClick={()=>setForm(null)}><X size={16}/></button>
            </div>
            <div className={styles.formBody}>
              <div className={styles.fRow}>
                <FField label={lbl('Naam','Name')+' *'}><input className={styles.fInput} value={formData.name} onChange={e=>setFormData(d=>({...d,name:e.target.value}))} placeholder="Jan de Vries"/></FField>
                <FField label={lbl('Functie','Role')}>
                  <select className={styles.fInput} value={formData.role} onChange={e=>setFormData(d=>({...d,role:e.target.value}))}>
                    {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </FField>
              </div>
              <div className={styles.fRow}>
                <FField label={lbl('Tarief normaal (€/u)','Rate normal (€/h)')}>
                  <input type="number" min="0" step="0.5" className={styles.fInput} value={formData.hourlyRate} onChange={e=>setFormData(d=>({...d,hourlyRate:+e.target.value}))}/>
                </FField>
                <FField label={lbl('Tarief overwerk (€/u)','Rate overtime (€/h)')}>
                  <input type="number" min="0" step="0.5" className={styles.fInput} value={formData.overtimeRate} onChange={e=>setFormData(d=>({...d,overtimeRate:+e.target.value}))}/>
                </FField>
              </div>
              <div className={styles.fRow}>
                <FField label={lbl('Telefoon','Phone')}><input className={styles.fInput} value={formData.phone} onChange={e=>setFormData(d=>({...d,phone:e.target.value}))} placeholder="+31 6…"/></FField>
                <FField label="E-mail"><input className={styles.fInput} value={formData.email} onChange={e=>setFormData(d=>({...d,email:e.target.value}))}/></FField>
              </div>
              <FField label={lbl('Kleur','Color')}>
                <div className={styles.colorRow}>
                  {COLORS.map(c=>(
                    <button key={c} type="button" className={`${styles.colorDot} ${formData.color===c?styles.colorActive:''}`}
                      style={{background:c}} onClick={()=>setFormData(d=>({...d,color:c}))}/>
                  ))}
                </div>
              </FField>
              <FField label={lbl('Status','Status')}>
                <select className={styles.fInput} value={formData.status} onChange={e=>setFormData(d=>({...d,status:e.target.value}))}>
                  <option value="actief">{lbl('Actief','Active')}</option>
                  <option value="inactief">{lbl('Inactief','Inactive')}</option>
                </select>
              </FField>
            </div>
            <div className={styles.formFooter}>
              <button className={styles.cancelBtn} onClick={()=>setForm(null)}>{lbl('Annuleren','Cancel')}</button>
              <button className={styles.saveBtn} onClick={handleSave}><ChevronRight size={14}/>{lbl('Opslaan','Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function FField({label,children}){return <div className={styles.fField}><label>{label}</label>{children}</div>}