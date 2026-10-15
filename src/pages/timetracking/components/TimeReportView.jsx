import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import styles from './TimeReportView.module.css'

function fmtEur(n) { return '€ '+Number(n||0).toLocaleString('nl-NL',{minimumFractionDigits:2}) }

export default function TimeReportView({ entries, workers, lang }) {
  const lbl = (nl,en) => lang==='nl'?nl:en
  const [groupBy, setGroupBy] = useState('worker') // 'worker' | 'project' | 'week'

  // ── By worker ─────────────────────────────────────────────────────────────
  const byWorker = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      if (!map[e.workerId]) {
        const w = workers.find(w=>w.id===e.workerId)
        map[e.workerId] = { id:e.workerId, name:e.workerName||'?', role:e.workerRole||'', color:w?.color||'var(--blue)', hours:0, cost:0, overtimeHours:0, entries:0, projects:new Set() }
      }
      map[e.workerId].hours       += e.hours
      map[e.workerId].cost        += e.cost
      map[e.workerId].entries     += 1
      map[e.workerId].projects.add(e.projectId)
      if (e.workType==='overwerk') map[e.workerId].overtimeHours += e.hours
    })
    return Object.values(map).sort((a,b)=>b.hours-a.hours)
  }, [entries, workers])

  // ── By project ────────────────────────────────────────────────────────────
  const byProject = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      const key = e.projectId || 0
      if (!map[key]) map[key] = { id:key, name:e.projectName||lbl('Geen project','No project'), hours:0, cost:0, workers:new Set(), entries:0 }
      map[key].hours   += e.hours
      map[key].cost    += e.cost
      map[key].entries += 1
      map[key].workers.add(e.workerId)
    })
    return Object.values(map).sort((a,b)=>b.cost-a.cost)
  }, [entries])

  // ── By week ───────────────────────────────────────────────────────────────
  const byWeek = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      const d   = new Date(e.date)
      const mon = new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7))
      const key = mon.toISOString().slice(0,10)
      if (!map[key]) map[key] = { week:key, hours:0, cost:0, entries:0 }
      map[key].hours   += e.hours
      map[key].cost    += e.cost
      map[key].entries += 1
    })
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([,v])=>v)
  }, [entries])

  const totalHours = entries.reduce((s,e)=>s+e.hours,0)
  const totalCost  = entries.reduce((s,e)=>s+e.cost, 0)
  const maxHours   = Math.max(...byWorker.map(w=>w.hours), 1)

  function fmtWeek(d) {
    const mon = new Date(d)
    const sun = new Date(d); sun.setDate(mon.getDate()+6)
    return `${mon.getDate()}-${mon.getMonth()+1} t/m ${sun.getDate()}-${sun.getMonth()+1}`
  }

  return (
    <div className={styles.wrap}>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard} style={{borderLeftColor:'var(--blue)'}}>
          <span className={styles.summaryVal}>{totalHours.toFixed(1)} u</span>
          <span className={styles.summaryLbl}>{lbl('Totaal uren','Total hours')}</span>
        </div>
        <div className={styles.summaryCard} style={{borderLeftColor:'#E65100'}}>
          <span className={styles.summaryVal}>{fmtEur(totalCost)}</span>
          <span className={styles.summaryLbl}>{lbl('Totale loonkost','Total labor cost')}</span>
        </div>
        <div className={styles.summaryCard} style={{borderLeftColor:'#2E7D32'}}>
          <span className={styles.summaryVal}>{workers.filter(w=>w.status==='actief').length}</span>
          <span className={styles.summaryLbl}>{lbl('Actieve medewerkers','Active workers')}</span>
        </div>
        <div className={styles.summaryCard} style={{borderLeftColor:'#7B1FA2'}}>
          <span className={styles.summaryVal}>{entries.filter(e=>e.workType==='overwerk').reduce((s,e)=>s+e.hours,0).toFixed(1)} u</span>
          <span className={styles.summaryLbl}>{lbl('Overwerk','Overtime')}</span>
        </div>
      </div>

      {/* Group by toggle */}
      <div className={styles.toolbar}>
        <div className={styles.groupToggle}>
          <span className={styles.groupLbl}>{lbl('Groeperen op:','Group by:')}</span>
          {[['worker', lbl('Medewerker','Worker')], ['project', lbl('Project','Project')], ['week', lbl('Week','Week')]].map(([k,l])=>(
            <button key={k} className={`${styles.groupBtn} ${groupBy===k?styles.groupBtnActive:''}`} onClick={()=>setGroupBy(k)}>{l}</button>
          ))}
        </div>
        <button className={styles.exportBtn}><Download size={13}/>{lbl('Exporteer','Export')}</button>
      </div>

      {/* Table: by worker */}
      {groupBy === 'worker' && (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>{lbl('Medewerker','Worker')}</span>
            <span>{lbl('Functie','Role')}</span>
            <span className={styles.tRight}>{lbl('Uren','Hours')}</span>
            <span className={styles.tRight}>{lbl('Overwerk','Overtime')}</span>
            <span className={styles.tRight}>{lbl('Loonkost','Cost')}</span>
            <span className={styles.tRight}>{lbl('Projecten','Projects')}</span>
            <span className={styles.tRight}>{lbl('Registraties','Entries')}</span>
            <span>{lbl('Verdeling','Distribution')}</span>
          </div>
          {byWorker.map(w => (
            <div key={w.id} className={styles.tableRow}>
              <div className={styles.workerCell}>
                <div className={styles.workerDot} style={{background:w.color}}/>
                <span className={styles.workerName}>{w.name}</span>
              </div>
              <span className={styles.roleCell}>{w.role}</span>
              <span className={`${styles.tRight} ${styles.bold}`}>{w.hours.toFixed(1)} u</span>
              <span className={`${styles.tRight} ${styles.overtime}`}>{w.overtimeHours.toFixed(1)} u</span>
              <span className={`${styles.tRight} ${styles.cost}`}>{fmtEur(w.cost)}</span>
              <span className={styles.tRight}>{w.projects.size}</span>
              <span className={styles.tRight}>{w.entries}</span>
              <div className={styles.barCell}>
                <div className={styles.barTrack}><div className={styles.barFill} style={{width:(w.hours/maxHours*100)+'%',background:w.color}}/></div>
                <span className={styles.barPct}>{totalHours>0?(w.hours/totalHours*100).toFixed(0):'0'}%</span>
              </div>
            </div>
          ))}
          <div className={styles.tableFooter}>
            <span className={styles.footerLabel}>{lbl('Totaal','Total')}</span>
            <span/>
            <span className={`${styles.tRight} ${styles.bold}`}>{totalHours.toFixed(1)} u</span>
            <span className={`${styles.tRight} ${styles.overtime}`}>{entries.filter(e=>e.workType==='overwerk').reduce((s,e)=>s+e.hours,0).toFixed(1)} u</span>
            <span className={`${styles.tRight} ${styles.cost}`}>{fmtEur(totalCost)}</span>
            <span/>
            <span className={styles.tRight}>{entries.length}</span>
            <span/>
          </div>
        </div>
      )}

      {/* Table: by project */}
      {groupBy === 'project' && (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span style={{gridColumn:'span 2'}}>{lbl('Project','Project')}</span>
            <span className={styles.tRight}>{lbl('Uren','Hours')}</span>
            <span className={styles.tRight}>{lbl('Loonkost','Cost')}</span>
            <span className={styles.tRight}>{lbl('Medewerkers','Workers')}</span>
            <span className={styles.tRight}>{lbl('Registraties','Entries')}</span>
            <span className={styles.tRight}>{lbl('Gem. kost/u','Avg cost/h')}</span>
            <span/>
          </div>
          {byProject.map(p => {
            const maxC = Math.max(...byProject.map(pp=>pp.cost),1)
            return (
              <div key={p.id} className={styles.tableRow}>
                <span style={{gridColumn:'span 2'}} className={styles.bold}>{p.name}</span>
                <span className={`${styles.tRight} ${styles.bold}`}>{p.hours.toFixed(1)} u</span>
                <span className={`${styles.tRight} ${styles.cost}`}>{fmtEur(p.cost)}</span>
                <span className={styles.tRight}>{p.workers.size}</span>
                <span className={styles.tRight}>{p.entries}</span>
                <span className={styles.tRight}>{p.hours>0?fmtEur(p.cost/p.hours):'—'}</span>
                <div className={styles.barCell}>
                  <div className={styles.barTrack}><div className={styles.barFill} style={{width:(p.cost/maxC*100)+'%',background:'var(--blue)'}}/></div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table: by week */}
      {groupBy === 'week' && (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span style={{gridColumn:'span 2'}}>{lbl('Week','Week')}</span>
            <span className={styles.tRight}>{lbl('Uren','Hours')}</span>
            <span className={styles.tRight}>{lbl('Loonkost','Cost')}</span>
            <span className={styles.tRight}>{lbl('Registraties','Entries')}</span>
            <span/>
            <span/>
            <span/>
          </div>
          {byWeek.map(w => {
            const maxH = Math.max(...byWeek.map(ww=>ww.hours),1)
            return (
              <div key={w.week} className={styles.tableRow}>
                <span style={{gridColumn:'span 2'}} className={styles.bold}>{fmtWeek(w.week)}</span>
                <span className={`${styles.tRight} ${styles.bold}`}>{w.hours.toFixed(1)} u</span>
                <span className={`${styles.tRight} ${styles.cost}`}>{fmtEur(w.cost)}</span>
                <span className={styles.tRight}>{w.entries}</span>
                <span/>
                <span/>
                <div className={styles.barCell}>
                  <div className={styles.barTrack}><div className={styles.barFill} style={{width:(w.hours/maxH*100)+'%',background:'#E65100'}}/></div>
                  <span className={styles.barPct}>{w.hours.toFixed(1)} u</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}