import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Trash2, Pencil, Building2,
  User, Landmark, Phone, Mail, MapPin, Filter
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { dutchCities } from '../../data/dutchCities'
import { api } from '../../api/client'
import ClientForm from './ClientForm'
import styles from './ClientsPage.module.css'

const STATUS_COLORS = {
  active:   { bg: '#E8F5E9', color: '#2E7D32' },
  inactive: { bg: '#FFF3E0', color: '#E65100' },
  prospect: { bg: '#E3F2FD', color: '#1565C0' },
}

const TYPE_ICONS = {
  individual:   User,
  company:      Building2,
  organisation: Landmark,
}

// API (snake_case) → UI (camelCase)
function fromApi(row) {
  return {
    id:               row.id,
    type:             row.type,
    subtype:          row.subtype || '',
    firstName:        row.first_name || '',
    lastName:         row.last_name || '',
    companyName:      row.company_name || '',
    address:          row.address || '',
    postalCode:       row.postal_code || '',
    city:             row.city || '',
    phone1:           row.phone1 || '',
    phone2:           row.phone2 || '',
    email:            row.email || '',
    website:          row.website || '',
    kvk:              row.kvk || '',
    vatNumber:        row.vat_number || '',
    contactPerson:    row.contact_person || '',
    preferredContact: row.preferred_contact || 'email',
    status:           row.status || 'active',
    notes:            row.notes || '',
    createdAt:        row.created_at ? row.created_at.slice(0, 10) : '',
  }
}

// UI (camelCase) → API (camelCase — le backend attend ça)
function toApi(data) {
  return {
    type:             data.type,
    subtype:          data.subtype || null,
    firstName:        data.firstName || null,
    lastName:         data.lastName || null,
    companyName:      data.companyName || null,
    address:          data.address || null,
    postalCode:       data.postalCode || null,
    city:             data.city || null,
    phone1:           data.phone1 || null,
    phone2:           data.phone2 || null,
    email:            data.email || null,
    website:          data.website || null,
    kvk:              data.kvk || null,
    vatNumber:        data.vatNumber || null,
    contactPerson:    data.contactPerson || null,
    preferredContact: data.preferredContact || 'email',
    status:           data.status || 'active',
    notes:            data.notes || null,
  }
}

export default function ClientsPage() {
  const { t } = useLang()
  const c = t.clients

  const [clients, setClients]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [search, setSearch]               = useState('')
  const [filterType, setFilterType]       = useState('')
  const [filterCity, setFilterCity]       = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [formOpen, setFormOpen]           = useState(false)
  const [editTarget, setEditTarget]       = useState(null)
  const [deleteId, setDeleteId]           = useState(null)
  const [saving, setSaving]               = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await api.get('/clients')
      setClients(rows.map(fromApi))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(cl => {
      const name = `${cl.firstName} ${cl.lastName} ${cl.companyName}`.toLowerCase()
      if (q && !name.includes(q) && !cl.email.toLowerCase().includes(q) && !cl.city.toLowerCase().includes(q)) return false
      if (filterType && cl.type !== filterType) return false
      if (filterCity && cl.city !== filterCity) return false
      if (filterStatus && cl.status !== filterStatus) return false
      return true
    })
  }, [clients, search, filterType, filterCity, filterStatus])

  const stats = useMemo(() => ({
    total:    clients.length,
    active:   clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    prospect: clients.filter(c => c.status === 'prospect').length,
  }), [clients])

  function openAdd() { setEditTarget(null); setFormOpen(true) }
  function openEdit(cl) { setEditTarget(cl); setFormOpen(true) }
  function closeForm() { setFormOpen(false); setEditTarget(null) }

  async function handleSave(data) {
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await api.put(`/clients/${editTarget.id}`, toApi(data))
        setClients(cs => cs.map(c => c.id === editTarget.id ? fromApi(updated) : c))
      } else {
        const created = await api.post('/clients', toApi(data))
        setClients(cs => [fromApi(created), ...cs])
      }
      closeForm()
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/clients/${id}`)
      setClients(cs => cs.filter(c => c.id !== id))
      setDeleteId(null)
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  function displayName(cl) {
    if (cl.type === 'individual') return `${cl.firstName} ${cl.lastName}`
    return cl.companyName || `${cl.firstName} ${cl.lastName}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{c.title}</h1>
          <p className={styles.pageSubtitle}>{c.subtitle}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <Plus size={16} />
          {c.addClient}
        </button>
      </div>

      <div className={styles.statsRow}>
        <StatCard label={c.total}    value={stats.total}    accent="blue" />
        <StatCard label={c.active}   value={stats.active}   accent="green" />
        <StatCard label={c.inactive} value={stats.inactive} accent="orange" />
        <StatCard label="Prospect"   value={stats.prospect} accent="sky" />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={c.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-400, var(--grey-300))' }} />
          <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">{c.filterType}</option>
            {Object.entries(t.clients.types).map(([k,v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Alle statussen</option>
            {Object.entries(t.clients.statuses).map(([k,v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select className={styles.filterSelect} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            <option value="">{c.filterCity}</option>
            {dutchCities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Laden…</p>
          </div>
        ) : error ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Fout: {error}</p>
            <button className={styles.addBtn} onClick={load} style={{ marginTop: 12 }}>
              Opnieuw proberen
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{c.noResults}</p>
            <p className={styles.emptyHint}>{c.noResultsHint}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Naam</th>
                <th>Type</th>
                <th>Categorie</th>
                <th><Phone size={12} style={{verticalAlign:'middle',marginRight:4}} />Contact</th>
                <th><MapPin size={12} style={{verticalAlign:'middle',marginRight:4}} />Stad</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(cl => {
                const Icon = TYPE_ICONS[cl.type] || User
                const statusStyle = STATUS_COLORS[cl.status] || {}
                return (
                  <tr key={cl.id} className={styles.row}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className={styles.clientName}>{displayName(cl)}</div>
                          <div className={styles.clientEmail}>
                            <Mail size={10} style={{marginRight:3}} />
                            {cl.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.typeTag}>
                        {t.clients.types[cl.type]}
                      </span>
                    </td>
                    <td>{cl.subtype ? t.clients.subtypes[cl.subtype] || cl.subtype : '—'}</td>
                    <td className={styles.phoneCell}>{cl.phone1}</td>
                    <td>{cl.city || '—'}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {t.clients.statuses[cl.status]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => openEdit(cl)} title={c.edit}>
                          <Pencil size={14} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnRed}`}
                          onClick={() => setDeleteId(cl.id)}
                          title={c.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.tableFooter}>
        {filtered.length} / {clients.length} klanten
      </div>

      {formOpen && (
        <ClientForm
          client={editTarget}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}

      {deleteId !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>{c.confirmDelete}</h3>
            <p className={styles.modalMsg}>{c.confirmDeleteMsg}</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>
                {c.cancel}
              </button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(deleteId)}>
                {c.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`${styles.statCard} ${styles['accent_' + accent]}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}