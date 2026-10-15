import { Pencil, Trash2, FileCheck } from 'lucide-react'
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

// Support both camelCase (seed/form) and snake_case (DB)
function g(o, camel, snake) {
  return o[camel] !== undefined ? o[camel] : o[snake]
}

export default function OfferteList({ offertes, search, filterStatus, lang, onEdit, onDelete, onConvert, calcTotal, calcTotalIncl }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fmtEur = n => '€ ' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

  const filtered = offertes.filter(o => {
    const num     = g(o, 'offerteNumber', 'offerte_number') || ''
    const client  = g(o, 'clientName',    'client_name')    || ''
    const project = g(o, 'projectName',   'project_name')   || ''
    const q = search.toLowerCase()
    if (q && !num.toLowerCase().includes(q) &&
             !client.toLowerCase().includes(q) &&
             !project.toLowerCase().includes(q)) return false
    if (filterStatus && o.status !== filterStatus) return false
    return true
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  if (filtered.length === 0) return (
    <div className={styles.empty}>{lbl('Geen offertes gevonden', 'No quotes found')}</div>
  )

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr>
          <th>{lbl('Nummer', 'Number')}</th>
          <th>{lbl('Klant', 'Client')}</th>
          <th>{lbl('Project', 'Project')}</th>
          <th>{lbl('Datum', 'Date')}</th>
          <th>{lbl('Geldig tot', 'Valid until')}</th>
          <th style={{ textAlign: 'right' }}>{lbl('Excl. BTW', 'Excl. VAT')}</th>
          <th style={{ textAlign: 'right' }}>{lbl('Incl. BTW', 'Incl. VAT')}</th>
          <th>{lbl('Status', 'Status')}</th>
          <th/>
        </tr></thead>
        <tbody>
          {filtered.map(o => {
            const offerteNumber     = g(o, 'offerteNumber',      'offerte_number')       || '—'
            const clientName        = g(o, 'clientName',          'client_name')          || '—'
            const projectName       = g(o, 'projectName',         'project_name')         || '—'
            const validDays         = g(o, 'validDays',           'valid_days')           || 14
            const convertedToInvoice= g(o, 'convertedToInvoice',  'converted_to_invoice') || false

            const excl = calcTotal(o.lines || [])
            const incl = calcTotalIncl(o.lines || [])
            const st   = STATUS_STYLE[o.status] || STATUS_STYLE.concept

            // Safe valid until calculation
            const validUntil = (() => {
              if (!o.date) return '—'
              try {
                const d = new Date(o.date)
                if (isNaN(d.getTime())) return '—'
                d.setDate(d.getDate() + +validDays)
                return fmtDate(d.toISOString().slice(0, 10))
              } catch { return '—' }
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
                <td><span className={styles.badge} style={{ background: st.bg, color: st.color }}>{o.status}</span></td>
                <td>
                  <div className={styles.actions}>
                    {!convertedToInvoice && o.status === 'goedgekeurd' && (
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnGreen}`}
                        title={lbl('Omzetten naar factuur', 'Convert to invoice')}
                        onClick={() => onConvert(o)}>
                        <FileCheck size={14}/>
                      </button>
                    )}
                    <button className={styles.actionBtn} title={lbl('Bewerken', 'Edit')} onClick={() => onEdit(o)}>
                      <Pencil size={13}/>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} title={lbl('Verwijderen', 'Delete')} onClick={() => onDelete(o.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className={styles.footer}>{filtered.length} / {offertes.length} {lbl('offertes', 'quotes')}</div>
    </div>
  )
}