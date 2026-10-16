import { Pencil, Trash2 } from 'lucide-react'
import styles from './FinanceTable.module.css'

const CAT_COLORS = {
  materialen: '#1A3E6F', transport: '#E65100', gereedschap: '#7B1FA2',
  veiligheid: '#C8102E', onderhoud: '#2E7D32', overig: '#607D8B',
}
const STATUS_STYLE = {
  betaald:    { bg: '#E8F5E9', color: '#2E7D32' },
  te_betalen: { bg: '#FFF3E0', color: '#E65100' },
  besteld:    { bg: '#E3F2FD', color: '#1565C0' },
}

function fmtDate(d) {
  if (!d) return '—'

  // Si c'est déjà un ISO string complet (avec T et Z), on parse en Date
  if (typeof d === 'string' && (d.includes('T') || d.includes('Z'))) {
    const parsed = new Date(d)
    if (!isNaN(parsed.getTime())) {
      const day  = String(parsed.getDate()).padStart(2, '0')
      const m    = String(parsed.getMonth() + 1).padStart(2, '0')
      const y    = parsed.getFullYear()
      return `${day}-${m}-${y}`
    }
  }

  // Sinon format simple YYYY-MM-DD
  const raw = String(d).slice(0, 10)
  const [y, m, day] = raw.split('-')
  return `${day}-${m}-${y}`
}

export default function UitgavenList({ uitgaven, search, filterStatus, lang, onEdit, onDelete }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

  const filtered = uitgaven.filter(u => {
    const q = search.toLowerCase()
    if (q && !u.description.toLowerCase().includes(q) && !u.supplier?.toLowerCase().includes(q)) return false
    if (filterStatus && u.status !== filterStatus) return false
    return true
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)))

  const totalExcl = filtered.reduce((s, u) => s + u.amount, 0)
  const totalBtw  = filtered.reduce((s, u) => s + (u.btwAmount || 0), 0)

  if (filtered.length === 0) return <div className={styles.empty}>{lbl('Geen uitgaven gevonden','No expenses found')}</div>

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr>
          <th>{lbl('Datum','Date')}</th>
          <th>{lbl('Omschrijving','Description')}</th>
          <th>{lbl('Categorie','Category')}</th>
          <th>{lbl('Leverancier','Supplier')}</th>
          <th>{lbl('Project','Project')}</th>
          <th>{lbl('Betaalmethode','Payment')}</th>
          <th style={{ textAlign:'right' }}>{lbl('Excl. BTW','Excl. VAT')}</th>
          <th style={{ textAlign:'right' }}>{lbl('BTW','VAT')}</th>
          <th style={{ textAlign:'right' }}>{lbl('Incl. BTW','Incl. VAT')}</th>
          <th>{lbl('Status','Status')}</th>
          <th />
        </tr></thead>
        <tbody>
          {filtered.map(u => {
            const inclBtw = u.amount + (u.btwAmount || 0)
            const st = STATUS_STYLE[u.status] || STATUS_STYLE.te_betalen
            return (
              <tr key={u.id} className={styles.row}>
                <td className={styles.date}>{fmtDate(u.date)}</td>
                <td>
                  <div className={styles.client}>{u.description}</div>
                </td>
                <td>
                  <span className={styles.badge} style={{ background: (CAT_COLORS[u.category]||'#607D8B') + '18', color: CAT_COLORS[u.category]||'#607D8B' }}>
                    {u.category}
                  </span>
                </td>
                <td className={styles.sub}>{u.supplier || '—'}</td>
                <td className={styles.sub}>{u.projectName || '—'}</td>
                <td className={styles.sub}>{u.paymentMethod || '—'}</td>
                <td className={styles.amount}>{fmtEur(u.amount)}</td>
                <td className={styles.amount} style={{ color: 'var(--grey-500)', fontWeight: 400 }}>{fmtEur(u.btwAmount || 0)}</td>
                <td className={styles.amount}>{fmtEur(inclBtw)}</td>
                <td><span className={styles.badge} style={{ background: st.bg, color: st.color }}>{u.status}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => onEdit(u)}><Pencil size={13} /></button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => onDelete(u.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className={styles.footer} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span>{filtered.length} / {uitgaven.length} {lbl('uitgaven','expenses')}</span>
        <span style={{ fontWeight:600, color:'var(--grey-900)' }}>
          {lbl('Totaal','Total')}: {fmtEur(totalExcl)} + {fmtEur(totalBtw)} BTW = <strong>{fmtEur(totalExcl + totalBtw)}</strong>
        </span>
      </div>
    </div>
  )
}