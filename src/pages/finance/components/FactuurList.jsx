import { useState } from 'react'
import { Pencil, Trash2, PlusCircle, X, ChevronRight, Eye, Download, Loader } from 'lucide-react'

import styles from './FinanceTable.module.css'
import payStyles from './PaymentModal.module.css'
import ConfirmModal from './ConfirmModal'

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
function g(o, camel, snake) {
  return o[camel] !== undefined ? o[camel] : o[snake]
}

async function fetchPDFBlob(path) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('PDF generatie mislukt')
  return await res.blob()
}

function PDFModal({ blobUrl, title, onClose, onDownload, loading }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'white',borderRadius:12,overflow:'hidden',width:'90vw',maxWidth:960,height:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 80px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',background:'#1A3E6F',color:'white',flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:15}}>📄 {title}</span>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onDownload} style={{display:'flex',alignItems:'center',gap:6,background:'#C8102E',color:'white',border:'none',borderRadius:6,padding:'7px 16px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
              <Download size={14}/> Download
            </button>
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',color:'white',border:'none',borderRadius:6,padding:'7px 14px',cursor:'pointer',fontSize:16,fontWeight:700}}>✕</button>
          </div>
        </div>
        {loading ? (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:12,color:'#666'}}>
            <div style={{width:28,height:28,border:'3px solid #e0e0e0',borderTopColor:'#1A3E6F',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            PDF genereren…
          </div>
        ) : blobUrl ? (
          <iframe src={blobUrl} style={{flex:1,border:'none',width:'100%'}} title={title}/>
        ) : (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#C8102E'}}>Fout bij laden van PDF</div>
        )}
      </div>
    </div>
  )
}

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

  return (
    <div className={payStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={payStyles.modal}>
        <div className={payStyles.header}>
          <div>
            <h3 className={payStyles.title}>{lbl('Betaling registreren','Register payment')}</h3>
            <p className={payStyles.sub}>{g(factuur,'factuurNumber','factuur_number')} · {g(factuur,'clientName','client_name')}</p>
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
                <span>{fmtDate(p.date)}</span><span>{p.method}</span><span>{p.note}</span>
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
              <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={remaining.toFixed(2)}/>
            </div>
          </div>
          <div className={payStyles.row}>
            <div className={payStyles.field}>
              <label>{lbl('Betaalmethode','Method')}</label>
              <select value={method} onChange={e => setMethod(e.target.value)}>
                <option value="overschrijving">Overschrijving</option>
                <option value="pin">PIN</option>
                <option value="contant">Contant</option>
                <option value="ideal">iDEAL</option>
              </select>
            </div>
            <div className={payStyles.field}>
              <label>Note</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="…"/>
            </div>
          </div>
          <div className={payStyles.footer}>
            <button type="button" className={payStyles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={payStyles.saveBtn}><ChevronRight size={14}/>{lbl('Opslaan','Save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FactuurList({ facturen, search, filterStatus, dateFrom, dateTo, lang, onEdit, onDelete, onPayment, calcTotal, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

  const [payModal,    setPayModal]    = useState(null)
  const [preview,     setPreview]     = useState(null)
  const [previewLoad, setPreviewLoad] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [confirmId,   setConfirmId]   = useState(null)

  const confirmFactuur = facturen.find(f => f.id === confirmId)

  async function openPreview(f) {
    const num  = g(f,'factuurNumber','factuur_number') || f.id
    const name = g(f,'clientName','client_name') || ''
    setPreview({ title: `Factuur ${num} — ${name}`, blobUrl: null })
    setPreviewLoad(true)
    try {
      const blob = await fetchPDFBlob(`/pdf/factuur/${f.id}`)
      setPreview(p => ({ ...p, blobUrl: URL.createObjectURL(blob) }))
    } catch (e) { alert(e.message); setPreview(null) }
    finally { setPreviewLoad(false) }
  }

  function downloadFromPreview() {
    if (!preview?.blobUrl) return
    const a = document.createElement('a')
    a.href = preview.blobUrl
    a.download = preview.title.replace(/[^a-z0-9]/gi, '_') + '.pdf'
    a.click()
  }

  async function downloadDirect(f) {
    const num = g(f,'factuurNumber','factuur_number') || f.id
    setDownloading(f.id)
    try {
      const blob = await fetchPDFBlob(`/pdf/factuur/${f.id}`)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `factuur-${num}.pdf`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) { alert(e.message) }
    finally { setDownloading(null) }
  }

  function closePreview() {
    if (preview?.blobUrl) URL.revokeObjectURL(preview.blobUrl)
    setPreview(null)
  }

  const filtered = facturen.filter(f => {
    const num    = g(f,'factuurNumber','factuur_number') || ''
    const client = g(f,'clientName','client_name')       || ''
    const q = search.toLowerCase()
    if (q && !num.toLowerCase().includes(q) && !client.toLowerCase().includes(q)) return false
    if (filterStatus && f.status !== filterStatus) return false
    const date = (f.date||'').toString().slice(0,10)
    if (dateFrom && date < dateFrom) return false
    if (dateTo   && date > dateTo)   return false
    return true
  }).sort((a, b) => (b.date||'').localeCompare(a.date||''))

  if (filtered.length === 0) return (
    <div className={styles.empty}>{lbl('Geen facturen gevonden','No invoices found')}</div>
  )

  return (
    <>
      {(preview || previewLoad) && (
        <PDFModal blobUrl={preview?.blobUrl} title={preview?.title||''} loading={previewLoad} onClose={closePreview} onDownload={downloadFromPreview}/>
      )}

      {confirmId && (
        <ConfirmModal
          title={lbl('Factuur verwijderen','Delete invoice')}
          message={lbl(
            `Weet u zeker dat u factuur "${g(confirmFactuur,'factuurNumber','factuur_number') || ''}" van "${g(confirmFactuur,'clientName','client_name') || ''}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
            `Are you sure you want to delete invoice "${g(confirmFactuur,'factuurNumber','factuur_number') || ''}" from "${g(confirmFactuur,'clientName','client_name') || ''}"? This cannot be undone.`
          )}
          confirmLabel={lbl('Verwijderen','Delete')}
          cancelLabel={lbl('Annuleren','Cancel')}
          onConfirm={() => { onDelete(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}

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
              const excl = calcTotal(f.lines||[])
              const incl = calcTotalIncl(f.lines||[])
              const paid = (f.payments||[]).reduce((s,p) => s + +p.amount, 0)
              const st   = STATUS_STYLE[f.status] || STATUS_STYLE.openstaand
              return (
                <tr key={f.id} className={styles.row}>
                  <td><span className={styles.num}>{factuurNumber}</span></td>
                  <td><div className={styles.client}>{clientName}</div></td>
                  <td><div className={styles.sub}>{projectName}</div></td>
                  <td className={styles.date}>{fmtDate(f.date)}</td>
                  <td className={styles.date}>{fmtDate(dueDate)}</td>
                  <td className={styles.amount}>{fmtEur(excl)}</td>
                  <td className={styles.amount}>{fmtEur(incl)}</td>
                  <td className={styles.amount} style={{color:paid>=incl?'#2E7D32':'#E65100'}}>{fmtEur(paid)}</td>
                  <td><span className={styles.badge} style={{background:st.bg,color:st.color}}>{f.status}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Preview PDF" onClick={() => openPreview(f)} style={{color:'#1565C0'}}><Eye size={14}/></button>
                      <button className={styles.actionBtn} title="Download PDF" onClick={() => downloadDirect(f)} style={{color:downloading===f.id?'#999':'#2E7D32'}} disabled={downloading===f.id}>
                        {downloading===f.id ? <Loader size={14} style={{animation:'spin .7s linear infinite'}}/> : <Download size={14}/>}
                      </button>
                      {f.status !== 'betaald' && (
                        <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} title={lbl('Betaling registreren','Add payment')} onClick={() => setPayModal(f)}><PlusCircle size={14}/></button>
                      )}
                      <button className={styles.actionBtn} onClick={() => onEdit(f)}><Pencil size={13}/></button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => setConfirmId(f.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className={styles.footer}>
          {filtered.length} / {facturen.length} {lbl('facturen','invoices')}
          {(dateFrom||dateTo) && <span style={{marginLeft:8,color:'var(--grey-400)',fontSize:11}}>({lbl('gefilterd op periode','filtered by period')})</span>}
        </div>
      </div>

      {payModal && (
        <PaymentModal factuur={payModal} lang={lang} onSave={onPayment} onClose={() => setPayModal(null)} calcTotalIncl={calcTotalIncl}/>
      )}
    </>
  )
}