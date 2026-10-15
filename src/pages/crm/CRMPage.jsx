import { useState, useMemo } from 'react'
import {
  Search, Users, Phone, Mail, MapPin, MessageSquare,
  FolderKanban, FileText, Euro, Plus, X, ChevronRight,
  Clock, PhoneCall, AlertCircle, CalendarDays, Building2
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clientsSeed } from '../../data/clientsSeed'
import { projectsSeed } from '../../data/projectsSeed'
import { offertesSeed, factuurSeed } from '../../data/financeSeed'
import { crmNotesSeed, crmContactsSeed } from '../../data/crmSeed'
import styles from './CRMPage.module.css'

const NOTE_TYPES = [
  { key:'gesprek',    nl:'Gesprek',    en:'Meeting',    Icon:MessageSquare, color:'#1565C0', bg:'#E3F2FD' },
  { key:'telefoon',   nl:'Telefoon',   en:'Phone call', Icon:PhoneCall,     color:'#2E7D32', bg:'#E8F5E9' },
  { key:'email',      nl:'E-mail',     en:'Email',      Icon:Mail,          color:'#7B1FA2', bg:'#F3E5F5' },
  { key:'vergadering',nl:'Vergadering',en:'Meeting',    Icon:CalendarDays,  color:'#E65100', bg:'#FFF3E0' },
  { key:'probleem',   nl:'Probleem',   en:'Issue',      Icon:AlertCircle,   color:'#C8102E', bg:'#FFEBEE' },
]

function getNoteType(key) { return NOTE_TYPES.find(t=>t.key===key)||NOTE_TYPES[0] }

function fmtDate(d) {
  if (!d) return '—'
  const [y,m,day]=d.split('-'); return `${day}-${m}-${y}`
}
function fmtEur(n) { return '€ '+Number(n||0).toLocaleString('nl-NL',{minimumFractionDigits:0}) }

function calcTotalIncl(lines) { return (lines||[]).reduce((s,l)=>s+l.qty*l.unitPrice*(1+l.btw/100),0) }

export default function CRMPage() {
  const { lang } = useLang()
  const lbl = (nl,en) => lang==='nl'?nl:en

  const [notes,    setNotes]    = useState(crmNotesSeed)
  const [contacts, setContacts] = useState(crmContactsSeed)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [noteForm, setNoteForm] = useState(false)
  const [newNote,  setNewNote]  = useState({ type:'gesprek', content:'', followUp:'', author:'Jan de Vries' })
  const [contForm, setContForm] = useState(false)
  const [newCont,  setNewCont]  = useState({ name:'', role:'', phone:'', email:'', primary:false })

  const filteredClients = useMemo(() => clientsSeed.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = `${c.firstName} ${c.lastName} ${c.companyName}`.toLowerCase()
    return name.includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
  }), [search])

  function clientStats(cId) {
    const projs    = projectsSeed.filter(p=>p.clientId===cId)
    const offertes = offertesSeed.filter(o=>o.clientId===cId||projs.some(p=>p.name===o.projectName))
    const facturen = factuurSeed.filter(f=>f.clientId===cId||projs.some(p=>p.name===f.projectName))
    const revenue  = facturen.reduce((s,f)=>s+calcTotalIncl(f.lines),0)
    const cNotes   = notes.filter(n=>n.clientId===cId)
    const cConts   = contacts.filter(c=>c.clientId===cId)
    return { projs:projs.length, offertes:offertes.length, facturen:facturen.length, revenue, notes:cNotes.length, contacts:cConts.length }
  }

  function getClientData(c) {
    const s = clientStats(c.id)
    const projs    = projectsSeed.filter(p=>p.clientId===c.id)
    const offertes = offertesSeed.filter(o=>o.clientId===c.id||projs.some(p=>p.name===o.projectName))
    const facturen = factuurSeed.filter(f=>f.clientId===c.id||projs.some(p=>p.name===f.projectName))
    const cNotes   = notes.filter(n=>n.clientId===c.id).sort((a,b)=>b.date.localeCompare(a.date))
    const cConts   = contacts.filter(ct=>ct.clientId===c.id)
    return { ...s, projs, offertes, facturen, cNotes, cConts }
  }

  function saveNote() {
    if (!newNote.content.trim()||!selected) return
    const id=Math.max(0,...notes.map(n=>n.id))+1
    setNotes(ns=>[...ns,{...newNote,id,clientId:selected.id,date:new Date().toISOString().slice(0,10),followUpDone:false}])
    setNoteForm(false)
    setNewNote({type:'gesprek',content:'',followUp:'',author:'Jan de Vries'})
  }

  function saveContact() {
    if (!newCont.name.trim()||!selected) return
    const id=Math.max(0,...contacts.map(c=>c.id))+1
    setContacts(cs=>[...cs,{...newCont,id,clientId:selected.id}])
    setContForm(false)
    setNewCont({name:'',role:'',phone:'',email:'',primary:false})
  }

  // Client list view
  if (!selected) return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>CRM</h1>
          <p className={styles.pageSubtitle}>{lbl('360° klantenoverzicht','360° client overview')}</p>
        </div>
      </div>
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon}/>
        <input className={styles.searchInput} placeholder={lbl('Klant zoeken…','Search client…')} value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div className={styles.clientGrid}>
        {filteredClients.map(c => {
          const s = clientStats(c.id)
          const displayName = c.type==='individual' ? `${c.firstName} ${c.lastName}` : c.companyName||`${c.firstName} ${c.lastName}`
          const initials = displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
          const hasActivity = s.projs>0||s.notes>0
          return (
            <div key={c.id} className={`${styles.clientCard} ${!hasActivity?styles.clientCardQuiet:''}`} onClick={()=>setSelected(c)}>
              <div className={styles.ccTop}>
                <div className={styles.ccAvatar}>{initials}</div>
                <div className={styles.ccInfo}>
                  <span className={styles.ccName}>{displayName}</span>
                  <span className={styles.ccType}>{lbl(c.type==='individual'?'Particulier':c.type==='company'?'Bedrijf':'Organisatie','')}</span>
                </div>
                <span className={styles.statusDot} style={{background:c.status==='active'?'#43A047':c.status==='prospect'?'#FB8C00':'#9E9E9E'}}/>
              </div>
              <div className={styles.ccContact}>
                {c.city&&<span><MapPin size={11}/>{c.city}</span>}
                {c.phone1&&<span><Phone size={11}/>{c.phone1}</span>}
              </div>
              <div className={styles.ccStats}>
                <div className={styles.ccStat}><span className={styles.ccStatVal} style={{color:'var(--blue)'}}>{s.projs}</span><span className={styles.ccStatLbl}>{lbl('Projecten','Projects')}</span></div>
                <div className={styles.ccStat}><span className={styles.ccStatVal} style={{color:'#2E7D32'}}>{fmtEur(s.revenue)}</span><span className={styles.ccStatLbl}>{lbl('Omzet','Revenue')}</span></div>
                <div className={styles.ccStat}><span className={styles.ccStatVal}>{s.notes}</span><span className={styles.ccStatLbl}>{lbl('Notities','Notes')}</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Client 360 detail view
  const cd = getClientData(selected)
  const displayName = selected.type==='individual' ? `${selected.firstName} ${selected.lastName}` : selected.companyName||`${selected.firstName} ${selected.lastName}`
  const initials = displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={()=>setSelected(null)}>← {lbl('Alle klanten','All clients')}</button>
        <div className={styles.clientHero}>
          <div className={styles.heroAvatar}>{initials}</div>
          <div>
            <h1 className={styles.heroName}>{displayName}</h1>
            <div className={styles.heroMeta}>
              {selected.city&&<span><MapPin size={12}/>{selected.city}</span>}
              {selected.email&&<span><Mail size={12}/>{selected.email}</span>}
              {selected.phone1&&<span><Phone size={12}/>{selected.phone1}</span>}
            </div>
          </div>
        </div>
        <div className={styles.heroKpis}>
          {[
            {label:lbl('Projecten','Projects'), val:cd.projs, color:'var(--blue)'},
            {label:lbl('Offertes','Quotes'),    val:cd.offertes, color:'#7B1FA2'},
            {label:lbl('Facturen','Invoices'),  val:cd.facturen, color:'#E65100'},
            {label:lbl('Omzet','Revenue'),      val:fmtEur(cd.revenue), color:'#2E7D32'},
          ].map(k=>(
            <div key={k.label} className={styles.heroKpi}>
              <span className={styles.heroKpiVal} style={{color:k.color}}>{k.val}</span>
              <span className={styles.heroKpiLbl}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.detail360}>
        {/* Left col */}
        <div className={styles.leftCol}>
          {/* Contacts */}
          <Section title={lbl('Contactpersonen','Contacts')} action={<button className={styles.addSmBtn} onClick={()=>setContForm(true)}><Plus size={12}/></button>}>
            {cd.cConts.length===0&&<p className={styles.emptyMini}>{lbl('Geen contacten','No contacts')}</p>}
            {cd.cConts.map(ct=>(
              <div key={ct.id} className={styles.contactRow}>
                <div className={styles.contactAvatar}>{ct.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                <div className={styles.contactInfo}>
                  <span className={styles.contactName}>{ct.name} {ct.primary&&<span className={styles.primaryBadge}>Primary</span>}</span>
                  <span className={styles.contactRole}>{ct.role}</span>
                  {ct.phone&&<span className={styles.contactDetail}><Phone size={10}/>{ct.phone}</span>}
                  {ct.email&&<span className={styles.contactDetail}><Mail size={10}/>{ct.email}</span>}
                </div>
              </div>
            ))}
          </Section>

          {/* Projects */}
          <Section title={lbl('Projecten','Projects')}>
            {cd.projs.length===0&&<p className={styles.emptyMini}>{lbl('Geen projecten','No projects')}</p>}
            {cd.projs.map(p=>(
              <div key={p.id} className={styles.miniRow}>
                <span className={styles.miniDot} style={{background:p.status==='in_progress'?'#FB8C00':p.status==='completed'?'#43A047':'#1E88E5'}}/>
                <div className={styles.miniInfo}>
                  <span className={styles.miniName}>{p.name}</span>
                  <span className={styles.miniSub}>{p.status} · {fmtEur(+p.budget)}</span>
                </div>
              </div>
            ))}
          </Section>

          {/* Offertes */}
          <Section title={lbl('Offertes','Quotes')}>
            {cd.offertes.length===0&&<p className={styles.emptyMini}>{lbl('Geen offertes','No quotes')}</p>}
            {cd.offertes.map(o=>(
              <div key={o.id} className={styles.miniRow}>
                <span className={styles.miniNum}>{o.offerteNumber}</span>
                <div className={styles.miniInfo}>
                  <span className={styles.miniName}>{o.projectName}</span>
                  <span className={styles.miniSub}>{fmtDate(o.date)} · {o.status}</span>
                </div>
              </div>
            ))}
          </Section>

          {/* Facturen */}
          <Section title={lbl('Facturen','Invoices')}>
            {cd.facturen.length===0&&<p className={styles.emptyMini}>{lbl('Geen facturen','No invoices')}</p>}
            {cd.facturen.map(f=>(
              <div key={f.id} className={styles.miniRow}>
                <span className={styles.miniNum}>{f.factuurNumber}</span>
                <div className={styles.miniInfo}>
                  <span className={styles.miniName}>{fmtEur(calcTotalIncl(f.lines))}</span>
                  <span className={styles.miniSub}>{fmtDate(f.date)} · <span style={{color:f.status==='betaald'?'#2E7D32':'#E65100'}}>{f.status}</span></span>
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* Right col: timeline */}
        <div className={styles.rightCol}>
          <div className={styles.timelineHeader}>
            <h3 className={styles.sectionTitle}>{lbl('Activiteitenlogboek','Activity log')}</h3>
            <button className={styles.addSmBtn} onClick={()=>setNoteForm(true)}><Plus size={12}/>{lbl('Notitie','Note')}</button>
          </div>
          <div className={styles.timeline}>
            {cd.cNotes.length===0&&<p className={styles.emptyMini}>{lbl('Geen activiteiten','No activity yet')}</p>}
            {cd.cNotes.map(note=>{
              const nt = getNoteType(note.type)
              const NIcon = nt.Icon
              return (
                <div key={note.id} className={styles.timelineItem}>
                  <div className={styles.tlIcon} style={{background:nt.bg,color:nt.color}}><NIcon size={14}/></div>
                  <div className={styles.tlContent}>
                    <div className={styles.tlTop}>
                      <span className={styles.tlType} style={{color:nt.color}}>{lang==='nl'?nt.nl:nt.en}</span>
                      <span className={styles.tlDate}>{fmtDate(note.date)}</span>
                      <span className={styles.tlAuthor}>{note.author}</span>
                    </div>
                    <p className={styles.tlText}>{note.content}</p>
                    {note.followUp&&(
                      <div className={`${styles.tlFollowUp} ${note.followUpDone?styles.tlFollowUpDone:''}`}>
                        <Clock size={11}/>
                        {lbl('Opvolging','Follow-up')}: {fmtDate(note.followUp)}
                        {note.followUpDone&&<span className={styles.doneBadge}>✓ {lbl('Gedaan','Done')}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Note form */}
      {noteForm && (
        <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&setNoteForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}><h3>{lbl('Notitie toevoegen','Add note')}</h3><button onClick={()=>setNoteForm(false)} className={styles.closeBtn}><X size={16}/></button></div>
            <div className={styles.modalBody}>
              <div className={styles.mField}>
                <label>{lbl('Type','Type')}</label>
                <div className={styles.typeRow}>
                  {NOTE_TYPES.map(t=>(
                    <label key={t.key} className={`${styles.typeOpt} ${newNote.type===t.key?styles.typeOptActive:''}`}
                      style={newNote.type===t.key?{borderColor:t.color,background:t.bg}:{}}>
                      <input type="radio" name="ntype" value={t.key} checked={newNote.type===t.key}
                        onChange={()=>setNewNote(n=>({...n,type:t.key}))} className={styles.rHidden}/>
                      <t.Icon size={13} style={{color:t.color}}/><span style={{fontSize:12,fontWeight:600,color:t.color}}>{lang==='nl'?t.nl:t.en}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.mField}>
                <label>{lbl('Inhoud','Content')}</label>
                <textarea className={styles.mTextarea} rows={4} value={newNote.content} onChange={e=>setNewNote(n=>({...n,content:e.target.value}))} placeholder={lbl('Omschrijf de activiteit of afspraak…','Describe the activity or appointment…')}/>
              </div>
              <div className={styles.mField}>
                <label>{lbl('Opvolgingsdatum','Follow-up date')}</label>
                <input type="date" className={styles.mInp} value={newNote.followUp} onChange={e=>setNewNote(n=>({...n,followUp:e.target.value}))}/>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn2} onClick={()=>setNoteForm(false)}>{lbl('Annuleren','Cancel')}</button>
              <button className={styles.saveBtn3} onClick={saveNote}><ChevronRight size={14}/>{lbl('Opslaan','Save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact form */}
      {contForm && (
        <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&setContForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}><h3>{lbl('Contactpersoon toevoegen','Add contact')}</h3><button onClick={()=>setContForm(false)} className={styles.closeBtn}><X size={16}/></button></div>
            <div className={styles.modalBody}>
              <div className={styles.mRow}>
                <div className={styles.mField}><label>{lbl('Naam','Name')}</label><input className={styles.mInp} value={newCont.name} onChange={e=>setNewCont(c=>({...c,name:e.target.value}))}/></div>
                <div className={styles.mField}><label>{lbl('Functie','Role')}</label><input className={styles.mInp} value={newCont.role} onChange={e=>setNewCont(c=>({...c,role:e.target.value}))}/></div>
              </div>
              <div className={styles.mRow}>
                <div className={styles.mField}><label>{lbl('Telefoon','Phone')}</label><input className={styles.mInp} value={newCont.phone} onChange={e=>setNewCont(c=>({...c,phone:e.target.value}))}/></div>
                <div className={styles.mField}><label>E-mail</label><input className={styles.mInp} value={newCont.email} onChange={e=>setNewCont(c=>({...c,email:e.target.value}))}/></div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn2} onClick={()=>setContForm(false)}>{lbl('Annuleren','Cancel')}</button>
              <button className={styles.saveBtn3} onClick={saveContact}><ChevronRight size={14}/>{lbl('Opslaan','Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {action}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}