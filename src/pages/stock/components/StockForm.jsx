import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import styles from './SlideForm.module.css'

const CATEGORIES = ['bouwmaterialen','isolatie','elektra','sanitair','afwerking','veiligheid','overig']
const UNITS = ['stuk','meter','m²','m³','kg','liter','zak','rol','plaat','tube','doos','pallet']

const EMPTY = {
  name: '', sku: '', category: 'bouwmaterialen', unit: 'stuk',
  quantity: 0, minStock: 5, maxStock: 50, location: '',
  supplierId: '', supplierName: '', purchasePrice: '', description: '', active: true,
}

export default function StockForm({ item, suppliers, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => { setData(item ? { ...EMPTY, ...item } : EMPTY) }, [item])

  function set(k, v) { setData(d => ({ ...d, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: false })) }

  function handleSupplier(id) {
    const s = suppliers.find(s => String(s.id) === id)
    setData(d => ({ ...d, supplierId: id, supplierName: s ? s.name : '' }))
  }

  function validate() {
    const e = {}
    if (!data.name.trim()) e.name = true
    if (!data.sku.trim())  e.sku  = true
    if (!data.location.trim()) e.location = true
    setErrors(e); return Object.keys(e).length === 0
  }

  function handleSubmit(e) { e.preventDefault(); if (!validate()) return; onSave(data) }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>{item ? lbl('Artikel bewerken','Edit item') : lbl('Artikel toevoegen','Add item')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <Section label={lbl('Identificatie','Identification')}>
              <Field label={lbl('Naam','Name')} req error={errors.name} hint={lbl('Verplicht','Required')}>
                <input className={`${styles.input} ${errors.name ? styles.err : ''}`} value={data.name} onChange={e => set('name', e.target.value)} placeholder="Cementmortel 25kg…" />
              </Field>
              <div className={styles.row}>
                <Field label="SKU" req error={errors.sku} hint={lbl('Verplicht','Required')}>
                  <input className={`${styles.input} ${errors.sku ? styles.err : ''}`} value={data.sku} onChange={e => set('sku', e.target.value)} placeholder="MAT-CEM-001" />
                </Field>
                <Field label={lbl('Categorie','Category')}>
                  <select className={styles.select} value={data.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={lbl('Omschrijving','Description')}>
                <textarea className={styles.textarea} rows={2} value={data.description} onChange={e => set('description', e.target.value)} />
              </Field>
            </Section>

            <Section label={lbl('Voorraad','Stock')}>
              <div className={styles.row}>
                <Field label={lbl('Eenheid','Unit')}>
                  <select className={styles.select} value={data.unit} onChange={e => set('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label={lbl('Huidige voorraad','Current stock')}>
                  <input type="number" min="0" className={styles.input} value={data.quantity} onChange={e => set('quantity', +e.target.value)} />
                </Field>
              </div>
              <div className={styles.row}>
                <Field label={lbl('Minimum stock','Min stock')}>
                  <input type="number" min="0" className={styles.input} value={data.minStock} onChange={e => set('minStock', +e.target.value)} />
                </Field>
                <Field label={lbl('Maximum stock','Max stock')}>
                  <input type="number" min="0" className={styles.input} value={data.maxStock} onChange={e => set('maxStock', +e.target.value)} />
                </Field>
              </div>
              <Field label={lbl('Opslaglocatie','Storage location')} req error={errors.location} hint={lbl('Verplicht','Required')}>
                <input className={`${styles.input} ${errors.location ? styles.err : ''}`} value={data.location} onChange={e => set('location', e.target.value)} placeholder="Magazijn A - Rek 1" />
              </Field>
            </Section>

            <Section label={lbl('Leverancier & Prijs','Supplier & Price')}>
              <Field label={lbl('Leverancier','Supplier')}>
                <select className={styles.select} value={data.supplierId} onChange={e => handleSupplier(e.target.value)}>
                  <option value="">— {lbl('Selecteer','Select')} —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label={lbl('Inkoopprijs (€)','Purchase price (€)')}>
                <div className={styles.prefixWrap}>
                  <span className={styles.prefix}>€</span>
                  <input type="number" min="0" step="0.01" className={`${styles.input} ${styles.inputPfx}`} value={data.purchasePrice} onChange={e => set('purchasePrice', +e.target.value)} />
                </div>
              </Field>
            </Section>

          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
            <button type="submit" className={styles.saveBtn}><ChevronRight size={14} />{item ? lbl('Bijwerken','Update') : lbl('Opslaan','Save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return <div className={styles.section}><p className={styles.sectionLbl}>{label}</p>{children}</div>
}
function Field({ label, req, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.lbl}>{label}{req && <span className={styles.req}>*</span>}</label>
      {children}
      {error && hint && <span className={styles.errMsg}>{hint}</span>}
    </div>
  )
}