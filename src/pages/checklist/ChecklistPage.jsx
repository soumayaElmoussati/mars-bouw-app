import { useState, useMemo } from 'react'
import { Plus, CheckCircle, Circle, AlertTriangle, ChevronDown, ChevronRight as ChevRight, X } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { checklistTemplates, checklistInstancesSeed } from '../../data/checklistSeed'
import { projectsSeed } from '../../data/projectsSeed'
import styles from './ChecklistPage.module.css'

export default function ChecklistPage() {
  const { lang } = useLang()
  const lbl = (nl,en) => lang==='nl'?nl:en

  const [instances, setInstances] = useState(checklistInstancesSeed)
  const [view,      setView]      = useState('list')   // 'list' | 'detail' | 'new'
  const [selected,  setSelected]  = useState(null)
  const [newModal,  setNewModal]  = useState(false)
  const [expandedPhases, setExpandedPhases] = useState({})

  // stats
  const stats = useMemo(() => ({
    total:    instances.length,
    bezig:    instances.filter(i=>i.status==='bezig').length,
    afgerond: instances.filter(i=>i.status==='afgerond').length,
  }), [instances])

  function toggleCheck(instanceId, itemId) {
    setInstances(ins => ins.map(inst => {
      if (inst.id !== instanceId) return inst
      const checks = { ...inst.checks, [itemId]: !inst.checks[itemId] }
      // auto-complete if all done
      const tpl = checklistTemplates.find(t=>t.id===inst.templateId)
      const allIds = tpl?.phases.flatMap(p=>p.items.map(i=>i.id)) || []
      const allDone = allIds.every(id=>checks[id])
      return { ...inst, checks, status: allDone ? 'afgerond' : inst.status === 'afgerond' ? 'bezig' : inst.status }
    }))
  }

  function addNote(instanceId, itemId, note) {
    setInstances(ins=>ins.map(inst=>{
      if (inst.id!==instanceId) return inst
      return {...inst, notes:{...inst.notes,[itemId]:note}}
    }))
  }

  function createInstance(templateId, projectId, projectName, clientName) {
    const tpl = checklistTemplates.find(t=>t.id===templateId)
    if (!tpl) return
    const id = Math.max(0,...instances.map(i=>i.id))+1
    const checks = {}
    tpl.phases.forEach(p=>p.items.forEach(i=>{ checks[i.id]=false }))
    setInstances(ins=>[...ins,{
      id, templateId, templateType:tpl.type,
      projectId:+projectId||null, projectName, clientName,
      startedAt: new Date().toISOString().slice(0,10),
      completedAt:null, status:'bezig', checks, notes:{},
    }])
    setNewModal(false)
  }

  function getProgress(inst) {
    const tpl = checklistTemplates.find(t=>t.id===inst.templateId)
    if (!tpl) return {done:0,total:0,pct:0,criticalMissed:0}
    const allItems = tpl.phases.flatMap(p=>p.items)
    const total = allItems.length
    const done  = allItems.filter(i=>inst.checks[i.id]).length
    const criticalMissed = allItems.filter(i=>i.critical&&!inst.checks[i.id]).length
    return { done, total, pct: total>0?done/total*100:0, criticalMissed }
  }

  if (view==='detail' && selected) {
    const inst = instances.find(i=>i.id===selected.id) || selected
    const tpl  = checklistTemplates.find(t=>t.id===inst.templateId)
    const prog = getProgress(inst)

    return (
      <div className={styles.page}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={()=>setView('list')}>← {lbl('Terug','Back')}</button>
          <div className={styles.detailInfo}>
            <span className={styles.detailIcon}>{tpl?.icon}</span>
            <div>
              <h1 className={styles.detailTitle}>{lang==='nl'?tpl?.name_nl:tpl?.name_en}</h1>
              <p className={styles.detailSub}>{inst.projectName} · {inst.clientName}</p>
            </div>
          </div>
          <div className={styles.detailProgress}>
            <div className={styles.progNumbers}>
              <span className={styles.progDone}>{prog.done}</span>
              <span className={styles.progSep}>/</span>
              <span className={styles.progTotal}>{prog.total}</span>
              {prog.criticalMissed>0 && <span className={styles.criticalWarn}><AlertTriangle size={12}/>{prog.criticalMissed} kritiek</span>}
            </div>
            <div className={styles.progBar}>
              <div className={styles.progFill} style={{width:prog.pct+'%', background: prog.pct===100?'#43A047':prog.criticalMissed>0?'#C8102E':'#1A3E6F'}}/>
            </div>
            <span className={styles.progPct}>{prog.pct.toFixed(0)}%</span>
          </div>
        </div>

        <div className={styles.phasesWrap}>
          {tpl?.phases.map(phase => {
            const phaseItems = phase.items
            const phaseDone  = phaseItems.filter(i=>inst.checks[i.id]).length
            const isExpanded = expandedPhases[phase.id] !== false // default expanded
            const phaseColor = tpl.color

            return (
              <div key={phase.id} className={styles.phaseCard}>
                <div className={styles.phaseHeader} onClick={()=>setExpandedPhases(ep=>({...ep,[phase.id]:!isExpanded}))}>
                  <div className={styles.phaseLeft}>
                    <div className={styles.phaseDot} style={{background:phaseColor}}/>
                    <span className={styles.phaseName}>{lang==='nl'?phase.name_nl:phase.name_en}</span>
                  </div>
                  <div className={styles.phaseRight}>
                    <span className={styles.phaseProgress} style={{color: phaseDone===phaseItems.length?'#2E7D32':'var(--grey-500)'}}>
                      {phaseDone}/{phaseItems.length}
                    </span>
                    <div className={styles.phaseMiniBar}>
                      <div style={{width:(phaseDone/phaseItems.length*100)+'%',height:'100%',background:phaseColor,borderRadius:10}}/>
                    </div>
                    {isExpanded?<ChevronDown size={16}/>:<ChevRight size={16}/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.itemsList}>
                    {phaseItems.map(item => {
                      const checked = !!inst.checks[item.id]
                      const note    = inst.notes[item.id] || ''
                      return (
                        <div key={item.id} className={`${styles.item} ${checked?styles.itemDone:''} ${item.critical&&!checked?styles.itemCritical:''}`}>
                          <button className={styles.checkBtn} onClick={()=>toggleCheck(inst.id, item.id)}>
                            {checked
                              ? <CheckCircle size={20} style={{color:'#43A047'}}/>
                              : <Circle size={20} style={{color:item.critical?'#C8102E':'var(--grey-300)'}}/>
                            }
                          </button>
                          <div className={styles.itemContent}>
                            <span className={`${styles.itemText} ${checked?styles.itemTextDone:''}`}>
                              {lang==='nl'?item.text_nl:item.text_en}
                            </span>
                            {item.critical && !checked && <span className={styles.criticalBadge}><AlertTriangle size={10}/>Kritiek</span>}
                            <input
                              className={styles.noteInput}
                              value={note}
                              onChange={e=>addNote(inst.id,item.id,e.target.value)}
                              placeholder={lbl('Notitie…','Note…')}
                            />
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
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Kwaliteitschecklists','Quality checklists')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Prédéfinie checklists per type werkzaamheid','Predefined checklists per work type')}</p>
        </div>
        <button className={styles.addBtn} onClick={()=>setNewModal(true)}><Plus size={15}/>{lbl('Nieuwe checklist','New checklist')}</button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}><span className={styles.statVal}>{stats.total}</span><span className={styles.statLbl}>{lbl('Totaal','Total')}</span></div>
        <div className={styles.statCard} style={{borderLeftColor:'#E65100'}}><span className={styles.statVal} style={{color:'#E65100'}}>{stats.bezig}</span><span className={styles.statLbl}>{lbl('Bezig','In progress')}</span></div>
        <div className={styles.statCard} style={{borderLeftColor:'#2E7D32'}}><span className={styles.statVal} style={{color:'#2E7D32'}}>{stats.afgerond}</span><span className={styles.statLbl}>{lbl('Afgerond','Completed')}</span></div>
      </div>

      {/* Templates */}
      <div className={styles.templatesRow}>
        {checklistTemplates.map(tpl=>(
          <div key={tpl.id} className={styles.tplCard} style={{borderTopColor:tpl.color}}>
            <span className={styles.tplIcon}>{tpl.icon}</span>
            <span className={styles.tplName}>{lang==='nl'?tpl.name_nl:tpl.name_en}</span>
            <span className={styles.tplItems}>{tpl.phases.reduce((s,p)=>s+p.items.length,0)} {lbl('items','items')}</span>
            <button className={styles.tplBtn} style={{background:tpl.color}} onClick={()=>{setNewModal(tpl.id)}}>{lbl('Starten','Start')}</button>
          </div>
        ))}
      </div>

      {/* Instances */}
      <h2 className={styles.sectionTitle}>{lbl('Actieve & afgeronde checklists','Active & completed checklists')}</h2>
      <div className={styles.instancesList}>
        {instances.length===0 && <div className={styles.empty}>{lbl('Geen checklists','No checklists')}</div>}
        {instances.map(inst=>{
          const tpl  = checklistTemplates.find(t=>t.id===inst.templateId)
          const prog = getProgress(inst)
          return (
            <div key={inst.id} className={styles.instRow} onClick={()=>{setSelected(inst);setView('detail')}}>
              <span className={styles.instIcon}>{tpl?.icon}</span>
              <div className={styles.instInfo}>
                <span className={styles.instName}>{lang==='nl'?tpl?.name_nl:tpl?.name_en}</span>
                <span className={styles.instProject}>{inst.projectName}</span>
              </div>
              <div className={styles.instProg}>
                <div className={styles.instBar}>
                  <div className={styles.instFill} style={{width:prog.pct+'%',background:prog.pct===100?'#43A047':tpl?.color||'var(--blue)'}}/>
                </div>
                <span className={styles.instPct}>{prog.done}/{prog.total}</span>
              </div>
              {prog.criticalMissed>0&&<span className={styles.critWarn}><AlertTriangle size={12}/>{prog.criticalMissed}</span>}
              <span className={styles.instStatus} style={{
                background:inst.status==='afgerond'?'#E8F5E9':'#FFF3E0',
                color:inst.status==='afgerond'?'#2E7D32':'#E65100'
              }}>{inst.status}</span>
              <span className={styles.instDate}>{inst.startedAt}</span>
            </div>
          )
        })}
      </div>

      {/* New checklist modal */}
      {newModal && (
        <NewChecklistModal
          templateId={typeof newModal==='number'?newModal:null}
          lang={lang}
          onSave={createInstance}
          onClose={()=>setNewModal(false)}
        />
      )}
    </div>
  )
}

function NewChecklistModal({ templateId, lang, onSave, onClose }) {
  const lbl = (nl,en) => lang==='nl'?nl:en
  const [tplId,    setTplId]    = useState(templateId||1)
  const [projId,   setProjId]   = useState('')
  const [projName, setProjName] = useState('')
  const [client,   setClient]   = useState('')

  function handleProject(id) {
    const p = projectsSeed.find(p=>String(p.id)===id)
    setProjId(id); setProjName(p?p.name:''); setClient(p?p.clientName||'':'')
  }

  return (
    <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}><h3>{lbl('Nieuwe checklist starten','Start new checklist')}</h3><button onClick={onClose} className={styles.closeBtn}><X size={16}/></button></div>
        <div className={styles.modalBody}>
          <div className={styles.mField}>
            <label>{lbl('Type checklist','Checklist type')}</label>
            <div className={styles.tplGrid}>
              {checklistTemplates.map(t=>(
                <label key={t.id} className={`${styles.tplOpt} ${tplId===t.id?styles.tplOptActive:''}`} style={tplId===t.id?{borderColor:t.color,background:t.color+'12'}:{}}>
                  <input type="radio" name="tpl" value={t.id} checked={tplId===t.id} onChange={()=>setTplId(t.id)} className={styles.rHidden}/>
                  <span>{t.icon}</span>
                  <span className={styles.tplOptName}>{lang==='nl'?t.name_nl:t.name_en}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.mField}>
            <label>{lbl('Project','Project')}</label>
            <select className={styles.mInp} value={projId} onChange={e=>handleProject(e.target.value)}>
              <option value="">— {lbl('Selecteer project','Select project')} —</option>
              {projectsSeed.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className={styles.mField}>
            <label>{lbl('Klant','Client')}</label>
            <input className={styles.mInp} value={client} onChange={e=>setClient(e.target.value)} placeholder={lbl('Klantnaam…','Client name…')}/>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn2} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
          <button className={styles.saveBtn3} onClick={()=>onSave(tplId,projId,projName,client)}>{lbl('Checklist starten','Start checklist')}</button>
        </div>
      </div>
    </div>
  )
}