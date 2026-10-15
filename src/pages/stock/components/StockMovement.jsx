import { useState } from 'react'
import { X, ArrowDown, ArrowUp } from 'lucide-react'
import styles from './SlideForm.module.css'
import mvStyles from './StockMovement.module.css'

export default function StockMovement({ stock, selected, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [stockId, setStockId] = useState(selected ? String(selected.id) : '')
  const [type, setType] = useState('in')
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const item = stock.find(s => String(s.id) === stockId)

  function handleSubmit(e) {
    e.preventDefault()
    if (!stockId) { setError(lbl('Selecteer een artikel', 'Select an item')); return }
    if (!qty || qty <= 0) { setError(lbl('Voer een geldige hoeveelheid in', 'Enter a valid quantity')); return }
    if (type === 'out' && item && qty > item.quantity) { setError(lbl('Onvoldoende voorraad', 'Insufficient stock')); return }
    onSave({ stockId: +stockId, type, qty: +qty, note })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} style={{ maxWidth: 460 }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{lbl('Voorraadbeweging', 'Stock movement')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Type toggle */}
            <div className={mvStyles.typeToggle}>
              <button type="button"
                className={`${mvStyles.typeBtn} ${type === 'in' ? mvStyles.typeBtnIn : ''}`}
                onClick={() => setType('in')}>
                <ArrowDown size={16} /> {lbl('Inkomend', 'Stock in')}
              </button>
              <button type="button"
                className={`${mvStyles.typeBtn} ${type === 'out' ? mvStyles.typeBtnOut : ''}`}
                onClick={() => setType('out')}>
                <ArrowUp size={16} /> {lbl('Uitgaand', 'Stock out')}
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.lbl}>{lbl('Artikel', 'Item')}</label>
              <select className={styles.select} value={stockId} onChange={e => { setStockId(e.target.value); setError('') }}>
                <option value="">— {lbl('Selecteer', 'Select')} —</option>
                {stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.quantity} {s.unit})</option>)}
              </select>
            </div>

            {item && (
              <div className={mvStyles.currentStock}>
                <span className={mvStyles.currentLabel}>{lbl('Huidig','Current')}</span>
                <span className={mvStyles.currentValue}>{item.quantity} {item.unit}</span>
                <span className={mvStyles.currentLabel}>→</span>
                <span className={mvStyles.currentNew} style={{ color: type === 'in' ? '#2E7D32' : '#C8102E' }}>
                  {type === 'in' ? item.quantity + +qty : Math.max(0, item.quantity - +qty)} {item.unit}
                </span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.lbl}>{lbl('Hoeveelheid', 'Quantity')}</label>
              <input type="number" min="1" className={styles.input} value={qty}
                onChange={e => { setQty(e.target.value); setError('') }} />
            </div>

            <div className={styles.field}>
              <label className={styles.lbl}>{lbl('Reden / notitie', 'Reason / note')}</label>
              <textarea className={styles.textarea} rows={3} value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={lbl('Project, reden…', 'Project, reason…')} />
            </div>

            {error && <div className={mvStyles.errorMsg}>{error}</div>}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={`${styles.saveBtn} ${type === 'out' ? mvStyles.saveBtnOut : ''}`}>
              {type === 'in' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              {type === 'in' ? lbl('Inboeken','Book in') : lbl('Uitboeken','Book out')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}