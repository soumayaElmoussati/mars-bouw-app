import { useState } from 'react'
import { Pencil, Trash2, FileCheck, Eye, Download, Loader } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import styles from './FinanceTable.module.css'

const STATUS_STYLE = {
  concept:     { bg: '#F5F5F5', color: '#757575' },
  verzonden:   { bg: '#E3F2FD', color: '#1565C0' },
  goedgekeurd: { bg: '#E8F5E9', color: '#2E7D32' },
  afgewezen:   { bg: '#FFEBEE', color: '#B71C1C' },
  verlopen:    { bg: '#FFF3E0', color: '#E65100' },
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

export default function OfferteList({ offertes, search, filterStatus, dateFrom, dateTo, lang, onEdit, onDelete, onConvert, calcTotal, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

  const [preview,     setPreview]     = useState(null)
  const [previewLoad, setPreviewLoad] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [confirmId,   setConfirmId]   = useState(null)  // id to delete

  const confirmOfferte = offertes.find(o => o.id === confirmId)

  async function openPreview(o) {
    const num  = g(o,'offerteNumber','offerte_number') || o.id
    const name = g(o,'clientName','client_name') || ''
    setPreview({ title: `Offerte ${num} — ${name}`, blobUrl: null })
    setPreviewLoad(true)
    try {
      const blob = await fetchPDFBlob(`/pdf/offerte/${o.id}`)
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

  async function downloadDirect(o) {
    const num = g(o,'offerteNumber','offerte_number') || o.id
    setDownloading(o.id)
    try {
      const blob = await fetchPDFBlob(`/pdf/offerte/${o.id}`)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `offerte-${num}.pdf`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) { alert(e.message) }
    finally { setDownloading(null) }
  }

  function closePreview() {
    if (preview?.blobUrl) URL.revokeObjectURL(preview.blobUrl)
    setPreview(null)
  }

  const filtered = offertes.filter(o => {
    const num     = g(o,'offerteNumber','offerte_number') || ''
    const client  = g(o,'clientName','client_name')       || ''
    const project = g(o,'projectName','project_name')     || ''
    const q = search.toLowerCase()
    if (q && !num.toLowerCase().includes(q) && !client.toLowerCase().includes(q) && !project.toLowerCase().includes(q)) return false
    if (filterStatus && o.status !== filterStatus) return false
    const date = (o.date||'').toString().slice(0,10)
    if (dateFrom && date < dateFrom) return false
    if (dateTo   && date > dateTo)   return false
    return true
  }).sort((a, b) => (b.date||'').localeCompare(a.date||''))

  if (filtered.length === 0) return (
    <div className={styles.empty}>{lbl('Geen offertes gevonden','No quotes found')}</div>
  )

  return (
    <>
      {(preview || previewLoad) && (
        <PDFModal blobUrl={preview?.blobUrl} title={preview?.title||''} loading={previewLoad} onClose={closePreview} onDownload={downloadFromPreview}/>
      )}

      {confirmId && (
        <ConfirmModal
          title={lbl('Offerte verwijderen','Delete quote')}
          message={lbl(
            `Weet u zeker dat u offerte "${g(confirmOfferte,'offerteNumber','offerte_number') || ''}" van "${g(confirmOfferte,'clientName','client_name') || ''}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
            `Are you sure you want to delete quote "${g(confirmOfferte,'offerteNumber','offerte_number') || ''}" from "${g(confirmOfferte,'clientName','client_name') || ''}"? This cannot be undone.`
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
            <th>{lbl('Geldig tot','Valid until')}</th>
            <th style={{textAlign:'right'}}>{lbl('Excl. BTW','Excl. VAT')}</th>
            <th style={{textAlign:'right'}}>{lbl('Incl. BTW','Incl. VAT')}</th>
            <th>{lbl('Status','Status')}</th>
            <th/>
          </tr></thead>
          <tbody>
            {filtered.map(o => {
              const offerteNumber      = g(o,'offerteNumber','offerte_number') || '—'
              const clientName         = g(o,'clientName','client_name')       || '—'
              const projectName        = g(o,'projectName','project_name')     || '—'
              const validDays          = g(o,'validDays','valid_days')         || 14
              const convertedToInvoice = g(o,'convertedToInvoice','converted_to_invoice') || false
              const excl = calcTotal(o.lines||[])
              const incl = calcTotalIncl(o.lines||[])
              const st   = STATUS_STYLE[o.status] || STATUS_STYLE.concept
              const validUntil = (() => {
                if (!o.date) return '—'
                try { const d=new Date(o.date); if(isNaN(d.getTime())) return '—'; d.setDate(d.getDate()+ +validDays); return fmtDate(d.toISOString().slice(0,10)) } catch { return '—' }
              })()
              return (
                <tr key={o.id} className={styles.row}>
                  <td><span className={styles.num}>{offerteNumber}</span></td>
                  <td><div className={styles.client}>{clientName}</div></td>
                  <td><div className={styles.sub}>{projectName}</div></td>
                  <td className={styles.date}>{fmtDate(o.date)}</td>
                  <td className={styles.date}>{validUntil}</td>
                  <td className={styles.amount}>{fmtEur(excl)}</td>
                  <td className={styles.amount}>{fmtEur(incl)}</td>
                  <td><span className={styles.badge} style={{background:st.bg,color:st.color}}>{o.status}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Preview PDF" onClick={() => openPreview(o)} style={{color:'#1565C0'}}><Eye size={14}/></button>
                      <button className={styles.actionBtn} title="Download PDF" onClick={() => downloadDirect(o)} style={{color:downloading===o.id?'#999':'#2E7D32'}} disabled={downloading===o.id}>
                        {downloading===o.id ? <Loader size={14} style={{animation:'spin .7s linear infinite'}}/> : <Download size={14}/>}
                      </button>
                      {!convertedToInvoice && o.status==='goedgekeurd' && (
                        <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} title={lbl('Omzetten naar factuur','Convert to invoice')} onClick={() => onConvert(o)}><FileCheck size={14}/></button>
                      )}
                      <button className={styles.actionBtn} onClick={() => onEdit(o)}><Pencil size={13}/></button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => setConfirmId(o.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className={styles.footer}>
          {filtered.length} / {offertes.length} {lbl('offertes','quotes')}
          {(dateFrom||dateTo) && <span style={{marginLeft:8,color:'var(--grey-400)',fontSize:11}}>({lbl('gefilterd op periode','filtered by period')})</span>}
        </div>
      </div>
    </>
  )
}