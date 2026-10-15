import { Plus, Trash2 } from 'lucide-react'
import styles from './LineEditor.module.css'

export default function LineEditor({ lines, onChange, lang, showSection = false }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  function setLine(i, k, v) {
    const updated = [...lines]
    updated[i] = { ...updated[i], [k]: v }
    onChange(updated)
  }
  function addLine() {
    onChange([...lines, { id: Date.now(), description: '', qty: 1, unit: 'stuk', unitPrice: 0, btw: 21, section: '' }])
  }
  function removeLine(i) { onChange(lines.filter((_, j) => j !== i)) }

  const total    = lines.reduce((s, l) => s + (l.qty * l.unitPrice), 0)
  const totalBtw = lines.reduce((s, l) => s + (l.qty * l.unitPrice * l.btw / 100), 0)

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {showSection && <th>{lbl('Sectie','Section')}</th>}
            <th>{lbl('Omschrijving','Description')}</th>
            <th>{lbl('Qty','Qty')}</th>
            <th>{lbl('Eenheid','Unit')}</th>
            <th>{lbl('Tarief','Rate')}</th>
            <th>{lbl('BTW%','VAT%')}</th>
            <th>{lbl('Subtotaal','Subtotal')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={line.id || i}>
              {showSection && (
                <td><input className={styles.inputSm} value={line.section||''} onChange={e => setLine(i,'section',e.target.value)} placeholder="Sectie…" /></td>
              )}
              <td><input className={`${styles.input} ${styles.inputDesc}`} value={line.description} onChange={e => setLine(i,'description',e.target.value)} placeholder={lbl('Omschrijving…','Description…')} /></td>
              <td><input type="number" min="0" className={styles.inputNum} value={line.qty} onChange={e => setLine(i,'qty',+e.target.value)} /></td>
              <td>
                <select className={styles.inputSm} value={line.unit} onChange={e => setLine(i,'unit',e.target.value)}>
                  {['stuk','uur','meter','m²','m³','forfait','kg','liter','dag'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </td>
              <td>
                <div className={styles.priceWrap}>
                  <span className={styles.prefix}>€</span>
                  <input type="number" min="0" step="0.01" className={`${styles.inputNum} ${styles.inputPrice}`} value={line.unitPrice} onChange={e => setLine(i,'unitPrice',+e.target.value)} />
                </div>
              </td>
              <td>
                <select className={styles.inputSm} value={line.btw} onChange={e => setLine(i,'btw',+e.target.value)}>
                  <option value={0}>0%</option>
                  <option value={9}>9%</option>
                  <option value={21}>21%</option>
                </select>
              </td>
              <td className={styles.subtotal}>€ {(line.qty * line.unitPrice).toLocaleString('nl-NL',{minimumFractionDigits:2})}</td>
              <td>
                <button type="button" className={styles.removeBtn} onClick={() => removeLine(i)}><Trash2 size={13}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className={styles.addBtn} onClick={addLine}>
        <Plus size={13} /> {lbl('Regel toevoegen','Add line')}
      </button>

      <div className={styles.totals}>
        <div className={styles.totalRow}><span>{lbl('Subtotaal excl. BTW','Subtotal excl. VAT')}</span><strong>€ {total.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
        <div className={styles.totalRow}><span>BTW</span><strong>€ {totalBtw.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
        <div className={`${styles.totalRow} ${styles.totalFinal}`}>
          <span>{lbl('Totaal incl. BTW','Total incl. VAT')}</span>
          <strong>€ {(total+totalBtw).toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong>
        </div>
      </div>
    </div>
  )
}