import { useState, useMemo } from 'react'
import { Plus, FileText, Receipt, TrendingDown, Euro, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { offertesSeed, factuurSeed, uitgavenSeed } from '../../data/financeSeed'
import OfferteList from './components/OfferteList'
import OfferteForm from './components/OfferteForm'
import FactuurList from './components/FactuurList'
import FactuurForm from './components/FactuurForm'
import UitgavenList from './components/UitgavenList'
import UitgavenForm from './components/UitgavenForm'
import styles from './FinancePage.module.css'

const TABS = ['offertes', 'facturen', 'uitgaven']

function calcTotal(lines) {
  return lines.reduce((s, l) => s + (l.qty * l.unitPrice), 0)
}
function calcBtw(lines) {
  return lines.reduce((s, l) => s + (l.qty * l.unitPrice * l.btw / 100), 0)
}
function calcTotalIncl(lines) { return calcTotal(lines) + calcBtw(lines) }

export default function FinancePage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [offertes, setOffertes]   = useState(offertesSeed)
  const [facturen, setFacturen]   = useState(factuurSeed)
  const [uitgaven, setUitgaven]   = useState(uitgavenSeed)
  const [activeTab, setActiveTab] = useState('offertes')
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Forms
  const [offerteForm, setOfferteForm] = useState(null)
  const [factuurForm, setFactuurForm] = useState(null)
  const [uitgaafForm, setUitgaafForm] = useState(null)

  // Stats
  const stats = useMemo(() => {
    const openOffertes  = offertes.filter(o => o.status === 'verzonden').length
    const totalFacturen = facturen.reduce((s, f) => s + calcTotalIncl(f.lines), 0)
    const openFacturen  = facturen.filter(f => f.status === 'openstaand' || f.status === 'gedeeltelijk')
      .reduce((s, f) => {
        const paid = f.payments?.reduce((ps, p) => ps + p.amount, 0) || 0
        return s + (calcTotalIncl(f.lines) - paid)
      }, 0)
    const totalUitgaven = uitgaven.reduce((s, u) => s + u.amount, 0)
    const result        = totalFacturen - totalUitgaven
    return { openOffertes, totalFacturen, openFacturen, totalUitgaven, result }
  }, [offertes, facturen, uitgaven])

  // CRUD helpers
  function saveOfferte(data) {
    if (data.id) setOffertes(os => os.map(o => o.id === data.id ? data : o))
    else {
      const id = Math.max(0, ...offertes.map(o => o.id)) + 1
      const num = `MB-${new Date().getFullYear()}-${String(id).padStart(3,'0')}`
      setOffertes(os => [...os, { ...data, id, offerteNumber: num, convertedToInvoice: false }])
    }
    setOfferteForm(null)
  }

  function convertToFactuur(offerte) {
    const id  = Math.max(0, ...facturen.map(f => f.id)) + 1
    const num = `F-${137 + id}`
    const newF = {
      id, factuurNumber: num, offerteId: offerte.id,
      clientName: offerte.clientName, clientAddress: offerte.clientAddress,
      date: new Date().toISOString().slice(0,10),
      dueDate: '', status: 'openstaand',
      projectName: offerte.projectName,
      lines: offerte.lines.map(l => ({ ...l })),
      notes: offerte.notes,
      payments: [],
    }
    setFacturen(fs => [...fs, newF])
    setOffertes(os => os.map(o => o.id === offerte.id ? { ...o, convertedToInvoice: true, status: 'goedgekeurd' } : o))
  }

  function saveFactuur(data) {
    if (data.id) setFacturen(fs => fs.map(f => f.id === data.id ? data : f))
    else {
      const id  = Math.max(0, ...facturen.map(f => f.id)) + 1
      const num = `F-${137 + id}`
      setFacturen(fs => [...fs, { ...data, id, factuurNumber: num }])
    }
    setFactuurForm(null)
  }

  function addPayment(factuurId, payment) {
    setFacturen(fs => fs.map(f => {
      if (f.id !== factuurId) return f
      const payments = [...(f.payments || []), { ...payment, id: Date.now() }]
      const total = calcTotalIncl(f.lines)
      const paid  = payments.reduce((s, p) => s + p.amount, 0)
      const status = paid >= total ? 'betaald' : paid > 0 ? 'gedeeltelijk' : 'openstaand'
      return { ...f, payments, status }
    }))
  }

  function saveUitgaaf(data) {
    if (data.id) setUitgaven(us => us.map(u => u.id === data.id ? data : u))
    else {
      const id = Math.max(0, ...uitgaven.map(u => u.id)) + 1
      setUitgaven(us => [...us, { ...data, id }])
    }
    setUitgaafForm(null)
  }

  function deleteOfferte(id)  { setOffertes(os => os.filter(o => o.id !== id)) }
  function deleteFactuur(id)  { setFacturen(fs => fs.filter(f => f.id !== id)) }
  function deleteUitgaaf(id)  { setUitgaven(us => us.filter(u => u.id !== id)) }

  const TAB_LABELS = {
    offertes: { nl: 'Offertes',  en: 'Quotes' },
    facturen: { nl: 'Facturen',  en: 'Invoices' },
    uitgaven: { nl: 'Uitgaven',  en: 'Expenses' },
  }

  const fmtEur = n => '€ ' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })

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
              <Plus size={15} /> {lbl('Nieuwe offerte', 'New quote')}
            </button>
          )}
          {activeTab === 'facturen' && (
            <button className={styles.addBtn} onClick={() => setFactuurForm('new')}>
              <Plus size={15} /> {lbl('Nieuwe factuur', 'New invoice')}
            </button>
          )}
          {activeTab === 'uitgaven' && (
            <button className={styles.addBtn} onClick={() => setUitgaafForm('new')}>
              <Plus size={15} /> {lbl('Nieuwe uitgave', 'New expense')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard icon={FileText}    label={lbl('Open offertes','Open quotes')}    value={stats.openOffertes}              color="sky" />
        <StatCard icon={Euro}        label={lbl('Totaal gefactureerd','Invoiced')} value={fmtEur(stats.totalFacturen)}     color="blue" />
        <StatCard icon={AlertTriangle} label={lbl('Openstaand','Outstanding')}     value={fmtEur(stats.openFacturen)}      color="orange" alert={stats.openFacturen > 0} />
        <StatCard icon={TrendingDown} label={lbl('Uitgaven','Expenses')}           value={fmtEur(stats.totalUitgaven)}     color="red" />
        <StatCard icon={CheckCircle} label={lbl('Resultaat','Result')}             value={fmtEur(stats.result)}            color={stats.result >= 0 ? 'green' : 'red'} wide />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
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
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">{lbl('Alle statussen','All statuses')}</option>
          {activeTab === 'offertes' && ['concept','verzonden','goedgekeurd','afgewezen','verlopen'].map(s => <option key={s} value={s}>{s}</option>)}
          {activeTab === 'facturen' && ['openstaand','gedeeltelijk','betaald','vervallen'].map(s => <option key={s} value={s}>{s}</option>)}
          {activeTab === 'uitgaven' && ['betaald','te_betalen','besteld'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {activeTab === 'offertes' && (
        <OfferteList offertes={offertes} search={search} filterStatus={filterStatus} lang={lang}
          onEdit={o => setOfferteForm(o)}
          onDelete={deleteOfferte}
          onConvert={convertToFactuur}
          calcTotal={calcTotal} calcTotalIncl={calcTotalIncl} />
      )}
      {activeTab === 'facturen' && (
        <FactuurList facturen={facturen} search={search} filterStatus={filterStatus} lang={lang}
          onEdit={f => setFactuurForm(f)}
          onDelete={deleteFactuur}
          onPayment={addPayment}
          calcTotal={calcTotal} calcTotalIncl={calcTotalIncl} />
      )}
      {activeTab === 'uitgaven' && (
        <UitgavenList uitgaven={uitgaven} search={search} filterStatus={filterStatus} lang={lang}
          onEdit={u => setUitgaafForm(u)}
          onDelete={deleteUitgaaf} />
      )}

      {/* Forms */}
      {offerteForm && (
        <OfferteForm offerte={offerteForm === 'new' ? null : offerteForm} lang={lang}
          onSave={saveOfferte} onClose={() => setOfferteForm(null)} />
      )}
      {factuurForm && (
        <FactuurForm factuur={factuurForm === 'new' ? null : factuurForm} lang={lang}
          onSave={saveFactuur} onClose={() => setFactuurForm(null)} />
      )}
      {uitgaafForm && (
        <UitgavenForm uitgaaf={uitgaafForm === 'new' ? null : uitgaafForm} lang={lang}
          onSave={saveUitgaaf} onClose={() => setUitgaafForm(null)} />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, alert, wide }) {
  return (
    <div className={`${styles.statCard} ${styles['color_'+color]} ${wide ? styles.statWide : ''} ${alert ? styles.statAlert : ''}`}>
      <div className={styles.statIcon}><Icon size={16} /></div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  )
}