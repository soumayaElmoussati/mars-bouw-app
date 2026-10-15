import { Pencil, ClipboardCheck, PackageCheck, AlertTriangle, Clock, CheckCircle, XCircle, Package } from 'lucide-react'
import styles from './PurchaseOrders.module.css'

const STATUS_STYLE = {
  besteld:      { bg: '#E3F2FD', color: '#1565C0', Icon: Clock },
  ontvangen:    { bg: '#E8F5E9', color: '#2E7D32', Icon: CheckCircle },
  gedeeltelijk: { bg: '#FFF3E0', color: '#E65100', Icon: AlertTriangle },
  geannuleerd:  { bg: '#F5F5F5', color: '#757575', Icon: XCircle },
}

const QC_STYLE = {
  goedgekeurd:  { bg: '#E8F5E9', color: '#2E7D32' },
  afgekeurd:    { bg: '#FFEBEE', color: '#B71C1C' },
  gedeeltelijk: { bg: '#FFF3E0', color: '#E65100' },
}

export default function PurchaseOrders({ orders, search, filterStatus, lang, onEdit, onReceive, onQC }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    if (q && !o.orderNumber.toLowerCase().includes(q) && !o.supplierName.toLowerCase().includes(q) && !o.projectName?.toLowerCase().includes(q)) return false
    if (filterStatus && o.status !== filterStatus) return false
    return true
  }).sort((a, b) => b.orderDate.localeCompare(a.orderDate))

  if (filtered.length === 0) return (
    <div className={styles.empty}><p>{lbl('Geen orders gevonden','No orders found')}</p></div>
  )

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{lbl('Ordernummer','Order number')}</th>
            <th>{lbl('Leverancier','Supplier')}</th>
            <th>{lbl('Project','Project')}</th>
            <th>{lbl('Besteldatum','Order date')}</th>
            <th>{lbl('Verwacht','Expected')}</th>
            <th style={{ textAlign:'right' }}>{lbl('Bedrag','Amount')}</th>
            <th>{lbl('Status','Status')}</th>
            <th>{lbl('KQ','QC')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map(o => {
            const st = STATUS_STYLE[o.status] || STATUS_STYLE.besteld
            const StatusIcon = st.Icon
            const qc = o.qcStatus ? QC_STYLE[o.qcStatus] : null
            const totalItems = o.items.reduce((s, i) => s + i.quantity, 0)
            const needsQC = o.status === 'ontvangen' && !o.qcStatus

            return (
              <tr key={o.id} className={styles.row}>
                <td>
                  <div className={styles.orderNum}>{o.orderNumber}</div>
                  <div className={styles.itemCount}><Package size={11} />{totalItems} {lbl('artikel(en)','item(s)')}</div>
                </td>
                <td className={styles.supplier}>{o.supplierName}</td>
                <td className={styles.project}>{o.projectName || '—'}</td>
                <td className={styles.date}>{fmtDate(o.orderDate)}</td>
                <td className={styles.date}>{fmtDate(o.expectedDate)}</td>
                <td className={styles.amount}>€ {o.totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                <td>
                  <span className={styles.badge} style={{ background: st.bg, color: st.color }}>
                    <StatusIcon size={11} />{o.status}
                  </span>
                </td>
                <td>
                  {qc ? (
                    <span className={styles.badge} style={{ background: qc.bg, color: qc.color }}>
                      {o.qcStatus}
                    </span>
                  ) : needsQC ? (
                    <span className={styles.badgeAlert}>⚠ {lbl('Vereist','Required')}</span>
                  ) : (
                    <span className={styles.badgeGrey}>—</span>
                  )}
                </td>
                <td>
                  <div className={styles.actions}>
                    {o.status === 'besteld' && (
                      <button className={styles.receiveBtn} onClick={() => onReceive(o.id)} title={lbl('Ontvangen','Mark received')}>
                        <PackageCheck size={13} />
                      </button>
                    )}
                    {(o.status === 'ontvangen' || o.status === 'gedeeltelijk') && (
                      <button className={`${styles.actionBtn} ${styles.qcBtn}`} onClick={() => onQC(o)} title="QC">
                        <ClipboardCheck size={13} />
                      </button>
                    )}
                    <button className={styles.actionBtn} onClick={() => onEdit(o)} title={lbl('Bewerken','Edit')}>
                      <Pencil size={13} />
                    </button>
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

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}-${m}-${y}`
}