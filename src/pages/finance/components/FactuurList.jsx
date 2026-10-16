import { useState } from 'react'
import { Pencil, Trash2, PlusCircle, X, ChevronRight, Eye, Download } from 'lucide-react'
import { API_URL } from '../../../api/client'
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
  return d.toString().slice(0, 10).split('-').reverse().join('-')
}

// Support snake_case (DB) and camelCase (form)
function g(o, camel, snake) {
  return o[camel] !== undefined ? o[camel] : o[snake]
}

// ── PDF Preview Modal ─────────────────────────────────────────────────────
function PDFModal({ url, title, onClose }) {
  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',
      zIndex:9999,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',
    }}>
      <div style={{
        background:'white',borderRadius:12,overflow:'hidden',
        width:'90vw',maxWidth:900,height:'90vh',
        display:'flex',flexDirection:'column',
        boxShadow:'0 25px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'12px 20px',background:'#1A3E6F',color:'white',
        }}>
          <span style={{fontWeight:700,fontSize:15}}>📄 {title}</span>
          <div style={{display:'flex',gap:10}}>
            <a href={url.replace('#toolbar=0','?download=1')} target="_blank" rel="noreferrer"
              style={{
                display:'flex',alignItems:'center',gap:6,
                background:'#C8102E',color:'white',border:'none',
                borderRadius:6,padding:'6px 14px',textDecoration:'none',
                fontSize:13,fontWeight:600,cursor:'pointer',
              }}>
              <Download size={14}/> Download
            </a>
            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.2)',color:'white',
              border:'none',borderRadius:6,padding:'6px 14px',
              cursor:'pointer',fontSize:18,fontWeight:700,
            }}>✕</button>
          </div>
        </div>
        <iframe src={url} style={{flex:1,border:'none',width:'100%'}} title={title}/>
      </div>
    </div>
  )
}

// ── Payment Modal ─────────────────────────────────────────────────────────
function PaymentModal({ factuur, lang, onSave, onClose, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [date,   setDate]   = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('overschrijving')
  const [note,   setNote]   = useState('')

  const total     = calcTotalIncl(factuur.lines || [])
  const paid      = (factuur.payments || []).reduce((s, p) => s + +p.amount, 0)
  const remaining = total - paid

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || +amount <= 0) return
    onSave(factuur.id, { date, amount: +amount, method, note })
    onClose()
  }

  const factuurNumber = g(factuur,'factuurNumber','factuur_number') || ''
  const clientName    = g(factuur,'clientName','client_name')       || ''

  return (
    <div className={payStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={payStyles.modal}>
        <div className={payStyles.header}>
          <div>
            <h3 className={payStyles.title}>{lbl('Betaling registreren','Register payment')}</h3>
            <p className={payStyles.sub}>{factuurNumber} · {clientName}</p>
          </div>
          <button className={payStyles.closeBtn} onClick={onClose}><X size={16}/></button>
        </div>
        <div className={payStyles.summary}>
          <div className={payStyles.summaryItem}><span>{lbl('Totaal','Total')}</span><strong>€ {total.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
          <div className={payStyles.summaryItem}><span>{lbl('Betaald','Paid')}</span><strong style={{color:'#2E7D32'}}>€ {paid.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
          <div className={payStyles.summaryItem}><span>{lbl('Resterend','Remaining')}</span><strong style={{color:'#E65100'}}>€ {remaining.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
        </div>
        {(factuur.payments||[]).length > 0 && (
          <div className={payStyles.history}>
            {factuur.payments.map(p => (
              <div key={p.id} className={payStyles.historyRow}>
                <span>{fmtDate(p.date)}</span>
                <span>{p.method}</span>
                <span>{p.note}</span>
                <strong>€ {(+p.amount).toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className={payStyles.form}>
          <div className={payStyles.row}>
            <div className={payStyles.field}>
              <label>{lbl('Datum','Date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}/>
            </div>
            <div className={payStyles.field}>
              <label>{lbl('Bedrag (€)','Amount (€)')}</label>
              <input type="number" min="0.01" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={remaining.toFixed(2)}/>
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
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="…"/>
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

// ── Main component ────────────────────────────────────────────────────────
export default function FactuurList({ facturen, search, filterStatus, lang, onEdit, onDelete, onPayment, calcTotal, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })
  const [payModal, setPayModal] = useState(null)
  const [preview,  setPreview]  = useState(null)

  function openPreview(f) {
    const num  = g(f,'factuurNumber','factuur_number') || f.id
    const name = g(f,'clientName','client_name') || ''
    setPreview({ url: `${API_URL}/pdf/factuur/${f.id}#toolbar=0`, title: `Factuur ${num} — ${name}` })
  }

  function downloadPDF(f) {
    window.open(`${API_URL}/pdf/factuur/${f.id}?download=1`, '_blank')
  }

  const filtered = facturen.filter(f => {
    const num    = g(f,'factuurNumber','factuur_number') || ''
    const client = g(f,'clientName','client_name')       || ''
    const q = search.toLowerCase()
    if (q && !num.toLowerCase().includes(q) && !client.toLowerCase().includes(q)) return false
    if (filterStatus && f.status !== filterStatus) return false
    return true
  }).sort((a, b) => (b.date||'').localeCompare(a.date||''))

  if (filtered.length === 0) return (
    <div className={styles.empty}>{lbl('Geen facturen gevonden','No invoices found')}</div>
  )

  return (
    <>
      {preview  && <PDFModal url={preview.url} title={preview.title} onClose={() => setPreview(null)}/>}

      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr>
            <th>{lbl('Nummer','Number')}</th>
            <th>{lbl('Klant','Client')}</th>
            <th>{lbl('Project','Project')}</th>
            <th>{lbl('Datum','Date')}</th>
            <th>{lbl('Vervaldatum','Due date')}</th>
            <th style={{textAlign:'right'}}>{lbl('Excl. BTW','Excl. VAT')}</th>
            <th style={{textAlign:'right'}}>{lbl('Incl. BTW','Incl. VAT')}</th>
            <th style={{textAlign:'right'}}>{lbl('Betaald','Paid')}</th>
            <th>{lbl('Status','Status')}</th>
            <th/>
          </tr></thead>
          <tbody>
            {filtered.map(f => {
              const factuurNumber = g(f,'factuurNumber','factuur_number') || '—'
              const clientName    = g(f,'clientName','client_name')       || '—'
              const projectName   = g(f,'projectName','project_name')     || '—'
              const dueDate       = g(f,'dueDate','due_date')

              const excl  = calcTotal(f.lines || [])
              const incl  = calcTotalIncl(f.lines || [])
              const paid  = (f.payments||[]).reduce((s,p) => s + +p.amount, 0)
              const st    = STATUS_STYLE[f.status] || STATUS_STYLE.openstaand

              return (
                <tr key={f.id} className={styles.row}>
                  <td><span className={styles.num}>{factuurNumber}</span></td>
                  <td><div className={styles.client}>{clientName}</div></td>
                  <td><div className={styles.sub}>{projectName}</div></td>
                  <td className={styles.date}>{fmtDate(f.date)}</td>
                  <td className={styles.date}>{fmtDate(dueDate)}</td>
                  <td className={styles.amount}>{fmtEur(excl)}</td>
                  <td className={styles.amount}>{fmtEur(incl)}</td>
                  <td className={styles.amount} style={{color: paid >= incl ? '#2E7D32' : '#E65100'}}>{fmtEur(paid)}</td>
                  <td><span className={styles.badge} style={{background:st.bg,color:st.color}}>{f.status}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Preview PDF" onClick={() => openPreview(f)} style={{color:'#1565C0'}}>
                        <Eye size={14}/>
                      </button>
                      <button className={styles.actionBtn} title="Download PDF" onClick={() => downloadPDF(f)} style={{color:'#2E7D32'}}>
                        <Download size={14}/>
                      </button>
                      {f.status !== 'betaald' && (
                        <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`}
                          title={lbl('Betaling registreren','Add payment')}
                          onClick={() => setPayModal(f)}>
                          <PlusCircle size={14}/>
                        </button>
                      )}
                      <button className={styles.actionBtn} onClick={() => onEdit(f)}><Pencil size={13}/></button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => onDelete(f.id)}><Trash2 size={13}/></button>
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
        <PaymentModal
          factuur={payModal} lang={lang}
          onSave={onPayment}
          onClose={() => setPayModal(null)}
          calcTotalIncl={calcTotalIncl}
        />
      )}
    </>
  )
}