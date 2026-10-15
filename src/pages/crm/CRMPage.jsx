import { useState, useMemo, useEffect } from 'react'
import {
  Search, Phone, Mail, MapPin, MessageSquare,
  FolderKanban, FileText, Euro, Plus, X, ChevronRight,
  Clock, PhoneCall, AlertCircle, CalendarDays
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import styles from './CRMPage.module.css'

const NOTE_TYPES = [
  { key:'gesprek',    nl:'Gesprek',    en:'Meeting',    Icon:MessageSquare, color:'#1565C0', bg:'#E3F2FD' },
  { key:'telefoon',   nl:'Telefoon',   en:'Phone call', Icon:PhoneCall,     color:'#2E7D32', bg:'#E8F5E9' },
  { key:'email',      nl:'E-mail',     en:'Email',      Icon:Mail,          color:'#7B1FA2', bg:'#F3E5F5' },
  { key:'vergadering',nl:'Vergadering',en:'Meeting',    Icon:CalendarDays,  color:'#E65100', bg:'#FFF3E0' },
  { key:'probleem',   nl:'Probleem',   en:'Issue',      Icon:AlertCircle,   color:'#C8102E', bg:'#FFEBEE' },
]

function getNoteType(key) { return NOTE_TYPES.find(t => t.key === key) || NOTE_TYPES[0] }
function fmtDate(d) {
  if (!d) return '—'
  return d.toString().slice(0, 10).split('-').reverse().join('-')
}
function fmtEur(n) { return '€ ' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 0 }) }

// Support snake_case (DB) and camelCase
function g(o, camel, snake) { return o[camel] !== undefined ? o[camel] : o[snake] }

export default function CRMPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  // Per-client data (loaded on demand)
  const [client360,    setClient360]    = useState(null)
  const [loading360,   setLoading360]   = useState(false)
  // Forms
  const [noteForm, setNoteForm] = useState(false)
  const [newNote,  setNewNote]  = useState({ type:'gesprek', content:'', followUp:'', author:'Jan de Vries' })
  const [contForm, setContForm] = useState(false)
  const [newCont,  setNewCont]  = useState({ name:'', role:'', phone:'', email:'', primary:false })

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    try {
      setLoading(true)
      const data = await api.get('/clients')
      setClients(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function selectClient(c) {
    setSelected(c)
    setLoading360(true)
    try {
      const data = await api.get(`/crm/client/${c.id}`)
      setClient360(data)
    } catch (e) { console.error(e) }
    finally { setLoading360(false) }
  }

  async function saveNote() {
    if (!newNote.content.trim() || !selected) return
    try {
      const created = await api.post('/crm/notes', {
        clientId:  selected.id,
        date:      new Date().toISOString().slice(0, 10),
        type:      newNote.type,
        author:    newNote.author,
        content:   newNote.content,
        followUp:  newNote.followUp || null,
      })
      setClient360(d => ({ ...d, notes: [created, ...(d.notes || [])] }))
      setNoteForm(false)
      setNewNote({ type:'gesprek', content:'', followUp:'', author:'Jan de Vries' })
    } catch (e) { alert(e.message) }
  }

  async function saveContact() {
    if (!newCont.name.trim() || !selected) return
    try {
      const created = await api.post('/crm/contacts', {
        clientId:      selected.id,
        name:          newCont.name,
        role:          newCont.role,
        phone:         newCont.phone,
        email:         newCont.email,
        primaryContact:newCont.primary,
      })
      setClient360(d => ({ ...d, contacts: [...(d.contacts || []), created] }))
      setContForm(false)
      setNewCont({ name:'', role:'', phone:'', email:'', primary:false })
    } catch (e) { alert(e.message) }
  }

  const filteredClients = useMemo(() => clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    const firstName = g(c,'firstName','first_name') || ''
    const lastName  = g(c,'lastName', 'last_name')  || ''
    const company   = g(c,'companyName','company_name') || ''
    const name = `${firstName} ${lastName} ${company}`.toLowerCase()
    return name.includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
  }), [clients, search])

  // ── Client list view ─────────────────────────────────────────────────────────
  if (!selected) return (
    <div className={styles.page}>
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div style={{ width:32, height:32, border:'3px solid #e0e0e0', borderTopColor:'#1A3E6F', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>CRM</h1>
              <p className={styles.pageSubtitle}>{lbl('360° klantenoverzicht','360° client overview')}</p>
            </div>
          </div>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon}/>
            <input className={styles.searchInput} placeholder={lbl('Klant zoeken…','Search client…')} value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className={styles.clientGrid}>
            {filteredClients.map(c => {
              const firstName = g(c,'firstName','first_name') || ''
              const lastName  = g(c,'lastName', 'last_name')  || ''
              const company   = g(c,'companyName','company_name') || ''
              const displayName = c.type === 'individual' ? `${firstName} ${lastName}`.trim() : company || `${firstName} ${lastName}`.trim()
              const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={c.id} className={styles.clientCard} onClick={() => selectClient(c)}>
                  <div className={styles.ccTop}>
                    <div className={styles.ccAvatar}>{initials}</div>
                    <div className={styles.ccInfo}>
                      <span className={styles.ccName}>{displayName}</span>
                      <span className={styles.ccType}>{lbl(c.type==='individual'?'Particulier':c.type==='company'?'Bedrijf':'Organisatie','')}</span>
                    </div>
                    <span className={styles.statusDot} style={{ background: c.status==='active'?'#43A047':c.status==='prospect'?'#FB8C00':'#9E9E9E' }}/>
                  </div>
                  <div className={styles.ccContact}>
                    {c.city    && <span><MapPin size={11}/>{c.city}</span>}
                    {(c.phone1 || g(c,'phone1','phone_1')) && <span><Phone size={11}/>{c.phone1 || g(c,'phone1','phone_1')}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )

  // ── Client 360 detail view ────────────────────────────────────────────────────
  const firstName = g(selected,'firstName','first_name') || ''
  const lastName  = g(selected,'lastName', 'last_name')  || ''
  const company   = g(selected,'companyName','company_name') || ''
  const displayName = selected.type === 'individual' ? `${firstName} ${lastName}`.trim() : company || `${firstName} ${lastName}`.trim()
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const cd = client360 || {}
  const projects = cd.projects || []
  const offertes = cd.offertes || []
  const facturen = cd.facturen || []
  const notes    = cd.notes    || []
  const contacts = cd.contacts || []

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={() => { setSelected(null); setClient360(null) }}>
          ← {lbl('Alle klanten','All clients')}
        </button>
        <div className={styles.clientHero}>
          <div className={styles.heroAvatar}>{initials}</div>
          <div>
            <h1 className={styles.heroName}>{displayName}</h1>
            <div className={styles.heroMeta}>
              {selected.city  && <span><MapPin size={12}/>{selected.city}</span>}
              {selected.email && <span><Mail size={12}/>{selected.email}</span>}
              {(selected.phone1||g(selected,'phone1','phone_1')) && <span><Phone size={12}/>{selected.phone1||g(selected,'phone1','phone_1')}</span>}
            </div>
          </div>
        </div>
        <div className={styles.heroKpis}>
          {[
            { label:lbl('Projecten','Projects'), val:projects.length,   color:'var(--blue)' },
            { label:lbl('Offertes','Quotes'),    val:offertes.length,   color:'#7B1FA2' },
            { label:lbl('Facturen','Invoices'),  val:facturen.length,   color:'#E65100' },
            { label:lbl('Omzet','Revenue'),      val:fmtEur(facturen.reduce((s,f) => s + (+f.total_incl||0), 0)), color:'#2E7D32' },
          ].map(k => (
            <div key={k.label} className={styles.heroKpi}>
              <span className={styles.heroKpiVal} style={{ color: k.color }}>{k.val}</span>
              <span className={styles.heroKpiLbl}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading360 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
          <div style={{ width:28, height:28, border:'3px solid #e0e0e0', borderTopColor:'#1A3E6F', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div className={styles.detail360}>
          {/* Left col */}
          <div className={styles.leftCol}>
            {/* Contacts */}
            <Section title={lbl('Contactpersonen','Contacts')} action={<button className={styles.addSmBtn} onClick={() => setContForm(true)}><Plus size={12}/></button>}>
              {contacts.length === 0 && <p className={styles.emptyMini}>{lbl('Geen contacten','No contacts')}</p>}
              {contacts.map(ct => (
                <div key={ct.id} className={styles.contactRow}>
                  <div className={styles.contactAvatar}>{ct.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                  <div className={styles.contactInfo}>
                    <span className={styles.contactName}>{ct.name} {(ct.primary_contact||ct.primaryContact) && <span className={styles.primaryBadge}>Primary</span>}</span>
                    <span className={styles.contactRole}>{ct.role}</span>
                    {ct.phone && <span className={styles.contactDetail}><Phone size={10}/>{ct.phone}</span>}
                    {ct.email && <span className={styles.contactDetail}><Mail size={10}/>{ct.email}</span>}
                  </div>
                </div>
              ))}
            </Section>

            {/* Projects */}
            <Section title={lbl('Projecten','Projects')}>
              {projects.length === 0 && <p className={styles.emptyMini}>{lbl('Geen projecten','No projects')}</p>}
              {projects.map(p => (
                <div key={p.id} className={styles.miniRow}>
                  <span className={styles.miniDot} style={{ background: p.status==='in_progress'?'#FB8C00':p.status==='completed'?'#43A047':'#1E88E5' }}/>
                  <div className={styles.miniInfo}>
                    <span className={styles.miniName}>{p.name}</span>
                    <span className={styles.miniSub}>{p.status} · {fmtEur(+p.budget||0)}</span>
                  </div>
                </div>
              ))}
            </Section>

            {/* Offertes */}
            <Section title={lbl('Offertes','Quotes')}>
              {offertes.length === 0 && <p className={styles.emptyMini}>{lbl('Geen offertes','No quotes')}</p>}
              {offertes.map(o => (
                <div key={o.id} className={styles.miniRow}>
                  <span className={styles.miniNum}>{g(o,'offerteNumber','offerte_number')}</span>
                  <div className={styles.miniInfo}>
                    <span className={styles.miniName}>{g(o,'projectName','project_name')}</span>
                    <span className={styles.miniSub}>{fmtDate(o.date)} · {o.status}</span>
                  </div>
                </div>
              ))}
            </Section>

            {/* Facturen */}
            <Section title={lbl('Facturen','Invoices')}>
              {facturen.length === 0 && <p className={styles.emptyMini}>{lbl('Geen facturen','No invoices')}</p>}
              {facturen.map(f => (
                <div key={f.id} className={styles.miniRow}>
                  <span className={styles.miniNum}>{g(f,'factuurNumber','factuur_number')}</span>
                  <div className={styles.miniInfo}>
                    <span className={styles.miniName}>{fmtEur(+f.total_incl||0)}</span>
                    <span className={styles.miniSub}>{fmtDate(f.date)} · <span style={{ color:f.status==='betaald'?'#2E7D32':'#E65100' }}>{f.status}</span></span>
                  </div>
                </div>
              ))}
            </Section>
          </div>

          {/* Right col: activity timeline */}
          <div className={styles.rightCol}>
            <div className={styles.timelineHeader}>
              <h3 className={styles.sectionTitle}>{lbl('Activiteitenlogboek','Activity log')}</h3>
              <button className={styles.addSmBtn} onClick={() => setNoteForm(true)}><Plus size={12}/>{lbl('Notitie','Note')}</button>
            </div>
            <div className={styles.timeline}>
              {notes.length === 0 && <p className={styles.emptyMini}>{lbl('Geen activiteiten','No activity yet')}</p>}
              {[...notes].sort((a,b) => (b.date||'').localeCompare(a.date||'')).map(note => {
                const nt    = getNoteType(note.type)
                const NIcon = nt.Icon
                const followUp     = g(note,'followUp','follow_up')
                const followUpDone = g(note,'followUpDone','follow_up_done')
                return (
                  <div key={note.id} className={styles.timelineItem}>
                    <div className={styles.tlIcon} style={{ background: nt.bg, color: nt.color }}><NIcon size={14}/></div>
                    <div className={styles.tlContent}>
                      <div className={styles.tlTop}>
                        <span className={styles.tlType} style={{ color: nt.color }}>{lang==='nl'?nt.nl:nt.en}</span>
                        <span className={styles.tlDate}>{fmtDate(note.date)}</span>
                        <span className={styles.tlAuthor}>{note.author}</span>
                      </div>
                      <p className={styles.tlText}>{note.content}</p>
                      {followUp && (
                        <div className={`${styles.tlFollowUp} ${followUpDone?styles.tlFollowUpDone:''}`}>
                          <Clock size={11}/>
                          {lbl('Opvolging','Follow-up')}: {fmtDate(followUp)}
                          {followUpDone && <span className={styles.doneBadge}>✓ {lbl('Gedaan','Done')}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Note modal */}
      {noteForm && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setNoteForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{lbl('Notitie toevoegen','Add note')}</h3>
              <button onClick={() => setNoteForm(false)} className={styles.closeBtn}><X size={16}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.mField}>
                <label>{lbl('Type','Type')}</label>
                <div className={styles.typeRow}>
                  {NOTE_TYPES.map(t => (
                    <label key={t.key} className={`${styles.typeOpt} ${newNote.type===t.key?styles.typeOptActive:''}`}
                      style={newNote.type===t.key?{borderColor:t.color,background:t.bg}:{}}>
                      <input type="radio" name="ntype" value={t.key} checked={newNote.type===t.key}
                        onChange={() => setNewNote(n => ({...n,type:t.key}))} className={styles.rHidden}/>
                      <t.Icon size={13} style={{color:t.color}}/><span style={{fontSize:12,fontWeight:600,color:t.color}}>{lang==='nl'?t.nl:t.en}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.mField}>
                <label>{lbl('Inhoud','Content')}</label>
                <textarea className={styles.mTextarea} rows={4} value={newNote.content}
                  onChange={e => setNewNote(n => ({...n,content:e.target.value}))}
                  placeholder={lbl('Omschrijf de activiteit…','Describe the activity…')}/>
              </div>
              <div className={styles.mField}>
                <label>{lbl('Opvolgingsdatum','Follow-up date')}</label>
                <input type="date" className={styles.mInp} value={newNote.followUp}
                  onChange={e => setNewNote(n => ({...n,followUp:e.target.value}))}/>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn2} onClick={() => setNoteForm(false)}>{lbl('Annuleren','Cancel')}</button>
              <button className={styles.saveBtn3} onClick={saveNote}><ChevronRight size={14}/>{lbl('Opslaan','Save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contForm && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setContForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{lbl('Contactpersoon toevoegen','Add contact')}</h3>
              <button onClick={() => setContForm(false)} className={styles.closeBtn}><X size={16}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.mRow}>
                <div className={styles.mField}><label>{lbl('Naam','Name')}</label><input className={styles.mInp} value={newCont.name} onChange={e => setNewCont(c => ({...c,name:e.target.value}))}/></div>
                <div className={styles.mField}><label>{lbl('Functie','Role')}</label><input className={styles.mInp} value={newCont.role} onChange={e => setNewCont(c => ({...c,role:e.target.value}))}/></div>
              </div>
              <div className={styles.mRow}>
                <div className={styles.mField}><label>{lbl('Telefoon','Phone')}</label><input className={styles.mInp} value={newCont.phone} onChange={e => setNewCont(c => ({...c,phone:e.target.value}))}/></div>
                <div className={styles.mField}><label>E-mail</label><input className={styles.mInp} value={newCont.email} onChange={e => setNewCont(c => ({...c,email:e.target.value}))}/></div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn2} onClick={() => setContForm(false)}>{lbl('Annuleren','Cancel')}</button>
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