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

function g(o, camel, snake) { return o[camel] !== undefined ? o[camel] : o[snake] }

function calcTotal(lines) {
  return (lines||[]).reduce((s,l) => s + (+(l.qty||0) * +(l.unit_price||l.unitPrice||0)), 0)
}
function calcBtw(lines) {
  return (lines||[]).reduce((s,l) => s + (+(l.qty||0) * +(l.unit_price||l.unitPrice||0) * +(l.btw||0)/100), 0)
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
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')

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

  function clearPeriod() { setDateFrom(''); setDateTo('') }

  // ── Offerte CRUD ────────────────────────────────────────────────────────
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
    try { await api.delete(`/finance/offertes/${id}`); setOffertes(os => os.filter(o => o.id !== id)) }
    catch (e) { alert(e.message) }
  }

  async function convertToFactuur(offerte) {
    try {
      const payload = {
        offerteId:     offerte.id,
        clientName:    g(offerte,'clientName','client_name') || '',
        clientAddress: g(offerte,'clientAddress','client_address') || '',
        projectName:   g(offerte,'projectName','project_name') || '',
        notes:         offerte.notes || '',
        date:          new Date().toISOString().slice(0,10),
        status:        'openstaand',
        lines: (offerte.lines||[]).map(l => ({
          description: l.description||'', qty: l.qty||1, unit: l.unit||'stuk',
          unitPrice: l.unit_price||l.unitPrice||0, btw: l.btw||21, sortOrder: l.sort_order||l.sortOrder||0,
        })),
      }
      const created = await api.post('/finance/facturen', payload)
      setFacturen(fs => [{ ...created, lines: created.lines||[], payments:[] }, ...fs])
      const updated = await api.put(`/finance/offertes/${offerte.id}`, {
        ...toOffertePayload(offerte), status:'goedgekeurd', convertedToInvoice:true
      })
      setOffertes(os => os.map(o => o.id === offerte.id ? updated : o))
      setActiveTab('facturen')
    } catch (e) { alert(e.message) }
  }

  // ── Factuur CRUD ────────────────────────────────────────────────────────
  async function saveFactuur(data) {
    try {
      const payload = toFactuurPayload(data)
      if (data.id) {
        const updated = await api.put(`/finance/facturen/${data.id}`, payload)
        setFacturen(fs => fs.map(f => f.id === data.id ? { ...updated, payments: f.payments||[] } : f))
      } else {
        const created = await api.post('/finance/facturen', payload)
        setFacturen(fs => [{ ...created, payments:[] }, ...fs])
      }
      setFactuurForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteFactuur(id) {
    setFacturen(fs => fs.filter(f => f.id !== id))
  }

  async function addPayment(factuurId, payment) {
    try {
      const res = await api.post(`/finance/facturen/${factuurId}/payments`, {
        date: payment.date, amount: payment.amount,
        method: payment.method||'overschrijving', note: payment.note||'',
      })
      setFacturen(fs => fs.map(f => {
        if (f.id !== factuurId) return f
        return { ...f, status: res.factuurStatus||f.status, payments: [...(f.payments||[]), res.payment] }
      }))
    } catch (e) { alert(e.message) }
  }

  // ── Uitgaven CRUD ───────────────────────────────────────────────────────
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
    try { await api.delete(`/finance/uitgaven/${id}`); setUitgaven(us => us.filter(u => u.id !== id)) }
    catch (e) { alert(e.message) }
  }

  // ── Payload mappers ─────────────────────────────────────────────────────
  function toOffertePayload(d) {
    return {
      clientName:         g(d,'clientName','client_name')               || '',
      clientAddress:      g(d,'clientAddress','client_address')         || '',
      date:               d.date    || new Date().toISOString().slice(0,10),
      validDays:          g(d,'validDays','valid_days')                 || 14,
      status:             d.status  || 'concept',
      projectName:        g(d,'projectName','project_name')             || '',
      intro:              d.intro   || '',
      notes:              d.notes   || '',
      convertedToInvoice: g(d,'convertedToInvoice','converted_to_invoice') || false,
      lines: (d.lines||[]).map((l,i) => ({
        section: l.section||'', description: l.description||'',
        qty: l.qty||1, unit: l.unit||'stuk',
        unitPrice: l.unit_price||l.unitPrice||0, btw: l.btw||21,
        isOptional: l.is_optional||l.isOptional||false,
        sortOrder: l.sort_order||l.sortOrder||i,
      })),
    }
  }

  function toFactuurPayload(d) {
    return {
      offerteId:     g(d,'offerteId','offerte_id')       || null,
      clientName:    g(d,'clientName','client_name')      || '',
      clientAddress: g(d,'clientAddress','client_address')|| '',
      date:          d.date    || new Date().toISOString().slice(0,10),
      dueDate:       g(d,'dueDate','due_date')            || null,
      status:        d.status  || 'openstaand',
      projectName:   g(d,'projectName','project_name')    || '',
      notes:         d.notes   || '',
      lines: (d.lines||[]).map((l,i) => ({
        description: l.description||'', qty: l.qty||1, unit: l.unit||'stuk',
        unitPrice: l.unit_price||l.unitPrice||0, btw: l.btw||21,
        sortOrder: l.sort_order||l.sortOrder||i,
      })),
    }
  }

  function toUitgaafPayload(d) {
    return {
      date: d.date||new Date().toISOString().slice(0,10),
      description: d.description||'', category: d.category||'overig',
      projectId: g(d,'projectId','project_id')||null,
      projectName: g(d,'projectName','project_name')||'',
      supplier: d.supplier||'', amount: d.amount||0, btw: d.btw||21,
      btwAmount: g(d,'btwAmount','btw_amount')||0,
      paymentMethod: g(d,'paymentMethod','payment_method')||'pin',
      status: d.status||'betaald',
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const openOffertes  = offertes.filter(o => o.status === 'verzonden').length
    const totalFacturen = facturen.reduce((s,f) => s + calcTotalIncl(f.lines||[]), 0)
    const openFacturen  = facturen
      .filter(f => f.status==='openstaand'||f.status==='gedeeltelijk')
      .reduce((s,f) => {
        const paid = (f.payments||[]).reduce((ps,p) => ps + +p.amount, 0)
        return s + (calcTotalIncl(f.lines||[]) - paid)
      }, 0)
    const totalUitgaven = uitgaven.reduce((s,u) => s + +u.amount, 0)
    return { openOffertes, totalFacturen, openFacturen, totalUitgaven, result: totalFacturen - totalUitgaven }
  }, [offertes, facturen, uitgaven])

  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })
  const TAB_LABELS = {
    offertes: { nl:'Offertes', en:'Quotes' },
    facturen: { nl:'Facturen', en:'Invoices' },
    uitgaven: { nl:'Uitgaven', en:'Expenses' },
  }

  if (loading) return <FinanceSkeleton lang={lang} lbl={lbl} activeTab={activeTab} />

  const hasPeriod = dateFrom || dateTo

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Financiën','Finance')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Offertes, facturen en uitgaven','Quotes, invoices and expenses')}</p>
        </div>
        <div className={styles.headerBtns}>
          {activeTab==='offertes' && <button className={styles.addBtn} onClick={() => setOfferteForm('new')}><Plus size={15}/>{lbl('Nieuwe offerte','New quote')}</button>}
          {activeTab==='facturen' && <button className={styles.addBtn} onClick={() => setFactuurForm('new')}><Plus size={15}/>{lbl('Nieuwe factuur','New invoice')}</button>}
          {activeTab==='uitgaven' && <button className={styles.addBtn} onClick={() => setUitgaafForm('new')}><Plus size={15}/>{lbl('Nieuwe uitgave','New expense')}</button>}
        </div>
      </div>

      <div className={styles.statsRow}>
        <StatCard icon={FileText}      label={lbl('Open offertes','Open quotes')}   value={stats.openOffertes}          color="sky"/>
        <StatCard icon={Euro}          label={lbl('Gefactureerd','Invoiced')}        value={fmtEur(stats.totalFacturen)} color="blue"/>
        <StatCard icon={AlertTriangle} label={lbl('Openstaand','Outstanding')}       value={fmtEur(stats.openFacturen)}  color="orange" alert={stats.openFacturen>0}/>
        <StatCard icon={TrendingDown}  label={lbl('Uitgaven','Expenses')}            value={fmtEur(stats.totalUitgaven)} color="red"/>
        <StatCard icon={CheckCircle}   label={lbl('Resultaat','Result')}             value={fmtEur(stats.result)}        color={stats.result>=0?'green':'red'} wide/>
      </div>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab} className={`${styles.tab} ${activeTab===tab?styles.tabActive:''}`}
            onClick={() => { setActiveTab(tab); setSearch(''); setFilterStatus(''); clearPeriod() }}>
            {lang==='nl' ? TAB_LABELS[tab].nl : TAB_LABELS[tab].en}
          </button>
        ))}
      </div>

      {/* Toolbar with period filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input className={styles.searchInput}
            placeholder={lbl('Zoeken…','Search…')}
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        {/* Period filter */}
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:12,color:'var(--grey-400)',whiteSpace:'nowrap'}}>{lbl('Van','From')}</span>
          <input type="date" className={styles.filterSelect}
            value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{width:130}}/>
          <span style={{fontSize:12,color:'var(--grey-400)',whiteSpace:'nowrap'}}>{lbl('t/m','to')}</span>
          <input type="date" className={styles.filterSelect}
            value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{width:130}}/>
          {hasPeriod && (
            <button onClick={clearPeriod} style={{
              background:'none',border:'1px solid var(--grey-200)',
              borderRadius:6,padding:'4px 8px',cursor:'pointer',
              fontSize:11,color:'var(--grey-500)',whiteSpace:'nowrap',
            }}>✕ {lbl('Reset','Reset')}</button>
          )}
        </div>

        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">{lbl('Alle statussen','All statuses')}</option>
          {activeTab==='offertes' && ['concept','verzonden','goedgekeurd','afgewezen','verlopen'].map(s => <option key={s} value={s}>{s}</option>)}
          {activeTab==='facturen' && ['openstaand','gedeeltelijk','betaald','vervallen'].map(s => <option key={s} value={s}>{s}</option>)}
          {activeTab==='uitgaven' && ['betaald','te_betalen','besteld'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Period badge indicator */}
      {hasPeriod && (
        <div style={{
          display:'flex',alignItems:'center',gap:8,
          padding:'6px 12px',background:'#EEF5FF',
          borderRadius:8,marginBottom:8,fontSize:12,color:'#1A3E6F',
          border:'1px solid #C8D8F0',width:'fit-content',
        }}>
          📅 {lbl('Periode','Period')}: {dateFrom || '…'} → {dateTo || '…'}
        </div>
      )}

      {activeTab==='offertes' && (
        <OfferteList offertes={offertes} search={search} filterStatus={filterStatus}
          dateFrom={dateFrom} dateTo={dateTo} lang={lang}
          onEdit={o => setOfferteForm(o)} onDelete={deleteOfferte} onConvert={convertToFactuur}
          calcTotal={calcTotal} calcTotalIncl={calcTotalIncl}/>
      )}
      {activeTab==='facturen' && (
        <FactuurList facturen={facturen} search={search} filterStatus={filterStatus}
          dateFrom={dateFrom} dateTo={dateTo} lang={lang}
          onEdit={f => setFactuurForm(f)} onDelete={deleteFactuur} onPayment={addPayment}
          calcTotal={calcTotal} calcTotalIncl={calcTotalIncl}/>
      )}
      {activeTab==='uitgaven' && (
        <UitgavenList uitgaven={uitgaven} search={search} filterStatus={filterStatus}
          dateFrom={dateFrom} dateTo={dateTo} lang={lang}
          onEdit={u => setUitgaafForm(u)} onDelete={deleteUitgaaf}/>
      )}

      {offerteForm && <OfferteForm offerte={offerteForm==='new'?null:offerteForm} lang={lang} onSave={saveOfferte} onClose={() => setOfferteForm(null)}/>}
      {factuurForm && <FactuurForm factuur={factuurForm==='new'?null:factuurForm} lang={lang} onSave={saveFactuur} onClose={() => setFactuurForm(null)}/>}
      {uitgaafForm && <UitgavenForm uitgaaf={uitgaafForm==='new'?null:uitgaafForm} lang={lang} onSave={saveUitgaaf} onClose={() => setUitgaafForm(null)}/>}
    </div>
  )
}

function StatCard({ icon:Icon, label, value, color, alert, wide }) {
  return (
    <div className={`${styles.statCard} ${styles['color_'+color]} ${wide?styles.statWide:''} ${alert?styles.statAlert:''}`}>
      <div className={styles.statIcon}><Icon size={16}/></div>
      <div><div className={styles.statValue}>{value}</div><div className={styles.statLabel}>{label}</div></div>
    </div>
  )
}

/* ───────────────────────── SKELETON ───────────────────────── */

function Shimmer({ w = '100%', h = 14, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      ...style
    }} />
  )
}

function SkeletonStatCard({ color, wide }) {
  return (
    <div className={`${styles.statCard} ${styles['color_'+color]} ${wide?styles.statWide:''}`}
      style={{ pointerEvents: 'none', opacity: 0.75 }}>
      <div className={styles.statIcon}>
        <Shimmer w={16} h={16} r={4} />
      </div>
      <div style={{ flex: 1 }}>
        <Shimmer w={wide ? 100 : 60} h={20} style={{ marginBottom: 6 }} />
        <Shimmer w={wide ? 70 : 80} h={11} />
      </div>
    </div>
  )
}

function SkeletonFinanceRow({ index }) {
  const widths = ['60%', '75%', '55%', '70%', '65%']
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 18px', borderBottom: '1px solid #f0f0f0',
      pointerEvents: 'none', background: '#fff'
    }}>
      <Shimmer w={4} h={44} r={2} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer w={widths[index % widths.length]} h={13} />
        <Shimmer w="45%" h={11} />
      </div>
      <Shimmer w={80} h={12} />
      <Shimmer w={90} h={14} />
      <Shimmer w={70} h={20} r={10} />
      <div style={{ display: 'flex', gap: 6 }}>
        <Shimmer w={28} h={28} r={6} />
        <Shimmer w={28} h={28} r={6} />
      </div>
    </div>
  )
}

function FinanceSkeleton({ lang, lbl, activeTab }) {
  const TAB_LABELS = {
    offertes: { nl:'Offertes', en:'Quotes' },
    facturen: { nl:'Facturen', en:'Invoices' },
    uitgaven: { nl:'Uitgaven', en:'Expenses' },
  }

  return (
    <div className={styles.page}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Financiën','Finance')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Offertes, facturen en uitgaven','Quotes, invoices and expenses')}</p>
        </div>
        <div className={styles.headerBtns}>
          <Shimmer w={160} h={38} r={8} />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <SkeletonStatCard color="sky" />
        <SkeletonStatCard color="blue" />
        <SkeletonStatCard color="orange" />
        <SkeletonStatCard color="red" />
        <SkeletonStatCard color="green" wide />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab}
            className={`${styles.tab} ${activeTab===tab?styles.tabActive:''}`}
            disabled
            style={{ cursor: 'default' }}>
            {lang==='nl' ? TAB_LABELS[tab].nl : TAB_LABELS[tab].en}
          </button>
        ))}
      </div>

      {/* Toolbar with period filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Shimmer w="100%" h={38} r={8} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shimmer w={130} h={38} r={8} />
          <Shimmer w={130} h={38} r={8} />
        </div>
        <Shimmer w={160} h={38} r={8} />
      </div>

      {/* Rows */}
      <div style={{
        borderRadius: 12, border: '1px solid #f0f0f0',
        overflow: 'hidden', background: '#fff', marginTop: 8
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonFinanceRow key={i} index={i} />
        ))}
      </div>
    </div>
  )
}