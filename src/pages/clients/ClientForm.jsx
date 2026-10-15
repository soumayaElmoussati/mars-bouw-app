import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { dutchCities } from '../../data/dutchCities'
import styles from './ClientForm.module.css'

const EMPTY = {
  type: 'company',
  subtype: 'restaurant',
  firstName: '',
  lastName: '',
  companyName: '',
  address: '',
  postalCode: '',
  city: '',
  phone1: '',
  phone2: '',
  email: '',
  website: '',
  kvk: '',
  vatNumber: '',
  contactPerson: '',
  preferredContact: 'email',
  status: 'active',
  notes: '',
}

export default function ClientForm({ client, onSave, onClose, saving }) {
  const { t } = useLang()
  const f = t.clients.form
  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (client) setData({ ...EMPTY, ...client })
    else setData(EMPTY)
  }, [client])

  function set(key, val) {
    setData(d => ({ ...d, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }))
  }

  function validate() {
    const e = {}
    if (!data.firstName.trim() && data.type === 'individual') e.firstName = true
    if (!data.lastName.trim() && data.type === 'individual') e.lastName = true
    if (!data.companyName.trim() && data.type !== 'individual') e.companyName = true
    if (!data.address.trim()) e.address = true
    if (!data.postalCode.trim()) e.postalCode = true
    if (!data.city) e.city = true
    if (!data.phone1.trim()) e.phone1 = true
    if (!data.email.trim()) e.email = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave(data)
  }

  const isCompanyLike = data.type !== 'individual'

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {client ? f.title_edit : f.title_add}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            <Section label={f.section_identity}>
              <div className={styles.row}>
                <Field label={f.type} required>
                  <select
                    className={styles.select}
                    value={data.type}
                    onChange={e => set('type', e.target.value)}
                  >
                    {Object.entries(t.clients.types).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>

                {isCompanyLike && (
                  <Field label={f.subtype}>
                    <select
                      className={styles.select}
                      value={data.subtype}
                      onChange={e => set('subtype', e.target.value)}
                    >
                      {Object.entries(t.clients.subtypes).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>

              {isCompanyLike ? (
                <Field label={f.companyName} required error={errors.companyName} hint={f.required}>
                  <input
                    className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
                    value={data.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    placeholder="Bedrijfsnaam BV"
                  />
                </Field>
              ) : null}

              <div className={styles.row}>
                <Field label={f.firstName} required={!isCompanyLike} error={errors.firstName} hint={f.required}>
                  <input
                    className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                    value={data.firstName}
                    onChange={e => set('firstName', e.target.value)}
                  />
                </Field>
                <Field label={f.lastName} required={!isCompanyLike} error={errors.lastName} hint={f.required}>
                  <input
                    className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                    value={data.lastName}
                    onChange={e => set('lastName', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section label={f.section_contact}>
              <Field label={f.address} required error={errors.address} hint={f.required}>
                <input
                  className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                  value={data.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Straatnaam 1"
                />
              </Field>

              <div className={styles.row}>
                <Field label={f.postalCode} required error={errors.postalCode} hint={f.required} small>
                  <input
                    className={`${styles.input} ${errors.postalCode ? styles.inputError : ''}`}
                    value={data.postalCode}
                    onChange={e => set('postalCode', e.target.value)}
                    placeholder="1234 AB"
                    maxLength={7}
                  />
                </Field>
                <Field label={f.city} required error={errors.city} hint={f.required}>
                  <select
                    className={`${styles.select} ${errors.city ? styles.inputError : ''}`}
                    value={data.city}
                    onChange={e => set('city', e.target.value)}
                  >
                    <option value="">— {f.city} —</option>
                    {dutchCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <div className={styles.row}>
                <Field label={f.phone1} required error={errors.phone1} hint={f.required}>
                  <input
                    className={`${styles.input} ${errors.phone1 ? styles.inputError : ''}`}
                    value={data.phone1}
                    onChange={e => set('phone1', e.target.value)}
                    placeholder="+31 6 12 34 56 78"
                  />
                </Field>
                <Field label={f.phone2}>
                  <input
                    className={styles.input}
                    value={data.phone2}
                    onChange={e => set('phone2', e.target.value)}
                    placeholder="+31 20 123 4567"
                  />
                </Field>
              </div>

              <div className={styles.row}>
                <Field label={f.email} required error={errors.email} hint={f.required}>
                  <input
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    value={data.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="naam@bedrijf.nl"
                  />
                </Field>
                <Field label={f.website}>
                  <input
                    className={styles.input}
                    value={data.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="www.bedrijf.nl"
                  />
                </Field>
              </div>

              <div className={styles.row}>
                <Field label={f.contactPerson}>
                  <input
                    className={styles.input}
                    value={data.contactPerson}
                    onChange={e => set('contactPerson', e.target.value)}
                  />
                </Field>
                <Field label={f.preferredContact}>
                  <select
                    className={styles.select}
                    value={data.preferredContact}
                    onChange={e => set('preferredContact', e.target.value)}
                  >
                    {Object.entries(t.clients.contactMethods).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            {isCompanyLike && (
              <Section label={f.section_business}>
                <div className={styles.row}>
                  <Field label={f.kvk}>
                    <input
                      className={styles.input}
                      value={data.kvk}
                      onChange={e => set('kvk', e.target.value)}
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </Field>
                  <Field label={f.vatNumber}>
                    <input
                      className={styles.input}
                      value={data.vatNumber}
                      onChange={e => set('vatNumber', e.target.value)}
                      placeholder="NL123456789B01"
                    />
                  </Field>
                </div>
              </Section>
            )}

            <Section label={f.section_other}>
              <Field label={f.status}>
                <div className={styles.radioGroup}>
                  {Object.entries(t.clients.statuses).map(([k, v]) => (
                    <label key={k} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="status"
                        value={k}
                        checked={data.status === k}
                        onChange={() => set('status', k)}
                        className={styles.radio}
                      />
                      <span className={`${styles.radioPill} ${styles['status_' + k]}`}>{v}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label={f.notes}>
                <textarea
                  className={styles.textarea}
                  value={data.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={4}
                  placeholder="…"
                />
              </Field>
            </Section>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {f.cancel}
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              <ChevronRight size={15} />
              {saving ? '…' : (client ? f.update : f.save)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{label}</p>
      {children}
    </div>
  )
}

function Field({ label, required, error, hint, small, children }) {
  return (
    <div className={`${styles.field} ${small ? styles.fieldSmall : ''}`}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.asterisk}>*</span>}
      </label>
      {children}
      {error && hint && <span className={styles.errorMsg}>{hint}</span>}
    </div>
  )
}