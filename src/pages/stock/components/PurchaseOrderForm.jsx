import { useState, useEffect } from 'react'
import { X, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { projectsSeed } from '../../../data/projectsSeed'
import styles from './PurchaseOrderForm.module.css'

const EMPTY = {
  supplierName: '', supplierId: '',
  orderDate: new Date().toISOString().slice(0,10),
  expectedDate: '', projectId: '', projectName: '',
  status: 'besteld', notes: '', items: [],
}

export default function PurchaseOrderForm({ order, stock, suppliers, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => { setData(order ? { ...EMPTY, ...order } : EMPTY) }, [order])

  function set(k, v) { setData(d => ({ ...d, [k]: v })) }

  function handleSupplier(id) {
    const s = suppliers.find(s => String(s.id) === id)
    setData(d => ({ ...d, supplierId: id, supplierName: s ? s.name : '' }))
  }
  function handleProject(id) {
    const p = projectsSeed.find(p => String(p.id) === id)
    setData(d => ({ ...d, projectId: id, projectName: p ? p.name : '' }))
  }

  function addItem() {
    setData(d => ({ ...d, items: [...d.items, { stockId: '', name: '', quantity: 1, unit: 'stuk', unitPrice: 0, received: 0 }] }))
  }
  function setItem(i, k, v) {
    setData(d => {
      const items = [...d.items]
      items[i] = { ...items[i], [k]: v }
      if (k === 'stockId') {
        const s = stock.find(s => String(s.id) === v)
        if (s) { items[i].name = s.name; items[i].unit = s.unit; items[i].unitPrice = s.purchasePrice }
      }
      return { ...d, items }
    })
  }
  function removeItem(i) { setData(d => ({ ...d, items: d.items.filter((_, j) => j !== i) })) }

  const total = data.items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0)

  function validate() {
    const e = {}
    if (!data.supplierName) e.supplier = true
    if (!data.orderDate)    e.orderDate = true
    if (!data.expectedDate) e.expectedDate = true
    if (data.items.length === 0) e.items = true
    setErrors(e); return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave({ ...data, totalAmount: total })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>{order ? lbl('Order bewerken','Edit order') : lbl('Nieuwe bestelling','New purchase order')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <div className={styles.section}>
              <p className={styles.sectionLbl}>{lbl('Leverancier & Project','Supplier & Project')}</p>
              <div className={styles.field}>
                <label className={styles.lbl}>{lbl('Leverancier','Supplier')} <span className={styles.req}>*</span></label>
                <select className={styles.select} value={data.supplierId} onChange={e => handleSupplier(e.target.value)}>
                  <option value="">— {lbl('Selecteer','Select')} —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplier && <span className={styles.errMsg}>{lbl('Verplicht','Required')}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.lbl}>{lbl('Project','Project')}</label>
                <select className={styles.select} value={data.projectId} onChange={e => handleProject(e.target.value)}>
                  <option value="">— {lbl('Geen project','No project')} —</option>
                  {projectsSeed.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.lbl}>{lbl('Besteldatum','Order date')} <span className={styles.req}>*</span></label>
                  <input type="date" className={styles.input} value={data.orderDate} onChange={e => set('orderDate', e.target.value)} />
                  {errors.orderDate && <span className={styles.errMsg}>{lbl('Verplicht','Required')}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.lbl}>{lbl('Verwachte levering','Expected delivery')} <span className={styles.req}>*</span></label>
                  <input type="date" className={styles.input} value={data.expectedDate} onChange={e => set('expectedDate', e.target.value)} />
                  {errors.expectedDate && <span className={styles.errMsg}>{lbl('Verplicht','Required')}</span>}
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLbl}>{lbl('Artikelen','Items')}</p>
              {errors.items && <p className={styles.errMsg}>{lbl('Voeg minstens 1 artikel toe','Add at least 1 item')}</p>}
              {data.items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <select className={`${styles.select} ${styles.itemSelect}`} value={item.stockId} onChange={e => setItem(i, 'stockId', e.target.value)}>
                    <option value="">— {lbl('Artikel','Item')} —</option>
                    {stock.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="number" min="1" className={`${styles.input} ${styles.itemQty}`} value={item.quantity} onChange={e => setItem(i, 'quantity', +e.target.value)} placeholder="Qty" />
                  <div className={styles.prefixWrap}>
                    <span className={styles.prefix}>€</span>
                    <input type="number" min="0" step="0.01" className={`${styles.input} ${styles.inputPfx} ${styles.itemPrice}`} value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', +e.target.value)} />
                  </div>
                  <span className={styles.lineTotal}>€ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                  <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(i)}><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" className={styles.addItemBtn} onClick={addItem}>
                <Plus size={14} /> {lbl('Artikel toevoegen','Add item')}
              </button>
              {data.items.length > 0 && (
                <div className={styles.totalRow}>
                  <span className={styles.totalLbl}>{lbl('Totaal bestelling','Order total')}</span>
                  <span className={styles.totalAmt}>€ {total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLbl}>{lbl('Notities','Notes')}</p>
              <textarea className={styles.textarea} rows={3} value={data.notes} onChange={e => set('notes', e.target.value)} placeholder="…" />
            </div>

          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}>
              <ChevronRight size={14} />
              {order ? lbl('Bijwerken','Update') : lbl('Bestelling plaatsen','Place order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}