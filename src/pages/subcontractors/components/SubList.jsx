import { Pencil, Trash2, Star, Phone, Mail, MapPin } from 'lucide-react'
import styles from './SubTable.module.css'

const SPEC_COLORS = {
  elektra:'#E65100', sanitair:'#1565C0', dakwerk:'#2E7D32',
  schilderwerk:'#7B1FA2', tegelwerk:'#00838F', timmerwerk:'#C8102E', overig:'#607D8B',
}

function StarRating({ rating }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(i=>(
        <Star key={i} size={12} fill={i<=rating?'#FFC107':'none'} stroke={i<=rating?'#FFC107':'#DDD'} />
      ))}
    </div>
  )
}

export default function SubList({ subs, search, filterSpec, filterStatus, lang, orders, onEdit, onDelete }) {
  const lbl = (nl,en) => lang==='nl'?nl:en

  const filtered = subs.filter(s => {
    const q = search.toLowerCase()
    if (q && !s.name.toLowerCase().includes(q) && !s.contactPerson.toLowerCase().includes(q)) return false
    if (filterSpec && s.specialty !== filterSpec) return false
    if (filterStatus && s.status !== filterStatus) return false
    return true
  })

  if (filtered.length === 0) return <div className={styles.empty}>{lbl('Geen onderaannemers gevonden','No subcontractors found')}</div>

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr>
          <th>{lbl('Naam','Name')}</th>
          <th>{lbl('Specialisme','Specialty')}</th>
          <th>{lbl('Contactpersoon','Contact')}</th>
          <th>{lbl('Telefoon','Phone')}</th>
          <th>{lbl('Opdrachten','Orders')}</th>
          <th>{lbl('Beoordeling','Rating')}</th>
          <th>{lbl('Status','Status')}</th>
          <th />
        </tr></thead>
        <tbody>
          {filtered.map(s => {
            const subOrders = orders.filter(o=>o.subcontractorId===s.id)
            const c = SPEC_COLORS[s.specialty]||'#607D8B'
            return (
              <tr key={s.id} className={styles.row}>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.specDot} style={{ background: c }} />
                    <div>
                      <div className={styles.name}>{s.name}</div>
                      {s.email && <div className={styles.sub}><Mail size={10}/>{s.email}</div>}
                    </div>
                  </div>
                </td>
                <td><span className={styles.specTag} style={{ background:c+'18', color:c }}>{s.specialty}</span></td>
                <td className={styles.contact}>{s.contactPerson}</td>
                <td className={styles.phone}>{s.phone}</td>
                <td>
                  <span className={styles.orderCount}>{subOrders.length}</span>
                  {subOrders.filter(o=>o.status!=='afgerond'&&o.status!=='geannuleerd').length > 0 && (
                    <span className={styles.openBadge}>
                      {subOrders.filter(o=>o.status!=='afgerond'&&o.status!=='geannuleerd').length} open
                    </span>
                  )}
                </td>
                <td><StarRating rating={s.rating||0} /></td>
                <td>
                  <span className={styles.statusBadge} style={{
                    background: s.status==='actief'?'#E8F5E9':'#F5F5F5',
                    color:      s.status==='actief'?'#2E7D32':'#757575',
                  }}>{s.status}</span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={()=>onEdit(s)}><Pencil size={13}/></button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={()=>onDelete(s.id)}><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className={styles.footer}>{filtered.length} / {subs.length} {lbl('onderaannemers','subcontractors')}</div>
    </div>
  )
}