import { useState, useMemo, useEffect } from 'react'
import { Plus, FileText, TrendingDown, Euro, AlertTriangle, CheckCircle } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import OfferteList from './components/OfferteList'
import OfferteForm from './components/OfferteForm'
import FactuurList from './components/FactuurList'
import FactuurForm from './components/FactuurForm'
import UitgavenList from './components/UitgavenList'
import UitgavenForm from './components/UitgavenForm'
import styles from './FinancePage.module.css'

const TABS = ['offertes', 'facturen', 'uitgaven']

// These calc helpers are still used by child components via props
function calcTotal(lines) {
  return (lines || []).reduce((s, l) => s + (+(l.qty || l.quantity || 0) * +(l.unit_price || l.unitPrice || 0)), 0)
}
function calcBtw(lines) {
  return (lines || []).reduce((s, l) => s + (+(l.qty || l.quantity || 0) * +(l.unit_price || l.unitPrice || 0) * +(l.btw || 0) / 100), 0)
}
function calcTotalIncl(lines) { return calcTotal(lines) + calcBtw(lines) }

export default function FinancePage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [offertes,  setOffertes]  = useState([])
  const [facturen,  setFacturen]  = useState([])
  const [uitgaven,  setUitgaven]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('offertes')
  const [search,    setSearch]    = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Forms
  const [offerteForm, setOfferteForm] = useState(null)
  const [factuurForm, setFactuurForm] = useState(null)
  const [uitgaafForm, setUitgaafForm] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [o, f, u] = await Promise.all([
        api.get('/finance/offertes'),
        api.get('/finance/facturen'),
        api.get('/finance/uitgaven'),
      ])
      setOffertes(o); setFacturen(f); setUitgaven(u)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Offerte CRUD ───────────────────────────────────────────────────────────
  async function saveOfferte(data) {
    try {
      const payload = toOffertePayload(data)
      if (data.id) {
        const updated = await api.put(`/finance/offertes/${data.id}`, payload)
        setOffertes(os => os.map(o => o.id === data.id ? updated : o))
      } else {
        const created = await api.post('/finance/offertes', payload)
        setOffertes(os => [created, ...os])
      }
      setOfferteForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteOfferte(id) {
    try {
      await api.delete(`/finance/offertes/${id}`)
      setOffertes(os => os.filter(o => o.id !== id))
    } catch (e) { alert(e.message) }
  }

  async function convertToFactuur(offerte) {
    try {
      const payload = {
        offerteId:    offerte.id,
        clientName:   offerte.client_name || offerte.clientName || '',
        clientAddress:offerte.client_address || offerte.clientAddress || '',
        date:         new Date().toISOString().slice(0, 10),
        dueDate:      '',
        projectName:  offerte.project_name || offerte.projectName || '',
        notes:        offerte.notes || '',
        lines: (offerte.lines || []).map(l => ({
          description: l.description || '',
          qty:         l.qty || 1,
          unit:        l.unit || 'stuk',
          unitPrice:   l.unit_price || l.unitPrice || 0,
          btw:         l.btw || 21,
          sortOrder:   l.sort_order || l.sortOrder || 0,
        })),
      }
      const created = await api.post('/finance/facturen', payload)
      setFacturen(fs => [{ ...created, lines: created.lines || [], payments: [] }, ...fs])
      // Mark offerte as converted
      const updated = await api.put(`/finance/offertes/${offerte.id}`, {
        ...toOffertePayload(offerte), status: 'goedgekeurd', convertedToInvoice: true,
      })
      setOffertes(os => os.map(o => o.id === offerte.id ? updated : o))
      setActiveTab('facturen')
    } catch (e) { alert(e.message) }
  }

  // ── Factuur CRUD ───────────────────────────────────────────────────────────
  async function saveFactuur(data) {
    try {
      const payload = toFactuurPayload(data)
      if (data.id) {
        const updated = await api.put(`/finance/facturen/${data.id}`, payload)
        setFacturen(fs => fs.map(f => f.id === data.id ? { ...updated, payments: f.payments || [] } : f))
      } else {
        const created = await api.post('/finance/facturen', payload)
        setFacturen(fs => [{ ...created, payments: [] }, ...fs])
      }
      setFactuurForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteFactuur(id) {
    // No delete endpoint in original — soft remove locally
    try {
      setFacturen(fs => fs.filter(f => f.id !== id))
    } catch (e) { alert(e.message) }
  }

  async function addPayment(factuurId, payment) {
    try {
      const res = await api.post(`/finance/facturen/${factuurId}/payments`, {
        date: payment.date,
        amount: payment.amount,
        method: payment.method || 'overschrijving',
        note: payment.note || '',
      })
      setFacturen(fs => fs.map(f => {
        if (f.id !== factuurId) return f
        return {
          ...f,
          status:   res.factuurStatus || f.status,
          payments: [...(f.payments || []), res.payment],
        }
      }))
    } catch (e) { alert(e.message) }
  }

  // ── Uitgaven CRUD ──────────────────────────────────────────────────────────
  async function saveUitgaaf(data) {
    try {
      const payload = toUitgaafPayload(data)
      if (data.id) {
        const updated = await api.put(`/finance/uitgaven/${data.id}`, payload)
        setUitgaven(us => us.map(u => u.id === data.id ? updated : u))
      } else {
        const created = await api.post('/finance/uitgaven', payload)
        setUitgaven(us => [created, ...us])
      }
      setUitgaafForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteUitgaaf(id) {
    try {
      await api.delete(`/finance/uitgaven/${id}`)
      setUitgaven(us => us.filter(u => u.id !== id))
    } catch (e) { alert(e.message) }
  }

  // ── Payload mappers ────────────────────────────────────────────────────────
  function toOffertePayload(d) {
    return {
      clientName:    d.client_name    || d.clientName    || '',
      clientAddress: d.client_address || d.clientAddress || '',
      date:          d.date           || new Date().toISOString().slice(0, 10),
      validDays:     d.valid_days     || d.validDays     || 14,
      status:        d.status         || 'concept',
      projectName:   d.project_name   || d.projectName   || '',
      intro:         d.intro          || '',
      notes:         d.notes          || '',
      convertedToInvoice: d.converted_to_invoice || d.convertedToInvoice || false,
      lines: (d.lines || []).map((l, i) => ({
        section:     l.section     || '',
        description: l.description || '',
        qty:         l.qty         || 1,
        unit:        l.unit        || 'stuk',
        unitPrice:   l.unit_price  || l.unitPrice  || 0,
        btw:         l.btw         || 21,
        isOptional:  l.is_optional || l.isOptional || false,
        sortOrder:   l.sort_order  || l.sortOrder  || i,
      })),
      paymentTerms: (d.paymentTerms || d.payment_terms || []).map((t, i) => ({
        label:     t.label     || '',
        pct:       t.pct       || 0,
        sortOrder: t.sort_order || t.sortOrder || i,
      })),
    }
  }

  function toFactuurPayload(d) {
    return {
      offerteId:     d.offerte_id     || d.offerteId     || null,
      clientName:    d.client_name    || d.clientName    || '',
      clientAddress: d.client_address || d.clientAddress || '',
      date:          d.date           || new Date().toISOString().slice(0, 10),
      dueDate:       d.due_date       || d.dueDate       || null,
      status:        d.status         || 'openstaand',
      projectName:   d.project_name   || d.projectName   || '',
      notes:         d.notes          || '',
      lines: (d.lines || []).map((l, i) => ({
        description: l.description || '',
        qty:         l.qty         || 1,
        unit:        l.unit        || 'stuk',
        unitPrice:   l.unit_price  || l.unitPrice  || 0,
        btw:         l.btw         || 21,
        sortOrder:   l.sort_order  || l.sortOrder  || i,
      })),
    }
  }

  function toUitgaafPayload(d) {
    return {
      date:          d.date           || new Date().toISOString().slice(0, 10),
      description:   d.description    || '',
      category:      d.category       || 'overig',
      projectId:     d.project_id     || d.projectId     || null,
      projectName:   d.project_name   || d.projectName   || '',
      supplier:      d.supplier       || '',
      amount:        d.amount         || 0,
      btw:           d.btw            || 21,
      btwAmount:     d.btw_amount     || d.btwAmount     || 0,
      paymentMethod: d.payment_method || d.paymentMethod || 'pin',
      status:        d.status         || 'betaald',
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const openOffertes  = offertes.filter(o => o.status === 'verzonden').length
    const totalFacturen = facturen.reduce((s, f) => s + calcTotalIncl(f.lines || []), 0)
    const openFacturen  = facturen
      .filter(f => f.status === 'openstaand' || f.status === 'gedeeltelijk')
      .reduce((s, f) => {
        const paid = (f.payments || []).reduce((ps, p) => ps + +p.amount, 0)
        return s + (calcTotalIncl(f.lines || []) - paid)
      }, 0)
    const totalUitgaven = uitgaven.reduce((s, u) => s + +u.amount, 0)
    const result        = totalFacturen - totalUitgaven
    return { openOffertes, totalFacturen, openFacturen, totalUitgaven, result }
  }, [offertes, facturen, uitgaven])

  const fmtEur = n => '€ ' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

  const TAB_LABELS = {
    offertes: { nl: 'Offertes', en: 'Quotes'    },
    facturen: { nl: 'Facturen', en: 'Invoices'  },
    uitgaven: { nl: 'Uitgaven', en: 'Expenses'  },
  }

  if (loading) return (
    <div className={styles.page}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1A3E6F', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Financiën', 'Finance')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Offertes, facturen en uitgaven', 'Quotes, invoices and expenses')}</p>
        </div>
        <div className={styles.headerBtns}>
          {activeTab === 'offertes' && (
            <button className={styles.addBtn} onClick={() => setOfferteForm('new')}>
              <Plus size={15}/>{lbl('Nieuwe offerte', 'New quote')}
            </button>
          )}
          {activeTab === 'facturen' && (
            <button className={styles.addBtn} onClick={() => setFactuurForm('new')}>
              <Plus size={15}/>{lbl('Nieuwe factuur', 'New invoice')}
            </button>
          )}
          {activeTab === 'uitgaven' && (
            <button className={styles.addBtn} onClick={() => setUitgaafForm('new')}>
              <Plus size={15}/>{lbl('Nieuwe uitgave', 'New expense')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard icon={FileText}     label={lbl('Open offertes', 'Open quotes')}     value={stats.openOffertes}          color="sky"/>
        <StatCard icon={Euro}         label={lbl('Totaal gefactureerd', 'Invoiced')}  value={fmtEur(stats.totalFacturen)} color="blue"/>
        <StatCard icon={AlertTriangle}label={lbl('Openstaand', 'Outstanding')}        value={fmtEur(stats.openFacturen)}  color="orange" alert={stats.openFacturen > 0}/>
        <StatCard icon={TrendingDown} label={lbl('Uitgaven', 'Expenses')}             value={fmtEur(stats.totalUitgaven)} color="red"/>
        <StatCard icon={CheckCircle}  label={lbl('Resultaat', 'Result')}              value={fmtEur(stats.result)}        color={stats.result >= 0 ? 'green' : 'red'} wide/>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab(tab); setSearch(''); setFilterStatus('') }}>
            {lang === 'nl' ? TAB_LABELS[tab].nl : TAB_LABELS[tab].en}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input className={styles.searchInput}
            placeholder={lbl('Zoeken…', 'Search…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">{lbl('Alle statussen', 'All statuses')}</option>
          {activeTab === 'offertes' && ['concept','verzonden','goedgekeurd','afgewezen','verlopen'].map(s => <option key={s} value={s}>{s}</option>)}
          {activeTab === 'facturen' && ['openstaand','gedeeltelijk','betaald','vervallen'].map(s => <option key={s} value={s}>{s}</option>)}
          {activeTab === 'uitgaven' && ['betaald','te_betalen','besteld'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {activeTab === 'offertes' && (
        <OfferteList
          offertes={offertes}
          search={search}
          filterStatus={filterStatus}
          lang={lang}
          onEdit={o => setOfferteForm(o)}
          onDelete={deleteOfferte}
          onConvert={convertToFactuur}
          calcTotal={calcTotal}
          calcTotalIncl={calcTotalIncl}
        />
      )}
      {activeTab === 'facturen' && (
        <FactuurList
          facturen={facturen}
          search={search}
          filterStatus={filterStatus}
          lang={lang}
          onEdit={f => setFactuurForm(f)}
          onDelete={deleteFactuur}
          onPayment={addPayment}
          calcTotal={calcTotal}
          calcTotalIncl={calcTotalIncl}
        />
      )}
      {activeTab === 'uitgaven' && (
        <UitgavenList
          uitgaven={uitgaven}
          search={search}
          filterStatus={filterStatus}
          lang={lang}
          onEdit={u => setUitgaafForm(u)}
          onDelete={deleteUitgaaf}
        />
      )}

      {/* Forms */}
      {offerteForm && (
        <OfferteForm
          offerte={offerteForm === 'new' ? null : offerteForm}
          lang={lang}
          onSave={saveOfferte}
          onClose={() => setOfferteForm(null)}
        />
      )}
      {factuurForm && (
        <FactuurForm
          factuur={factuurForm === 'new' ? null : factuurForm}
          lang={lang}
          onSave={saveFactuur}
          onClose={() => setFactuurForm(null)}
        />
      )}
      {uitgaafForm && (
        <UitgavenForm
          uitgaaf={uitgaafForm === 'new' ? null : uitgaafForm}
          lang={lang}
          onSave={saveUitgaaf}
          onClose={() => setUitgaafForm(null)}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, alert, wide }) {
  return (
    <div className={`${styles.statCard} ${styles['color_' + color]} ${wide ? styles.statWide : ''} ${alert ? styles.statAlert : ''}`}>
      <div className={styles.statIcon}><Icon size={16}/></div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  )
}