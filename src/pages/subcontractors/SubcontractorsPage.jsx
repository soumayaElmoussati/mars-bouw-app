import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Filter, AlertCircle } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import SubList from './components/SubList'
import SubForm from './components/SubForm'
import SubOrders from './components/SubOrders'
import SubOrderForm from './components/SubOrderForm'
import styles from './SubcontractorsPage.module.css'

const TABS = ['subcontractors', 'orders']
const STAT_COLORS = {
  green: '#43A047', blue: '#1A3E6F', orange: '#FB8C00',
  sky: '#1E88E5', purple: '#7B1FA2', teal: '#00838F',
}

// ── Confirm Modal (inline) ─────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onCancel()}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
        zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
        animation:'cmFadeIn .15s ease',
      }}>
      <style>{`
        @keyframes cmFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes cmSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{
        background:'white', borderRadius:14, padding:'28px 28px 22px',
        width:400, maxWidth:'90vw',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
        animation:'cmSlideUp .2s ease',
      }}>
        <div style={{
          width:46, height:46, borderRadius:'50%',
          background:'#FFF0F3', display:'flex', alignItems:'center',
          justifyContent:'center', marginBottom:14,
        }}>
          <AlertCircle size={22} color="#C8102E"/>
        </div>
        <h3 style={{fontSize:15.5, fontWeight:700, color:'#1A1A2E', marginBottom:8}}>{title}</h3>
        <p style={{fontSize:13.5, color:'#6B7280', lineHeight:1.6, marginBottom:22}}>{message}</p>
        <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{
            padding:'8px 18px', borderRadius:8, border:'1px solid #E0E0E0',
            background:'white', color:'#555', fontSize:13.5, fontWeight:500, cursor:'pointer',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            padding:'8px 18px', borderRadius:8, border:'none',
            background:'#C8102E', color:'white', fontSize:13.5, fontWeight:600, cursor:'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function SubcontractorsPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [subs,     setSubs]     = useState([])
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('subcontractors')
  const [search,   setSearch]   = useState('')
  const [filterSpec,   setFilterSpec]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [subForm,   setSubForm]   = useState(null)
  const [orderForm, setOrderForm] = useState(null)
  const [payModal,  setPayModal]  = useState(null)

  // Confirm state: { type: 'sub'|'order', id, name }
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [s, o] = await Promise.all([
        api.get('/subcontractors'),
        api.get('/subcontractors/orders/all'),
      ])
      setSubs(s); setOrders(o)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Sub CRUD ──────────────────────────────────────────────────────────────
  async function saveSub(data) {
    try {
      if (data.id) {
        const updated = await api.put(`/subcontractors/${data.id}`, toSubPayload(data))
        setSubs(ss => ss.map(s => s.id === data.id ? updated : s))
      } else {
        const created = await api.post('/subcontractors', toSubPayload(data))
        setSubs(ss => [created, ...ss])
      }
      setSubForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteSub(id) {
    try {
      await api.delete(`/subcontractors/${id}`)
      setSubs(ss => ss.filter(s => s.id !== id))
    } catch (e) { alert(e.message) }
  }

  function toSubPayload(d) {
    return {
      name: d.name, specialty: d.specialty, contactPerson: d.contactPerson || d.contact_person || '',
      phone: d.phone || '', email: d.email || '', kvk: d.kvk || '',
      btw: d.btw || '', iban: d.iban || '', address: d.address || '',
      rating: d.rating || 3, status: d.status || 'actief', notes: d.notes || '',
    }
  }

  // ── Order CRUD ────────────────────────────────────────────────────────────
  async function saveOrder(data) {
    try {
      if (data.id) {
        const updated = await api.put(`/subcontractors/orders/${data.id}`, toOrderPayload(data))
        setOrders(os => os.map(o => o.id === data.id ? { ...updated, payments: o.payments || [] } : o))
      } else {
        const created = await api.post('/subcontractors/orders', toOrderPayload(data))
        setOrders(os => [{ ...created, payments: [] }, ...os])
      }
      setOrderForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteOrder(id) {
    try {
      await api.delete(`/subcontractors/orders/${id}`)
      setOrders(os => os.filter(o => o.id !== id))
    } catch (e) { alert(e.message) }
  }

  function toOrderPayload(d) {
    return {
      subcontractorId:   d.subcontractorId   || d.subcontractor_id,
      subcontractorName: d.subcontractorName || d.subcontractor_name || '',
      projectId:         d.projectId         || d.project_id         || null,
      projectName:       d.projectName       || d.project_name       || '',
      type:              d.type              || 'opdracht',
      description:       d.description       || '',
      amount:            d.amount            || 0,
      btw:               d.btw               || 21,
      status:            d.status            || 'concept',
      sentDate:          d.sentDate          || d.sent_date          || null,
      startDate:         d.startDate         || d.start_date         || null,
      endDate:           d.endDate           || d.end_date           || null,
      paymentStatus:     d.paymentStatus     || d.payment_status     || 'te_betalen',
      notes:             d.notes             || '',
    }
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  async function addPayment(orderId, payment) {
    try {
      const res = await api.post(`/subcontractors/orders/${orderId}/payments`, payment)
      setOrders(os => os.map(o => {
        if (o.id !== orderId) return o
        return { ...o, payment_status: res.paymentStatus, payments: [...(o.payments || []), res.payment] }
      }))
      setPayModal(null)
    } catch (e) { alert(e.message) }
  }

  // ── Confirm handlers ──────────────────────────────────────────────────────
  function handleConfirm() {
    if (!confirm) return
    if (confirm.type === 'sub')   deleteSub(confirm.id)
    if (confirm.type === 'order') deleteOrder(confirm.id)
    setConfirm(null)
  }

  const specialties = useMemo(() => [...new Set(subs.map(s => s.specialty))], [subs])

  const stats = useMemo(() => {
    const totalCommitted = orders.reduce((s, o) => s + +o.amount * (1 + +o.btw / 100), 0)
    const totalPaid      = orders.reduce((s, o) => s + (o.payments || []).reduce((ps, p) => ps + +p.amount, 0), 0)
    return {
      activeSubs:  subs.filter(s => s.status === 'actief').length,
      totalSubs:   subs.length,
      openOrders:  orders.filter(o => o.status !== 'afgerond' && o.status !== 'geannuleerd').length,
      totalOrders: orders.length,
      totalCommitted,
      totalPaid,
    }
  }, [subs, orders])

  const fmtEur = n => '€ ' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 0 })

  const TAB_LABELS = {
    subcontractors: { nl: 'Onderaannemers', en: 'Subcontractors' },
    orders:         { nl: 'Opdrachten',     en: 'Orders' },
  }

  if (loading) return <SubcontractorsSkeleton lang={lang} lbl={lbl} tab={tab} />

  return (
    <div className={styles.page}>

      {/* Confirm delete modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.type === 'sub'
            ? lbl('Onderaannemer verwijderen', 'Delete subcontractor')
            : lbl('Opdracht verwijderen', 'Delete order')}
          message={confirm.type === 'sub'
            ? lbl(`Weet u zeker dat u "${confirm.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
                  `Are you sure you want to delete "${confirm.name}"? This cannot be undone.`)
            : lbl(`Weet u zeker dat u opdracht "${confirm.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
                  `Are you sure you want to delete order "${confirm.name}"? This cannot be undone.`)}
          confirmLabel={lbl('Verwijderen', 'Delete')}
          cancelLabel={lbl('Annuleren', 'Cancel')}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Onderaannemers', 'Subcontractors')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Beheer onderaannemers en hun opdrachten', 'Manage subcontractors and their orders')}</p>
        </div>
        <div className={styles.headerBtns}>
          {tab === 'subcontractors' && (
            <button className={styles.addBtn} onClick={() => setSubForm('new')}>
              <Plus size={15}/>{lbl('Toevoegen', 'Add')}
            </button>
          )}
          {tab === 'orders' && (
            <button className={styles.addBtn} onClick={() => setOrderForm('new')}>
              <Plus size={15}/>{lbl('Nieuwe opdracht', 'New order')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: lbl('Actief', 'Active'),       value: stats.activeSubs,             color: 'green' },
          { label: lbl('Totaal', 'Total'),         value: stats.totalSubs,              color: 'blue' },
          { label: lbl('Open', 'Open'),            value: stats.openOrders,             color: 'orange', alert: stats.openOrders > 0 },
          { label: lbl('Opdrachten', 'Orders'),    value: stats.totalOrders,            color: 'sky' },
          { label: lbl('Verplicht', 'Committed'),  value: fmtEur(stats.totalCommitted), color: 'purple' },
          { label: lbl('Uitbetaald', 'Paid'),      value: fmtEur(stats.totalPaid),      color: 'teal' },
        ].map(s => (
          <div key={s.label}
            className={`${styles.statCard} ${s.alert ? styles.statAlert : ''}`}
            style={{ borderLeftColor: STAT_COLORS[s.color] }}>
            <span className={styles.statVal} style={{ color: STAT_COLORS[s.color] }}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => { setTab(t); setSearch(''); setFilterSpec(''); setFilterStatus('') }}>
            {lang === 'nl' ? TAB_LABELS[t].nl : TAB_LABELS[t].en}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon}/>
          <input className={styles.searchInput} placeholder={lbl('Zoeken…', 'Search…')} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-300)' }}/>
          {tab === 'subcontractors' && (
            <select className={styles.filterSelect} value={filterSpec} onChange={e => setFilterSpec(e.target.value)}>
              <option value="">{lbl('Alle specialismen', 'All specialties')}</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{lbl('Alle statussen', 'All statuses')}</option>
            {(tab === 'subcontractors'
              ? ['actief', 'inactief']
              : ['concept', 'goedgekeurd', 'in_uitvoering', 'afgerond', 'geannuleerd']
            ).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {tab === 'subcontractors' && (
        <SubList
          subs={subs} search={search} filterSpec={filterSpec} filterStatus={filterStatus}
          lang={lang} orders={orders}
          onEdit={s => setSubForm(s)}
          onDelete={s => setConfirm({ type:'sub', id: s.id, name: s.name })}
        />
      )}

      {tab === 'orders' && (
        <SubOrders
          orders={orders} subs={subs} search={search} filterStatus={filterStatus} lang={lang}
          onEdit={o => setOrderForm(o)}
          onDelete={o => {
            const num = o.order_number || o.orderNumber || o.id
            setConfirm({ type:'order', id: o.id, name: String(num) })
          }}
          onPayment={o => setPayModal(o)}
        />
      )}

      {subForm && (
        <SubForm sub={subForm === 'new' ? null : subForm} lang={lang} onSave={saveSub} onClose={() => setSubForm(null)}/>
      )}
      {orderForm && (
        <SubOrderForm order={orderForm === 'new' ? null : orderForm} subs={subs} lang={lang} onSave={saveOrder} onClose={() => setOrderForm(null)}/>
      )}
      {payModal && (
        <PayModal order={payModal} lang={lang} onSave={p => addPayment(payModal.id, p)} onClose={() => setPayModal(null)}/>
      )}
    </div>
  )
}

function PayModal({ order, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const [date,   setDate]   = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('overschrijving')
  const [note,   setNote]   = useState('')
  const totalIncl = +order.amount * (1 + +order.btw / 100)
  const paid      = (order.payments || []).reduce((s, p) => s + +p.amount, 0)
  const remaining = totalIncl - paid
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{lbl('Betaling registreren', 'Register payment')}</h3>
          <button onClick={onClose} className={styles.modalClose}>✕</button>
        </div>
        <div className={styles.modalSum}>
          <div className={styles.sumItem}><span>{lbl('Totaal', 'Total')}</span><strong>€ {totalIncl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</strong></div>
          <div className={styles.sumItem}><span>{lbl('Betaald', 'Paid')}</span><strong style={{ color: '#2E7D32' }}>€ {paid.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</strong></div>
          <div className={styles.sumItem}><span>{lbl('Resterend', 'Remaining')}</span><strong style={{ color: '#E65100' }}>€ {remaining.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</strong></div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.mRow}>
            <div className={styles.mField}><label>{lbl('Datum', 'Date')}</label><input type="date" className={styles.mInput} value={date} onChange={e => setDate(e.target.value)}/></div>
            <div className={styles.mField}><label>{lbl('Bedrag €', 'Amount €')}</label><input type="number" step="0.01" className={styles.mInput} value={amount} onChange={e => setAmount(e.target.value)} placeholder={remaining.toFixed(2)}/></div>
          </div>
          <div className={styles.mRow}>
            <div className={styles.mField}><label>{lbl('Methode', 'Method')}</label>
              <select className={styles.mInput} value={method} onChange={e => setMethod(e.target.value)}>
                {['overschrijving', 'pin', 'contant', 'ideal'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className={styles.mField}><label>Note</label><input className={styles.mInput} value={note} onChange={e => setNote(e.target.value)}/></div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren', 'Cancel')}</button>
          <button className={styles.saveBtn} onClick={() => { if (!amount || +amount <= 0) return; onSave({ date, amount: +amount, method, note }) }}>
            {lbl('Opslaan', 'Save')}
          </button>
        </div>
      </div>
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

function SkeletonStatCard({ color }) {
  return (
    <div className={styles.statCard} style={{ borderLeftColor: STAT_COLORS[color], pointerEvents:'none', opacity:0.75 }}>
      <Shimmer w={40} h={22} style={{ marginBottom: 6 }}/>
      <Shimmer w={70} h={11}/>
    </div>
  )
}

function SkeletonSubCard({ index }) {
  const widths = ['60%', '75%', '55%', '70%']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderBottom:'1px solid #f0f0f0', pointerEvents:'none', background:'#fff' }}>
      <Shimmer w={42} h={42} r={21}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        <Shimmer w={widths[index % widths.length]} h={14}/>
        <Shimmer w="50%" h={11}/>
      </div>
      <Shimmer w={100} h={18} r={9}/>
      <Shimmer w={70} h={20} r={10}/>
      <Shimmer w={80} h={12}/>
      <div style={{ display:'flex', gap:6 }}>
        <Shimmer w={28} h={28} r={6}/>
        <Shimmer w={28} h={28} r={6}/>
      </div>
    </div>
  )
}

function SkeletonOrderRow({ index }) {
  const widths = ['55%', '70%', '60%', '75%']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderBottom:'1px solid #f0f0f0', pointerEvents:'none', background:'#fff' }}>
      <Shimmer w={4} h={44} r={2}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        <Shimmer w={widths[index % widths.length]} h={14}/>
        <Shimmer w={120} h={11}/>
      </div>
      <Shimmer w={90} h={12}/>
      <Shimmer w={100} h={14}/>
      <Shimmer w={80} h={20} r={10}/>
      <div style={{ display:'flex', gap:6 }}>
        <Shimmer w={28} h={28} r={6}/>
        <Shimmer w={28} h={28} r={6}/>
        <Shimmer w={28} h={28} r={6}/>
      </div>
    </div>
  )
}

function SubcontractorsSkeleton({ lang, lbl, tab }) {
  const TAB_LABELS = {
    subcontractors: { nl:'Onderaannemers', en:'Subcontractors' },
    orders:         { nl:'Opdrachten',     en:'Orders' },
  }
  return (
    <div className={styles.page}>
      <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Onderaannemers','Subcontractors')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Beheer onderaannemers en hun opdrachten','Manage subcontractors and their orders')}</p>
        </div>
        <div className={styles.headerBtns}>
          {tab === 'subcontractors' && <Shimmer w={120} h={38} r={8}/>}
          {tab === 'orders'         && <Shimmer w={160} h={38} r={8}/>}
        </div>
      </div>
      <div className={styles.statsRow}>
        {['green','blue','orange','sky','purple','teal'].map(c => <SkeletonStatCard key={c} color={c}/>)}
      </div>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`} disabled style={{cursor:'default'}}>
            {lang==='nl' ? TAB_LABELS[t].nl : TAB_LABELS[t].en}
          </button>
        ))}
      </div>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Shimmer w={14} h={14} r={4} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
          <Shimmer w="100%" h={38} r={8}/>
        </div>
        <div className={styles.filters}>
          <Shimmer w={14} h={14} r={4}/>
          {tab === 'subcontractors' && <Shimmer w={150} h={38} r={8}/>}
          <Shimmer w={150} h={38} r={8}/>
        </div>
      </div>
      <div style={{borderRadius:12,border:'1px solid #f0f0f0',overflow:'hidden',background:'#fff',marginTop:8}}>
        {tab === 'subcontractors'
          ? Array.from({length:6}).map((_,i) => <SkeletonSubCard key={i} index={i}/>)
          : Array.from({length:7}).map((_,i) => <SkeletonOrderRow key={i} index={i}/>)
        }
      </div>
    </div>
  )
}