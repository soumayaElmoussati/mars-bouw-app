import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, FileText, Pencil, Trash2, CheckCircle,
  Clock, User, PenLine, X, ChevronRight, Printer
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import styles from './WerkbonPage.module.css'

const STATUS_STYLE = {
  concept:     { bg: '#F5F5F5', color: '#757575', nl: 'Concept',      en: 'Draft'   },
  verzonden:   { bg: '#E3F2FD', color: '#1565C0', nl: 'Verzonden',    en: 'Sent'    },
  ondertekend: { bg: '#E8F5E9', color: '#2E7D32', nl: 'Ondertekend', en: 'Signed'  },
}

function fmtDate(d) {
  if (!d) return '—'
  return d.toString().slice(0, 10).split('-').reverse().join('-')
}

export default function WerkbonPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [werkbonnen, setWerkbonnen] = useState([])
  const [projects,   setProjects]   = useState([])
  const [workers,    setWorkers]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [view,       setView]       = useState('list')   // 'list' | 'detail'
  const [selected,   setSelected]   = useState(null)
  const [editMode,   setEditMode]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [signing,    setSigning]    = useState(false)
  const [signedBy,   setSignedBy]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [wb, pr, wk] = await Promise.all([
        api.get('/werkbon'),
        api.get('/projects'),
        api.get('/timetracking/workers'),
      ])
      setWerkbonnen(wb); setProjects(pr); setWorkers(wk)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() =>
    werkbonnen.filter(w => {
      const q = search.toLowerCase()
      return !q || w.number?.toLowerCase().includes(q) ||
        w.client_name?.toLowerCase().includes(q) ||
        w.project_name?.toLowerCase().includes(q)
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  , [werkbonnen, search])

  const stats = useMemo(() => ({
    total:       werkbonnen.length,
    concept:     werkbonnen.filter(w => w.status === 'concept').length,
    verzonden:   werkbonnen.filter(w => w.status === 'verzonden').length,
    ondertekend: werkbonnen.filter(w => w.status === 'ondertekend').length,
  }), [werkbonnen])

  async function openNew() {
    const blank = {
      id: null, number: '', project_id: '', project_name: '', client_name: '', client_address: '',
      date: new Date().toISOString().slice(0, 10),
      workers: [], works: [], materials: [],
      notes: '', problems: '', next_steps: '', status: 'concept',
      client_signed_by: null, signed_at: null,
    }
    setSelected(blank); setEditMode(true); setView('detail')
  }

  async function handleSave(data) {
    setSaving(true)
    try {
      let result
      if (data.id) {
        result = await api.put(`/werkbon/${data.id}`, toApiPayload(data))
        setWerkbonnen(ws => ws.map(w => w.id === data.id ? result : w))
      } else {
        result = await api.post('/werkbon', toApiPayload(data))
        setWerkbonnen(ws => [result, ...ws])
      }
      setSelected(result); setEditMode(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function handleSign() {
    if (!signedBy.trim() || !selected?.id) return
    try {
      const result = await api.post(`/werkbon/${selected.id}/sign`, { clientSignedBy: signedBy })
      setWerkbonnen(ws => ws.map(w => w.id === selected.id ? result : w))
      setSelected(result); setSigning(false)
    } catch (e) { alert(e.message) }
  }

  async function handleDelete(id) {
    if (!confirm(lbl('Werkbon verwijderen?', 'Delete work order?'))) return
    try {
      await api.delete(`/werkbon/${id}`)
      setWerkbonnen(ws => ws.filter(w => w.id !== id))
      setView('list'); setSelected(null)
    } catch (e) { alert(e.message) }
  }

  function toApiPayload(data) {
    return {
      projectId:     data.project_id || data.projectId || null,
      projectName:   data.project_name || data.projectName || '',
      clientName:    data.client_name  || data.clientName  || '',
      clientAddress: data.client_address || data.clientAddress || '',
      date:          data.date,
      notes:         data.notes || '',
      problems:      data.problems || '',
      nextSteps:     data.next_steps || data.nextSteps || '',
      status:        data.status || 'concept',
      clientSignedBy:data.client_signed_by || data.clientSignedBy || null,
      signedAt:      data.signed_at || data.signedAt || null,
      workers:       (data.workers || []).map(w => ({
        workerId:     w.worker_id || w.workerId || null,
        name:         w.name || '',
        startTime:    w.start_time || w.startTime || '08:00',
        endTime:      w.end_time   || w.endTime   || '17:00',
        breakMinutes: w.break_minutes || w.breakMinutes || 30,
        hours:        w.hours || 0,
      })),
      works:    (data.works || []).map(w => ({
        description: w.description || '', qty: w.qty || 1, unit: w.unit || 'stuk', done: w.done || false,
      })),
      materials:(data.materials || []).map(m => ({
        name: m.name || '', qty: m.qty || 1, unit: m.unit || 'stuk',
      })),
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1A3E6F', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (view === 'detail' && selected) {
    return (
      <WerkbonDetail
        werkbon={selected}
        editMode={editMode}
        lang={lang}
        projects={projects}
        workers={workers}
        saving={saving}
        signing={signing}
        signedBy={signedBy}
        onSignedByChange={setSignedBy}
        onStartSign={() => setSigning(true)}
        onCancelSign={() => setSigning(false)}
        onSign={handleSign}
        onEdit={() => setEditMode(true)}
        onSave={handleSave}
        onCancelEdit={() => {
          if (!selected.id) { setView('list'); setSelected(null) }
          else setEditMode(false)
        }}
        onBack={() => { setView('list'); setSelected(null); setEditMode(false); setSigning(false) }}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Werkbonnen', 'Work orders')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Dagelijkse werkregistratie en klanthandtekening', 'Daily work records and client signatures')}</p>
        </div>
        <button className={styles.addBtn} onClick={openNew}><Plus size={15}/>{lbl('Nieuwe werkbon', 'New work order')}</button>
      </div>

      <div className={styles.statsRow}>
        {[
          { label: lbl('Totaal', 'Total'),       value: stats.total,       color: '#1A3E6F' },
          { label: lbl('Concept', 'Draft'),       value: stats.concept,     color: '#757575' },
          { label: lbl('Verzonden', 'Sent'),      value: stats.verzonden,   color: '#1565C0' },
          { label: lbl('Ondertekend', 'Signed'),  value: stats.ondertekend, color: '#2E7D32' },
        ].map(s => (
          <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.color }}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon}/>
          <input
            className={styles.searchInput}
            placeholder={lbl('Zoeken op nummer, klant, project…', 'Search by number, client, project…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.listWrap}>
        {filtered.length === 0 && <div className={styles.empty}>{lbl('Geen werkbonnen gevonden', 'No work orders found')}</div>}
        {filtered.map(wb => {
          const st = STATUS_STYLE[wb.status] || STATUS_STYLE.concept
          const totalHours = (wb.workers || []).reduce((s, w) => s + (+w.hours || 0), 0)
          return (
            <div key={wb.id} className={styles.row} onClick={() => { setSelected(wb); setView('detail'); setEditMode(false) }}>
              <div className={styles.rowLeft}>
                <div className={styles.rowIcon}><FileText size={16}/></div>
                <div>
                  <div className={styles.rowNum}>{wb.number}</div>
                  <div className={styles.rowClient}>{wb.client_name}</div>
                </div>
              </div>
              <div className={styles.rowMid}>
                <span className={styles.rowProject}>{wb.project_name}</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.rowDate}>{fmtDate(wb.date)}</span>
                <span className={styles.rowHours}><Clock size={11}/>{totalHours.toFixed(1)} u</span>
                <span className={styles.rowWorkers}><User size={11}/>{(wb.workers || []).length}</span>
                <span className={styles.badge} style={{ background: st.bg, color: st.color }}>
                  {lang === 'nl' ? st.nl : st.en}
                  {wb.status === 'ondertekend' && <CheckCircle size={11} style={{ marginLeft: 3 }}/>}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Werkbon Detail / Edit View ─────────────────────────────────────────────────
function WerkbonDetail({ werkbon, editMode, lang, projects, workers: allWorkers, saving, signing, signedBy, onSignedByChange, onStartSign, onCancelSign, onSign, onEdit, onSave, onCancelEdit, onBack, onDelete }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState({ ...werkbon })

  // Sync when werkbon prop changes (e.g. after save)
  useEffect(() => { setData({ ...werkbon }) }, [werkbon])

  function set(k, v) { setData(d => ({ ...d, [k]: v })) }

  function addWorker() {
    set('workers', [...(data.workers || []), { worker_id: '', name: '', start_time: '07:30', end_time: '16:30', break_minutes: 30, hours: 8 }])
  }
  function setWorker(i, k, v) {
    const ws = [...(data.workers || [])]; ws[i] = { ...ws[i], [k]: v }; set('workers', ws)
  }
  function remWorker(i) { set('workers', (data.workers || []).filter((_, j) => j !== i)) }

  function addWork() { set('works', [...(data.works || []), { description: '', qty: 1, unit: 'stuk', done: false }]) }
  function setWork(i, k, v) { const ws = [...(data.works || [])]; ws[i] = { ...ws[i], [k]: v }; set('works', ws) }
  function remWork(i) { set('works', (data.works || []).filter((_, j) => j !== i)) }

  function addMat() { set('materials', [...(data.materials || []), { name: '', qty: 1, unit: 'stuk' }]) }
  function setMat(i, k, v) { const ms = [...(data.materials || [])]; ms[i] = { ...ms[i], [k]: v }; set('materials', ms) }
  function remMat(i) { set('materials', (data.materials || []).filter((_, j) => j !== i)) }

  const totalHours = (data.workers || []).reduce((s, w) => s + (+w.hours || 0), 0)
  const st = STATUS_STYLE[data.status] || STATUS_STYLE.concept

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <button className={styles.backBtn} onClick={onBack}>← {lbl('Terug', 'Back')}</button>
          <div>
            <h1 className={styles.detailTitle}>{data.number || lbl('Nieuwe werkbon', 'New work order')}</h1>
            <span className={styles.badge} style={{ background: st.bg, color: st.color }}>{lang === 'nl' ? st.nl : st.en}</span>
          </div>
        </div>
        <div className={styles.detailHeaderRight}>
          {!editMode && data.status !== 'ondertekend' && (
            <button className={styles.signBtn} onClick={onStartSign}><PenLine size={14}/>{lbl('Laten ondertekenen', 'Get signature')}</button>
          )}
          {!editMode && <button className={styles.editBtn} onClick={onEdit}><Pencil size={14}/>{lbl('Bewerken', 'Edit')}</button>}
          {editMode && (
            <button className={styles.saveBtn2} onClick={() => onSave(data)} disabled={saving}>
              <ChevronRight size={14}/>{saving ? '…' : lbl('Opslaan', 'Save')}
            </button>
          )}
          {editMode && <button className={styles.cancelBtn} onClick={onCancelEdit}>{lbl('Annuleren', 'Cancel')}</button>}
          <button className={styles.printBtn}><Printer size={14}/></button>
          {data.id && <button className={`${styles.actionBtn2} ${styles.actionBtnRed}`} onClick={() => onDelete(data.id)}><Trash2 size={14}/></button>}
        </div>
      </div>

      <div className={styles.detailBody}>
        {/* Project & date */}
        <WbSection title={lbl('Projectgegevens', 'Project details')}>
          <div className={styles.twoCol}>
            <WbField label={lbl('Project', 'Project')}>
              {editMode
                ? <select className={styles.inp} value={data.project_id || ''} onChange={e => {
                    const p = projects.find(p => String(p.id) === e.target.value)
                    setData(d => ({ ...d, project_id: +e.target.value || null, project_name: p?.name || '', client_name: p?.client_name || '', client_address: p?.address || '' }))
                  }}>
                    <option value="">— {lbl('Selecteer', 'Select')} —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                : <span className={styles.val}>{data.project_name || '—'}</span>
              }
            </WbField>
            <WbField label={lbl('Datum', 'Date')}>
              {editMode
                ? <input type="date" className={styles.inp} value={data.date || ''} onChange={e => set('date', e.target.value)}/>
                : <span className={styles.val}>{fmtDate(data.date)}</span>
              }
            </WbField>
            <WbField label={lbl('Klant', 'Client')}>
              {editMode
                ? <input className={styles.inp} value={data.client_name || ''} onChange={e => set('client_name', e.target.value)}/>
                : <span className={styles.val}>{data.client_name || '—'}</span>
              }
            </WbField>
            <WbField label={lbl('Adres uitvoering', 'Site address')}>
              {editMode
                ? <input className={styles.inp} value={data.client_address || ''} onChange={e => set('client_address', e.target.value)}/>
                : <span className={styles.val}>{data.client_address || '—'}</span>
              }
            </WbField>
          </div>
        </WbSection>

        {/* Workers */}
        <WbSection
          title={lbl('Medewerkers & Uren', 'Workers & Hours')}
          action={editMode && <button className={styles.addRowBtn} onClick={addWorker}><Plus size={12}/>{lbl('Toevoegen', 'Add')}</button>}
        >
          <table className={styles.wbTable}>
            <thead><tr>
              <th>{lbl('Naam', 'Name')}</th><th>{lbl('Start', 'Start')}</th>
              <th>{lbl('Einde', 'End')}</th><th>{lbl('Pauze', 'Break')}</th>
              <th>{lbl('Uren', 'Hours')}</th>{editMode && <th/>}
            </tr></thead>
            <tbody>
              {(data.workers || []).length === 0 && (
                <tr><td colSpan={6} className={styles.emptyCell}>{lbl('Geen medewerkers', 'No workers')}</td></tr>
              )}
              {(data.workers || []).map((w, i) => (
                <tr key={i}>
                  <td>
                    {editMode
                      ? <select className={styles.inpSm} value={w.worker_id || ''} onChange={e => {
                          const wk = allWorkers.find(wk => String(wk.id) === e.target.value)
                          setWorker(i, 'worker_id', +e.target.value || null)
                          if (wk) setWorker(i, 'name', wk.name)
                        }}>
                          <option value="">—</option>
                          {allWorkers.map(wk => <option key={wk.id} value={wk.id}>{wk.name}</option>)}
                        </select>
                      : w.name
                    }
                  </td>
                  <td>{editMode ? <input type="time" className={styles.inpSm} value={w.start_time || '07:30'} onChange={e => setWorker(i, 'start_time', e.target.value)}/> : w.start_time}</td>
                  <td>{editMode ? <input type="time" className={styles.inpSm} value={w.end_time || '16:30'} onChange={e => setWorker(i, 'end_time', e.target.value)}/> : w.end_time}</td>
                  <td>{editMode ? <input type="number" min="0" className={styles.inpNum} value={w.break_minutes || 30} onChange={e => setWorker(i, 'break_minutes', +e.target.value)}/> : <span>{w.break_minutes}m</span>}</td>
                  <td><strong>{(+w.hours || 0).toFixed(1)} u</strong></td>
                  {editMode && <td><button className={styles.remBtn} onClick={() => remWorker(i)}><X size={12}/></button></td>}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className={styles.tfootLabel}>{lbl('Totaal uren', 'Total hours')}</td>
                <td><strong>{totalHours.toFixed(1)} u</strong></td>
                {editMode && <td/>}
              </tr>
            </tfoot>
          </table>
        </WbSection>

        {/* Works */}
        <WbSection
          title={lbl('Uitgevoerde werkzaamheden', 'Work performed')}
          action={editMode && <button className={styles.addRowBtn} onClick={addWork}><Plus size={12}/>{lbl('Toevoegen', 'Add')}</button>}
        >
          <table className={styles.wbTable}>
            <thead><tr>
              <th>{lbl('Omschrijving', 'Description')}</th><th>Qty</th><th>{lbl('Eenheid', 'Unit')}</th><th>✓</th>{editMode && <th/>}
            </tr></thead>
            <tbody>
              {(data.works || []).length === 0 && (
                <tr><td colSpan={5} className={styles.emptyCell}>{lbl('Geen werkzaamheden', 'No work items')}</td></tr>
              )}
              {(data.works || []).map((w, i) => (
                <tr key={i}>
                  <td>{editMode ? <input className={`${styles.inpSm} ${styles.inpFull}`} value={w.description || ''} onChange={e => setWork(i, 'description', e.target.value)} placeholder={lbl('Omschrijving…', 'Description…')}/> : w.description}</td>
                  <td>{editMode ? <input type="number" min="0" className={styles.inpNum} value={w.qty || 1} onChange={e => setWork(i, 'qty', +e.target.value)}/> : w.qty}</td>
                  <td>{editMode
                    ? <select className={styles.inpSm} value={w.unit || 'stuk'} onChange={e => setWork(i, 'unit', e.target.value)}>
                        {['stuk','dag','uur','meter','m²','m³'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    : w.unit}
                  </td>
                  <td><input type="checkbox" checked={!!w.done} onChange={e => setWork(i, 'done', e.target.checked)} className={styles.check}/></td>
                  {editMode && <td><button className={styles.remBtn} onClick={() => remWork(i)}><X size={12}/></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </WbSection>

        {/* Materials */}
        <WbSection
          title={lbl('Gebruikte materialen', 'Materials used')}
          action={editMode && <button className={styles.addRowBtn} onClick={addMat}><Plus size={12}/>{lbl('Toevoegen', 'Add')}</button>}
        >
          <table className={styles.wbTable}>
            <thead><tr>
              <th>{lbl('Materiaal', 'Material')}</th><th>Qty</th><th>{lbl('Eenheid', 'Unit')}</th>{editMode && <th/>}
            </tr></thead>
            <tbody>
              {(data.materials || []).length === 0 && (
                <tr><td colSpan={4} className={styles.emptyCell}>{lbl('Geen materialen', 'No materials')}</td></tr>
              )}
              {(data.materials || []).map((m, i) => (
                <tr key={i}>
                  <td>{editMode ? <input className={`${styles.inpSm} ${styles.inpFull}`} value={m.name || ''} onChange={e => setMat(i, 'name', e.target.value)} placeholder="…"/> : m.name}</td>
                  <td>{editMode ? <input type="number" min="0" className={styles.inpNum} value={m.qty || 1} onChange={e => setMat(i, 'qty', +e.target.value)}/> : m.qty}</td>
                  <td>{editMode
                    ? <select className={styles.inpSm} value={m.unit || 'stuk'} onChange={e => setMat(i, 'unit', e.target.value)}>
                        {['stuk','meter','m²','kg','liter','zak','rol','doos'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    : m.unit}
                  </td>
                  {editMode && <td><button className={styles.remBtn} onClick={() => remMat(i)}><X size={12}/></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </WbSection>

        {/* Notes */}
        <WbSection title={lbl('Notities & Bevindingen', 'Notes & Findings')}>
          <div className={styles.notesGrid}>
            {[
              ['notes',      lbl('Algemene notities', 'General notes')],
              ['problems',   lbl('Problemen / bijzonderheden', 'Issues / remarks')],
              ['next_steps', lbl('Vervolgacties', 'Next steps')],
            ].map(([k, l]) => (
              <div key={k}>
                <label className={styles.noteLbl}>{l}</label>
                {editMode
                  ? <textarea className={styles.textarea} rows={3} value={data[k] || ''} onChange={e => set(k, e.target.value)} placeholder="…"/>
                  : <p className={styles.noteText}>{data[k] || <em style={{ color: 'var(--grey-300)' }}>—</em>}</p>
                }
              </div>
            ))}
          </div>
        </WbSection>

        {/* Signature */}
        <WbSection title={lbl('Handtekening opdrachtgever', 'Client signature')}>
          {data.status === 'ondertekend' ? (
            <div className={styles.signedBox}>
              <CheckCircle size={22} style={{ color: '#2E7D32' }}/>
              <div>
                <p className={styles.signedName}>{lbl('Ondertekend door', 'Signed by')}: <strong>{data.client_signed_by}</strong></p>
                <p className={styles.signedDate}>{data.signed_at ? new Date(data.signed_at).toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB') : ''}</p>
              </div>
            </div>
          ) : signing ? (
            <div className={styles.signingBox}>
              <div className={styles.signCanvas}>{lbl('Handtekening veld', 'Signature field')}</div>
              <div className={styles.signingFields}>
                <label>{lbl('Naam ondertekenaar', 'Signer name')}</label>
                <input className={styles.inp} value={signedBy} onChange={e => onSignedByChange(e.target.value)} placeholder={lbl('Volledige naam…', 'Full name…')}/>
              </div>
              <div className={styles.signingActions}>
                <button className={styles.cancelBtn} onClick={onCancelSign}>{lbl('Annuleren', 'Cancel')}</button>
                <button className={styles.saveBtn2} onClick={onSign}><PenLine size={14}/>{lbl('Bevestig handtekening', 'Confirm signature')}</button>
              </div>
            </div>
          ) : (
            <div className={styles.noSig}>
              <PenLine size={20} style={{ color: 'var(--grey-300)' }}/>
              <p>{lbl('Nog niet ondertekend', 'Not yet signed')}</p>
              {!editMode && <button className={styles.signBtn} onClick={onStartSign}>{lbl('Nu ondertekenen', 'Sign now')}</button>}
            </div>
          )}
        </WbSection>
      </div>
    </div>
  )
}

function WbSection({ title, children, action }) {
  return (
    <div className={styles.wbSection}>
      <div className={styles.wbSectionHeader}>
        <h3 className={styles.wbSectionTitle}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function WbField({ label, children }) {
  return (
    <div className={styles.wbField}>
      <label className={styles.wbFieldLbl}>{label}</label>
      {children}
    </div>
  )
}