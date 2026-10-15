import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, ClipboardCheck, X, ChevronRight, Package } from 'lucide-react'
import styles from './QualityControl.module.css'

const QC_OPTIONS = [
  { key: 'goedgekeurd',  nl: 'Goedgekeurd',  en: 'Approved',  color: '#2E7D32', bg: '#E8F5E9', Icon: CheckCircle },
  { key: 'gedeeltelijk',nl: 'Gedeeltelijk',  en: 'Partial',   color: '#E65100', bg: '#FFF3E0', Icon: AlertTriangle },
  { key: 'afgekeurd',   nl: 'Afgekeurd',     en: 'Rejected',  color: '#B71C1C', bg: '#FFEBEE', Icon: XCircle },
]

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}-${m}-${y}`
}

// QC tab list view (no modal)
function QCList({ orders, search, filterStatus, lang, onQC }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const filtered = orders
    .filter(o => o.status === 'ontvangen' || o.status === 'gedeeltelijk' || o.qcStatus)
    .filter(o => {
      const q = search.toLowerCase()
      if (q && !o.orderNumber.toLowerCase().includes(q) && !o.supplierName.toLowerCase().includes(q)) return false
      if (filterStatus && o.qcStatus !== filterStatus) return false
      return true
    })

  if (filtered.length === 0) return (
    <div className={styles.empty}><p>{lbl('Geen QC-records gevonden','No QC records found')}</p></div>
  )

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{lbl('Order','Order')}</th>
            <th>{lbl('Leverancier','Supplier')}</th>
            <th>{lbl('Ontvangen','Received')}</th>
            <th>{lbl('KQ Resultaat','QC Result')}</th>
            <th>{lbl('KQ Datum','QC Date')}</th>
            <th>{lbl('Uitgevoerd door','Performed by')}</th>
            <th>{lbl('Notities','Notes')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map(o => {
            const qcOpt = QC_OPTIONS.find(q => q.key === o.qcStatus)
            const needsQC = !o.qcStatus
            return (
              <tr key={o.id} className={styles.row}>
                <td><span className={styles.orderNum}>{o.orderNumber}</span></td>
                <td className={styles.supplier}>{o.supplierName}</td>
                <td className={styles.date}>{fmtDate(o.receivedDate)}</td>
                <td>
                  {qcOpt ? (
                    <span className={styles.qcBadge} style={{ background: qcOpt.bg, color: qcOpt.color }}>
                      <qcOpt.Icon size={12} />
                      {lang === 'nl' ? qcOpt.nl : qcOpt.en}
                    </span>
                  ) : (
                    <span className={styles.qcPending}>⚠ {lbl('Uitvoeren','Pending')}</span>
                  )}
                </td>
                <td className={styles.date}>{fmtDate(o.qcDate)}</td>
                <td className={styles.by}>{o.qcBy || '—'}</td>
                <td className={styles.notes}>{o.qcNotes || '—'}</td>
                <td>
                  <button className={`${styles.qcBtn} ${needsQC ? styles.qcBtnAlert : ''}`} onClick={() => onQC(o)}>
                    <ClipboardCheck size={13} />
                    {needsQC ? lbl('Uitvoeren','Perform QC') : lbl('Bewerken','Edit QC')}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// QC Modal form
function QCModal({ order, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [qcStatus, setQcStatus] = useState(order.qcStatus || '')
  const [qcBy,     setQcBy]     = useState(order.qcBy || '')
  const [qcNotes,  setQcNotes]  = useState(order.qcNotes || '')
  const [error,    setError]    = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!qcStatus) { setError(lbl('Selecteer een resultaat','Select a result')); return }
    if (!qcBy.trim()) { setError(lbl('Vul de naam in van de controleur','Enter inspector name')); return }
    onSave(order.id, {
      qcStatus,
      qcDate: new Date().toISOString().slice(0,10),
      qcBy,
      qcNotes,
    })
  }

  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{lbl('Kwaliteitscontrole','Quality control')}</h2>
            <p className={styles.modalSub}>{order.orderNumber} · {order.supplierName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Order summary */}
        <div className={styles.orderSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLbl}>{lbl('Ontvangen','Received')}</span>
            <span className={styles.summaryVal}>{fmtDate(order.receivedDate)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLbl}>{lbl('Artikelen','Items')}</span>
            <span className={styles.summaryVal}>{totalItems}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLbl}>{lbl('Bedrag','Amount')}</span>
            <span className={styles.summaryVal}>€ {order.totalAmount?.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Items list */}
        <div className={styles.itemsList}>
          {order.items?.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <Package size={13} className={styles.itemIcon} />
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQty}>{item.received || item.quantity} / {item.quantity} {item.unit}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* QC result */}
            <div className={styles.qcOptions}>
              {QC_OPTIONS.map(opt => (
                <label key={opt.key} className={`${styles.qcOption} ${qcStatus === opt.key ? styles.qcOptionActive : ''}`}
                  style={qcStatus === opt.key ? { borderColor: opt.color, background: opt.bg } : {}}>
                  <input type="radio" name="qcStatus" value={opt.key} checked={qcStatus === opt.key}
                    onChange={() => { setQcStatus(opt.key); setError('') }} className={styles.radioHidden} />
                  <opt.Icon size={20} style={{ color: opt.color }} />
                  <span className={styles.qcOptionLabel} style={{ color: qcStatus === opt.key ? opt.color : 'var(--grey-700)' }}>
                    {lang === 'nl' ? opt.nl : opt.en}
                  </span>
                </label>
              ))}
            </div>

            <div className={styles.field}>
              <label className={styles.lbl}>{lbl('Uitgevoerd door','Performed by')} <span style={{ color:'var(--red)' }}>*</span></label>
              <input className={styles.input} value={qcBy} onChange={e => { setQcBy(e.target.value); setError('') }}
                placeholder={lbl('Naam controleur…','Inspector name…')} />
            </div>

            <div className={styles.field}>
              <label className={styles.lbl}>{lbl('Opmerkingen','Remarks')}</label>
              <textarea className={styles.textarea} rows={4} value={qcNotes}
                onChange={e => setQcNotes(e.target.value)}
                placeholder={lbl(
                  qcStatus === 'afgekeurd' ? 'Beschrijf het probleem en de genomen actie (retour, vervanging)…' : 'Bevindingen, opmerkingen…',
                  qcStatus === 'afgekeurd' ? 'Describe the issue and action taken (return, replacement)…' : 'Findings, remarks…'
                )} />
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {qcStatus === 'afgekeurd' && (
              <div className={styles.warningBanner}>
                <AlertTriangle size={15} />
                {lbl('Afgekeurde goederen worden NIET aan de voorraad toegevoegd.','Rejected goods will NOT be added to stock.')}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}>
              <ChevronRight size={14} />
              {lbl('KQ opslaan','Save QC')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Export: either modal or list based on props
export default function QualityControl({ orders, search, filterStatus, lang, onQC, onSave, onClose, modal, singleOrder }) {
  if (modal && singleOrder) {
    return <QCModal order={singleOrder} lang={lang} onSave={onSave} onClose={onClose} />
  }
  return <QCList orders={orders} search={search} filterStatus={filterStatus} lang={lang} onQC={onQC} />
}