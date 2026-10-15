import { Pencil, Trash2, ArrowRightLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import styles from './StockList.module.css'

const CAT_COLORS = {
  bouwmaterialen: '#1A3E6F', isolatie: '#2E7D32', elektra: '#E65100',
  sanitair: '#1E88E5', afwerking: '#7B1FA2', veiligheid: '#C8102E', overig: '#607D8B',
}

function stockStatus(item) {
  if (item.quantity === 0)                    return 'out'
  if (item.quantity <= item.minStock)         return 'low'
  if (item.quantity >= item.maxStock * 0.9)   return 'full'
  return 'ok'
}

export default function StockList({ stock, search, filterCat, lang, onEdit, onDelete, onMovement }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const filtered = stock.filter(s => {
    const q = search.toLowerCase()
    if (q && !s.name.toLowerCase().includes(q) && !s.sku.toLowerCase().includes(q) && !s.location.toLowerCase().includes(q)) return false
    if (filterCat && s.category !== filterCat) return false
    return true
  })

  if (filtered.length === 0) return (
    <div className={styles.empty}>
      <p>{lbl('Geen artikelen gevonden', 'No items found')}</p>
    </div>
  )

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{lbl('Artikel', 'Item')}</th>
            <th>{lbl('SKU', 'SKU')}</th>
            <th>{lbl('Categorie', 'Category')}</th>
            <th>{lbl('Locatie', 'Location')}</th>
            <th style={{ textAlign: 'right' }}>{lbl('Voorraad', 'Stock')}</th>
            <th style={{ textAlign: 'right' }}>{lbl('Min / Max', 'Min / Max')}</th>
            <th style={{ textAlign: 'right' }}>{lbl('Waarde', 'Value')}</th>
            <th>{lbl('Status', 'Status')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => {
            const status = stockStatus(item)
            const value  = (item.quantity * item.purchasePrice).toLocaleString('nl-NL', { minimumFractionDigits: 2 })
            const pct    = item.maxStock > 0 ? Math.min(100, (item.quantity / item.maxStock) * 100) : 0
            const barColor = status === 'out' ? '#C8102E' : status === 'low' ? '#FB8C00' : '#43A047'

            return (
              <tr key={item.id} className={styles.row}>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.catDot} style={{ background: CAT_COLORS[item.category] || '#607D8B' }} />
                    <div>
                      <div className={styles.itemName}>{item.name}</div>
                      {item.supplierName && <div className={styles.itemSupplier}>{item.supplierName}</div>}
                    </div>
                  </div>
                </td>
                <td><span className={styles.sku}>{item.sku}</span></td>
                <td><span className={styles.catTag} style={{ background: (CAT_COLORS[item.category]||'#607D8B') + '18', color: CAT_COLORS[item.category]||'#607D8B' }}>{item.category}</span></td>
                <td className={styles.location}>{item.location}</td>
                <td>
                  <div className={styles.qtyCell}>
                    <span className={styles.qty}>{item.quantity} <span className={styles.unit}>{item.unit}</span></span>
                    <div className={styles.qtyBar}>
                      <div className={styles.qtyFill} style={{ width: pct + '%', background: barColor }} />
                    </div>
                  </div>
                </td>
                <td className={styles.minmax}>{item.minStock} / {item.maxStock}</td>
                <td className={styles.valueCell}>€ {value}</td>
                <td>
                  <StockStatusBadge status={status} lang={lang} />
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title={lbl('Beweging', 'Movement')} onClick={() => onMovement(item)}>
                      <ArrowRightLeft size={13} />
                    </button>
                    <button className={styles.actionBtn} title={lbl('Bewerken', 'Edit')} onClick={() => onEdit(item)}>
                      <Pencil size={13} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} title={lbl('Verwijderen', 'Delete')} onClick={() => onDelete(item.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className={styles.tableFooter}>{filtered.length} / {stock.length} {lbl('artikelen', 'items')}</div>
    </div>
  )
}

function StockStatusBadge({ status, lang }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const map = {
    out:  { label: lbl('Uitverkocht','Out of stock'), bg: '#FFEBEE', color: '#B71C1C', Icon: XCircle },
    low:  { label: lbl('Laag','Low stock'),           bg: '#FFF3E0', color: '#E65100', Icon: AlertTriangle },
    ok:   { label: lbl('Op peil','In stock'),         bg: '#E8F5E9', color: '#2E7D32', Icon: CheckCircle },
    full: { label: lbl('Vol','Full'),                  bg: '#E3F2FD', color: '#1565C0', Icon: CheckCircle },
  }
  const { label, bg, color, Icon } = map[status] || map.ok
  return (
    <span className={styles.statusBadge} style={{ background: bg, color }}>
      <Icon size={11} />{label}
    </span>
  )
}