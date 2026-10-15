import { useState } from 'react'
import { Pencil, Trash2, PlusCircle, X, ChevronRight } from 'lucide-react'
import styles from './FinanceTable.module.css'
import payStyles from './PaymentModal.module.css'

const STATUS_STYLE = {
  openstaand:   { bg: '#FFF3E0', color: '#E65100' },
  gedeeltelijk: { bg: '#E3F2FD', color: '#1565C0' },
  betaald:      { bg: '#E8F5E9', color: '#2E7D32' },
  vervallen:    { bg: '#FFEBEE', color: '#B71C1C' },
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-'); return `${day}-${m}-${y}`
}

function PaymentModal({ factuur, lang, onSave, onClose, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('overschrijving')
  const [note, setNote] = useState('')

  const total = calcTotalIncl(factuur.lines)
  const paid  = (factuur.payments || []).reduce((s, p) => s + p.amount, 0)
  const remaining = total - paid

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || +amount <= 0) return
    onSave(factuur.id, { date, amount: +amount, method, note })
    onClose()
  }

  return (
    <div className={payStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={payStyles.modal}>
        <div className={payStyles.header}>
          <div>
            <h3 className={payStyles.title}>{lbl('Betaling registreren','Register payment')}</h3>
            <p className={payStyles.sub}>{factuur.factuurNumber} · {factuur.clientName}</p>
          </div>
          <button className={payStyles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={payStyles.summary}>
          <div className={payStyles.summaryItem}><span>{lbl('Totaal','Total')}</span><strong>€ {total.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
          <div className={payStyles.summaryItem}><span>{lbl('Betaald','Paid')}</span><strong style={{color:'#2E7D32'}}>€ {paid.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
          <div className={payStyles.summaryItem}><span>{lbl('Resterend','Remaining')}</span><strong style={{color:'#E65100'}}>€ {remaining.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
        </div>

        {(factuur.payments || []).length > 0 && (
          <div className={payStyles.history}>
            {factuur.payments.map(p => (
              <div key={p.id} className={payStyles.historyRow}>
                <span>{fmtDate(p.date)}</span>
                <span>{p.method}</span>
                <span>{p.note}</span>
                <strong>€ {p.amount.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className={payStyles.form}>
          <div className={payStyles.row}>
            <div className={payStyles.field}>
              <label>{lbl('Datum','Date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className={payStyles.field}>
              <label>{lbl('Bedrag (€)','Amount (€)')}</label>
              <input type="number" min="0.01" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={remaining.toFixed(2)} />
            </div>
          </div>
          <div className={payStyles.row}>
            <div className={payStyles.field}>
              <label>{lbl('Betaalmethode','Payment method')}</label>
              <select value={method} onChange={e => setMethod(e.target.value)}>
                <option value="overschrijving">Overschrijving</option>
                <option value="pin">PIN</option>
                <option value="contant">Contant</option>
                <option value="ideal">iDEAL</option>
              </select>
            </div>
            <div className={payStyles.field}>
              <label>{lbl('Notitie','Note')}</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="…" />
            </div>
          </div>
          <div className={payStyles.footer}>
            <button type="button" className={payStyles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={payStyles.saveBtn}><ChevronRight size={14}/>{lbl('Betaling opslaan','Save payment')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FactuurList({ facturen, search, filterStatus, lang, onEdit, onDelete, onPayment, calcTotal, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })
  const [payModal, setPayModal] = useState(null)

  const filtered = facturen.filter(f => {
    const q = search.toLowerCase()
    if (q && !f.factuurNumber.toLowerCase().includes(q) && !f.clientName.toLowerCase().includes(q)) return false
    if (filterStatus && f.status !== filterStatus) return false
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))

  if (filtered.length === 0) return <div className={styles.empty}>{lbl('Geen facturen gevonden','No invoices found')}</div>

  return (
    <>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr>
            <th>{lbl('Nummer','Number')}</th>
            <th>{lbl('Klant','Client')}</th>
            <th>{lbl('Project','Project')}</th>
            <th>{lbl('Datum','Date')}</th>
            <th>{lbl('Vervaldatum','Due date')}</th>
            <th style={{ textAlign:'right' }}>{lbl('Excl. BTW','Excl. VAT')}</th>
            <th style={{ textAlign:'right' }}>{lbl('Incl. BTW','Incl. VAT')}</th>
            <th style={{ textAlign:'right' }}>{lbl('Betaald','Paid')}</th>
            <th>{lbl('Status','Status')}</th>
            <th />
          </tr></thead>
          <tbody>
            {filtered.map(f => {
              const excl  = calcTotal(f.lines)
              const incl  = calcTotalIncl(f.lines)
              const paid  = (f.payments||[]).reduce((s,p) => s+p.amount, 0)
              const st    = STATUS_STYLE[f.status] || STATUS_STYLE.openstaand
              return (
                <tr key={f.id} className={styles.row}>
                  <td><span className={styles.num}>{f.factuurNumber}</span></td>
                  <td><div className={styles.client}>{f.clientName}</div></td>
                  <td><div className={styles.sub}>{f.projectName}</div></td>
                  <td className={styles.date}>{fmtDate(f.date)}</td>
                  <td className={styles.date}>{fmtDate(f.dueDate)}</td>
                  <td className={styles.amount}>{fmtEur(excl)}</td>
                  <td className={styles.amount}>{fmtEur(incl)}</td>
                  <td className={styles.amount} style={{ color: paid >= incl ? '#2E7D32' : '#E65100' }}>{fmtEur(paid)}</td>
                  <td><span className={styles.badge} style={{ background: st.bg, color: st.color }}>{f.status}</span></td>
                  <td>
                    <div className={styles.actions}>
                      {f.status !== 'betaald' && (
                        <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} title={lbl('Betaling registreren','Add payment')} onClick={() => setPayModal(f)}>
                          <PlusCircle size={14} />
                        </button>
                      )}
                      <button className={styles.actionBtn} onClick={() => onEdit(f)}><Pencil size={13} /></button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => onDelete(f.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className={styles.footer}>{filtered.length} / {facturen.length} {lbl('facturen','invoices')}</div>
      </div>

      {payModal && (
        <PaymentModal factuur={payModal} lang={lang}
          onSave={onPayment}
          onClose={() => setPayModal(null)}
          calcTotalIncl={calcTotalIncl} />
      )}
    </>
  )
}