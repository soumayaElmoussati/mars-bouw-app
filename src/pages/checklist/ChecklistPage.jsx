import { useState, useMemo, useEffect } from 'react'
import { Plus, CheckCircle, Circle, AlertTriangle, ChevronDown, ChevronRight as ChevRight, X } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { checklistTemplates } from '../../data/checklistSeed'
import { api } from '../../api/client'
import styles from './ChecklistPage.module.css'

export default function ChecklistPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [instances,      setInstances]      = useState([])
  const [projects,       setProjects]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [view,           setView]           = useState('list')  // 'list' | 'detail'
  const [selected,       setSelected]       = useState(null)
  const [newModal,       setNewModal]       = useState(false)
  const [expandedPhases, setExpandedPhases] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [inst, proj] = await Promise.all([
        api.get('/checklist'),
        api.get('/projects'),
      ])
      setInstances(inst); setProjects(proj)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const stats = useMemo(() => ({
    total:    instances.length,
    bezig:    instances.filter(i => i.status === 'bezig').length,
    afgerond: instances.filter(i => i.status === 'afgerond').length,
  }), [instances])

  async function toggleCheck(instanceId, itemId, currentChecked) {
    try {
      const res = await api.post(`/checklist/${instanceId}/check/${itemId}`, { checked: !currentChecked })
      // Optimistic update
      setInstances(ins => ins.map(inst => {
        if (inst.id !== instanceId) return inst
        const checks = { ...(inst.checks || {}), [itemId]: !currentChecked }
        return { ...inst, checks, status: res.status || inst.status }
      }))
      // Also update selected if open
      if (selected && selected.id === instanceId) {
        setSelected(s => ({
          ...s,
          checks: { ...(s.checks || {}), [itemId]: !currentChecked },
          status: res.status || s.status,
        }))
      }
    } catch (e) { console.error(e) }
  }

  async function createInstance(templateId, projectId, projectName, clientName) {
    const tpl = checklistTemplates.find(t => t.id === templateId)
    if (!tpl) return
    const itemIds = tpl.phases.flatMap(p => p.items.map(i => i.id))
    try {
      const created = await api.post('/checklist', {
        templateId, templateType: tpl.type,
        projectId: +projectId || null, projectName, clientName,
        itemIds,
      })
      setInstances(ins => [created, ...ins])
      setNewModal(false)
    } catch (e) { alert(e.message) }
  }

  async function deleteInstance(id) {
    if (!confirm(lbl('Checklist verwijderen?', 'Delete checklist?'))) return
    try {
      await api.delete(`/checklist/${id}`)
      setInstances(ins => ins.filter(i => i.id !== id))
      if (selected?.id === id) { setView('list'); setSelected(null) }
    } catch (e) { alert(e.message) }
  }

  function getProgress(inst) {
    const tpl = checklistTemplates.find(t => t.id === inst.template_id)
    if (!tpl) return { done: 0, total: 0, pct: 0, criticalMissed: 0 }
    const allItems = tpl.phases.flatMap(p => p.items)
    const done     = allItems.filter(i => inst.checks?.[i.id]).length
    const criticalMissed = allItems.filter(i => i.critical && !inst.checks?.[i.id]).length
    return { done, total: allItems.length, pct: allItems.length ? done / allItems.length * 100 : 0, criticalMissed }
  }

  if (loading) return <ChecklistListSkeleton lang={lang} lbl={lbl} />

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const inst = instances.find(i => i.id === selected.id) || selected
    const tpl  = checklistTemplates.find(t => t.id === inst.template_id)
    const prog = getProgress(inst)

    return (
      <div className={styles.page}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => setView('list')}>← {lbl('Terug', 'Back')}</button>
          <div className={styles.detailInfo}>
            <span className={styles.detailIcon}>{tpl?.icon}</span>
            <div>
              <h1 className={styles.detailTitle}>{lang === 'nl' ? tpl?.name_nl : tpl?.name_en}</h1>
              <p className={styles.detailSub}>{inst.project_name} · {inst.client_name}</p>
            </div>
          </div>
          <div className={styles.detailProgress}>
            <div className={styles.progNumbers}>
              <span className={styles.progDone}>{prog.done}</span>
              <span className={styles.progSep}>/</span>
              <span className={styles.progTotal}>{prog.total}</span>
              {prog.criticalMissed > 0 && (
                <span className={styles.criticalWarn}><AlertTriangle size={12}/>{prog.criticalMissed} kritiek</span>
              )}
            </div>
            <div className={styles.progBar}>
              <div className={styles.progFill} style={{
                width: prog.pct + '%',
                background: prog.pct === 100 ? '#43A047' : prog.criticalMissed > 0 ? '#C8102E' : '#1A3E6F',
              }}/>
            </div>
            <span className={styles.progPct}>{prog.pct.toFixed(0)}%</span>
          </div>
        </div>

        <div className={styles.phasesWrap}>
          {tpl?.phases.map(phase => {
            const phaseDone = phase.items.filter(i => inst.checks?.[i.id]).length
            const isExpanded = expandedPhases[phase.id] !== false

            return (
              <div key={phase.id} className={styles.phaseCard}>
                <div className={styles.phaseHeader} onClick={() => setExpandedPhases(ep => ({ ...ep, [phase.id]: !isExpanded }))}>
                  <div className={styles.phaseLeft}>
                    <div className={styles.phaseDot} style={{ background: tpl.color }}/>
                    <span className={styles.phaseName}>{lang === 'nl' ? phase.name_nl : phase.name_en}</span>
                  </div>
                  <div className={styles.phaseRight}>
                    <span className={styles.phaseProgress} style={{ color: phaseDone === phase.items.length ? '#2E7D32' : 'var(--grey-500)' }}>
                      {phaseDone}/{phase.items.length}
                    </span>
                    <div className={styles.phaseMiniBar}>
                      <div style={{ width: (phaseDone / phase.items.length * 100) + '%', height: '100%', background: tpl.color, borderRadius: 10 }}/>
                    </div>
                    {isExpanded ? <ChevronDown size={16}/> : <ChevRight size={16}/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.itemsList}>
                    {phase.items.map(item => {
                      const checked = !!(inst.checks?.[item.id])
                      return (
                        <div key={item.id} className={`${styles.item} ${checked ? styles.itemDone : ''} ${item.critical && !checked ? styles.itemCritical : ''}`}>
                          <button className={styles.checkBtn} onClick={() => toggleCheck(inst.id, item.id, checked)}>
                            {checked
                              ? <CheckCircle size={20} style={{ color: '#43A047' }}/>
                              : <Circle size={20} style={{ color: item.critical ? '#C8102E' : 'var(--grey-300)' }}/>
                            }
                          </button>
                          <div className={styles.itemContent}>
                            <span className={`${styles.itemText} ${checked ? styles.itemTextDone : ''}`}>
                              {lang === 'nl' ? item.text_nl : item.text_en}
                            </span>
                            {item.critical && !checked && (
                              <span className={styles.criticalBadge}><AlertTriangle size={10}/>Kritiek</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '0 0 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => deleteInstance(inst.id)}
            style={{ padding: '8px 16px', background: '#FFEBEE', color: '#C8102E', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            🗑 {lbl('Verwijderen', 'Delete')}
          </button>
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Kwaliteitschecklists', 'Quality checklists')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Prédéfinie checklists per type werkzaamheid', 'Predefined checklists per work type')}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setNewModal(true)}><Plus size={15}/>{lbl('Nieuwe checklist', 'New checklist')}</button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{stats.total}</span>
          <span className={styles.statLbl}>{lbl('Totaal', 'Total')}</span>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#E65100' }}>
          <span className={styles.statVal} style={{ color: '#E65100' }}>{stats.bezig}</span>
          <span className={styles.statLbl}>{lbl('Bezig', 'In progress')}</span>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#2E7D32' }}>
          <span className={styles.statVal} style={{ color: '#2E7D32' }}>{stats.afgerond}</span>
          <span className={styles.statLbl}>{lbl('Afgerond', 'Completed')}</span>
        </div>
      </div>

      {/* Templates */}
      <div className={styles.templatesRow}>
        {checklistTemplates.map(tpl => (
          <div key={tpl.id} className={styles.tplCard} style={{ borderTopColor: tpl.color }}>
            <span className={styles.tplIcon}>{tpl.icon}</span>
            <span className={styles.tplName}>{lang === 'nl' ? tpl.name_nl : tpl.name_en}</span>
            <span className={styles.tplItems}>{tpl.phases.reduce((s, p) => s + p.items.length, 0)} {lbl('items', 'items')}</span>
            <button className={styles.tplBtn} style={{ background: tpl.color }} onClick={() => setNewModal(tpl.id)}>
              {lbl('Starten', 'Start')}
            </button>
          </div>
        ))}
      </div>

      {/* Instances */}
      <h2 className={styles.sectionTitle}>{lbl('Actieve & afgeronde checklists', 'Active & completed checklists')}</h2>
      <div className={styles.instancesList}>
        {instances.length === 0 && <div className={styles.empty}>{lbl('Geen checklists', 'No checklists')}</div>}
        {instances.map(inst => {
          const tpl  = checklistTemplates.find(t => t.id === inst.template_id)
          const prog = getProgress(inst)
          return (
            <div key={inst.id} className={styles.instRow} onClick={() => { setSelected(inst); setView('detail') }}>
              <span className={styles.instIcon}>{tpl?.icon}</span>
              <div className={styles.instInfo}>
                <span className={styles.instName}>{lang === 'nl' ? tpl?.name_nl : tpl?.name_en}</span>
                <span className={styles.instProject}>{inst.project_name}</span>
              </div>
              <div className={styles.instProg}>
                <div className={styles.instBar}>
                  <div className={styles.instFill} style={{
                    width: prog.pct + '%',
                    background: prog.pct === 100 ? '#43A047' : tpl?.color || 'var(--blue)',
                  }}/>
                </div>
                <span className={styles.instPct}>{prog.done}/{prog.total}</span>
              </div>
              {prog.criticalMissed > 0 && (
                <span className={styles.critWarn}><AlertTriangle size={12}/>{prog.criticalMissed}</span>
              )}
              <span className={styles.instStatus} style={{
                background: inst.status === 'afgerond' ? '#E8F5E9' : '#FFF3E0',
                color:      inst.status === 'afgerond' ? '#2E7D32' : '#E65100',
              }}>{inst.status}</span>
              <span className={styles.instDate}>{inst.started_at}</span>
            </div>
          )
        })}
      </div>

      {/* New checklist modal */}
      {newModal && (
        <NewChecklistModal
          templateId={typeof newModal === 'number' ? newModal : null}
          projects={projects}
          lang={lang}
          onSave={createInstance}
          onClose={() => setNewModal(false)}
        />
      )}
    </div>
  )
}

// ── New Checklist Modal ────────────────────────────────────────────────────────
function NewChecklistModal({ templateId, projects, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [tplId,    setTplId]    = useState(templateId || 1)
  const [projId,   setProjId]   = useState('')
  const [projName, setProjName] = useState('')
  const [client,   setClient]   = useState('')

  function handleProject(id) {
    const p = projects.find(p => String(p.id) === id)
    setProjId(id); setProjName(p ? p.name : ''); setClient(p ? p.client_name || '' : '')
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{lbl('Nieuwe checklist starten', 'Start new checklist')}</h3>
          <button onClick={onClose} className={styles.closeBtn}><X size={16}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.mField}>
            <label>{lbl('Type checklist', 'Checklist type')}</label>
            <div className={styles.tplGrid}>
              {checklistTemplates.map(t => (
                <label key={t.id}
                  className={`${styles.tplOpt} ${tplId === t.id ? styles.tplOptActive : ''}`}
                  style={tplId === t.id ? { borderColor: t.color, background: t.color + '12' } : {}}>
                  <input type="radio" name="tpl" value={t.id} checked={tplId === t.id} onChange={() => setTplId(t.id)} className={styles.rHidden}/>
                  <span>{t.icon}</span>
                  <span className={styles.tplOptName}>{lang === 'nl' ? t.name_nl : t.name_en}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.mField}>
            <label>{lbl('Project', 'Project')}</label>
            <select className={styles.mInp} value={projId} onChange={e => handleProject(e.target.value)}>
              <option value="">— {lbl('Selecteer project', 'Select project')} —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className={styles.mField}>
            <label>{lbl('Klant', 'Client')}</label>
            <input className={styles.mInp} value={client} onChange={e => setClient(e.target.value)} placeholder={lbl('Klantnaam…', 'Client name…')}/>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn2} onClick={onClose}>{lbl('Annuleren', 'Cancel')}</button>
          <button className={styles.saveBtn3} onClick={() => onSave(tplId, projId, projName, client)}>
            {lbl('Checklist starten', 'Start checklist')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── SKELETON ───────────────────────── */

function Shimmer({ w = '100%', h = 14, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      ...style
    }} />
  )
}

function SkeletonInstanceRow({ index }) {
  const widths = ['60%', '75%', '55%', '70%']
  return (
    <div className={styles.instRow} style={{ pointerEvents: 'none' }}>
      <Shimmer w={32} h={32} r={16} />
      <div className={styles.instInfo} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer w={widths[index % widths.length]} h={13} />
        <Shimmer w="45%" h={11} />
      </div>
      <div className={styles.instProg} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shimmer w={110} h={8} r={4} />
        <Shimmer w={45} h={12} />
      </div>
      <Shimmer w={65} h={20} r={10} />
      <Shimmer w={80} h={12} />
    </div>
  )
}

function ChecklistListSkeleton({ lang, lbl }) {
  // Nombre de cartes template fantômes = nombre réel de templates
  const tplCount = checklistTemplates?.length || 4

  return (
    <div className={styles.page}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Kwaliteitschecklists', 'Quality checklists')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Prédéfinie checklists per type werkzaamheid', 'Predefined checklists per work type')}</p>
        </div>
        <Shimmer w={170} h={38} r={8} />
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} style={{ borderLeftColor: '#e0e0e0' }}>
          <Shimmer w={40} h={22} style={{ marginBottom: 6 }} />
          <Shimmer w={70} h={11} />
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#E65100' }}>
          <Shimmer w={40} h={22} style={{ marginBottom: 6 }} />
          <Shimmer w={70} h={11} />
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#2E7D32' }}>
          <Shimmer w={40} h={22} style={{ marginBottom: 6 }} />
          <Shimmer w={70} h={11} />
        </div>
      </div>

      {/* Templates */}
      <div className={styles.templatesRow}>
        {Array.from({ length: tplCount }).map((_, i) => (
          <div key={i} className={styles.tplCard} style={{ borderTopColor: '#e0e0e0', pointerEvents: 'none' }}>
            <Shimmer w={32} h={32} r={8} />
            <Shimmer w={`${60 + (i % 3) * 10}%`} h={13} style={{ marginTop: 8, marginBottom: 6 }} />
            <Shimmer w={70} h={11} style={{ marginBottom: 12 }} />
            <Shimmer w={90} h={30} r={8} />
          </div>
        ))}
      </div>

      {/* Instances */}
      <div style={{ marginTop: 24, marginBottom: 12 }}>
        <Shimmer w={250} h={16} />
      </div>
      <div className={styles.instancesList}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonInstanceRow key={i} index={i} />
        ))}
      </div>
    </div>
  )
}