import { Pencil, Trash2, PlusCircle } from 'lucide-react'
import styles from './SubTable.module.css'

const STATUS_STYLE = {
  concept:       { bg:'#F5F5F5', color:'#757575' },
  goedgekeurd:   { bg:'#E8F5E9', color:'#2E7D32' },
  in_uitvoering: { bg:'#FFF3E0', color:'#E65100' },
  afgerond:      { bg:'#E3F2FD', color:'#1565C0' },
  geannuleerd:   { bg:'#FAFAFA', color:'#9E9E9E' },
}
const PAY_STYLE = {
  betaald:            { bg:'#E8F5E9', color:'#2E7D32' },
  gedeeltelijk:       { bg:'#E3F2FD', color:'#1565C0' },
  te_betalen:         { bg:'#FFEBEE', color:'#B71C1C' },
  niet_van_toepassing:{ bg:'#F5F5F5', color:'#757575' },
}

function fmtDate(d) {
  if (!d) return '—'
  const [y,m,day]=d.split('-'); return `${day}-${m}-${y}`
}

export default function SubOrders({ orders, subs, search, filterStatus, lang, onEdit, onDelete, onPayment }) {
  const lbl = (nl,en) => lang==='nl'?nl:en

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    if (q && !o.orderNumber.toLowerCase().includes(q) && !o.subcontractorName.toLowerCase().includes(q) && !o.projectName?.toLowerCase().includes(q)) return false
    if (filterStatus && o.status !== filterStatus) return false
    return true
  }).sort((a,b)=>b.sentDate.localeCompare(a.sentDate))

  if (filtered.length === 0) return <div className={styles.empty}>{lbl('Geen opdrachten gevonden','No orders found')}</div>

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr>
          <th>{lbl('Nr','No.')}</th>
          <th>{lbl('Onderaannemer','Subcontractor')}</th>
          <th>{lbl('Project','Project')}</th>
          <th>{lbl('Omschrijving','Description')}</th>
          <th>{lbl('Periode','Period')}</th>
          <th style={{textAlign:'right'}}>{lbl('Bedrag incl.','Incl. VAT')}</th>
          <th>{lbl('Betaald','Paid')}</th>
          <th>{lbl('Status','Status')}</th>
          <th>{lbl('Betaling','Payment')}</th>
          <th/>
        </tr></thead>
        <tbody>
          {filtered.map(o => {
            const totalIncl = o.amount * (1 + o.btw/100)
            const paid      = (o.payments||[]).reduce((s,p)=>s+p.amount,0)
            const pct       = totalIncl > 0 ? Math.min(100, paid/totalIncl*100) : 0
            const barColor  = pct>=100?'#43A047':pct>50?'#1565C0':'#E65100'
            const st  = STATUS_STYLE[o.status]  || STATUS_STYLE.concept
            const pst = PAY_STYLE[o.paymentStatus] || PAY_STYLE.te_betalen

            return (
              <tr key={o.id} className={styles.row}>
                <td><span className={styles.orderNum}>{o.orderNumber}</span></td>
                <td><div className={styles.name}>{o.subcontractorName}</div></td>
                <td><div className={styles.sub}>{o.projectName||'—'}</div></td>
                <td><div style={{maxWidth:160,fontSize:12.5,color:'var(--grey-700)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.description}</div></td>
                <td className={styles.phone}>{fmtDate(o.startDate)} → {fmtDate(o.endDate)}</td>
                <td className={styles.amount}>€ {totalIncl.toLocaleString('nl-NL',{minimumFractionDigits:2})}</td>
                <td>
                  <div className={styles.progWrap}>
                    <div className={styles.progBar}>
                      <div className={styles.progFill} style={{width:pct+'%',background:barColor}}/>
                    </div>
                    <span className={styles.progPct}>{pct.toFixed(0)}%</span>
                  </div>
                </td>
                <td><span className={styles.badge} style={{background:st.bg,color:st.color}}>{o.status}</span></td>
                <td><span className={styles.payBadge} style={{background:pst.bg,color:pst.color}}>{o.paymentStatus}</span></td>
                <td>
                  <div className={styles.actions}>
                    {o.status!=='geannuleerd' && paid<totalIncl && (
                      <button className={styles.payBtn} onClick={()=>onPayment(o)}>
                        <PlusCircle size={12}/>{lbl('Betalen','Pay')}
                      </button>
                    )}
                    <button className={styles.actionBtn} onClick={()=>onEdit(o)}><Pencil size={13}/></button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={()=>onDelete(o.id)}><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}