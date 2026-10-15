import { useState, useMemo } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { subcontractorsSeed, subcontractorOrdersSeed } from '../../data/subcontractorsSeed'
import SubList from './components/SubList'
import SubForm from './components/SubForm'
import SubOrders from './components/SubOrders'
import SubOrderForm from './components/SubOrderForm'
import styles from './SubcontractorsPage.module.css'

const TABS = ['subcontractors', 'orders']

export default function SubcontractorsPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [subs, setSubs]         = useState(subcontractorsSeed)
  const [orders, setOrders]     = useState(subcontractorOrdersSeed)
  const [tab, setTab]           = useState('subcontractors')
  const [search, setSearch]     = useState('')
  const [filterSpec, setFilterSpec]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [subForm, setSubForm]     = useState(null)
  const [orderForm, setOrderForm] = useState(null)
  const [payModal, setPayModal]   = useState(null)

  const specialties = useMemo(() => [...new Set(subs.map(s => s.specialty))], [subs])

  const stats = useMemo(() => {
    const totalCommitted = orders.reduce((s,o) => s + o.amount * (1 + o.btw/100), 0)
    const totalPaid      = orders.reduce((s,o) => s + (o.payments||[]).reduce((ps,p) => ps+p.amount, 0), 0)
    return {
      activeSubs:  subs.filter(s=>s.status==='actief').length,
      totalSubs:   subs.length,
      openOrders:  orders.filter(o=>o.status!=='afgerond'&&o.status!=='geannuleerd').length,
      totalOrders: orders.length,
      totalCommitted, totalPaid,
    }
  }, [subs, orders])

  const fmtEur = n => '€ ' + Number(n||0).toLocaleString('nl-NL', { minimumFractionDigits: 0 })

  function saveSub(data) {
    if (data.id) setSubs(ss=>ss.map(s=>s.id===data.id?data:s))
    else { const id=Math.max(0,...subs.map(s=>s.id))+1; setSubs(ss=>[...ss,{...data,id,createdAt:new Date().toISOString().slice(0,10)}]) }
    setSubForm(null)
  }

  function saveOrder(data) {
    if (data.id) setOrders(os=>os.map(o=>o.id===data.id?data:o))
    else {
      const id=Math.max(0,...orders.map(o=>o.id))+1
      setOrders(os=>[...os,{...data,id,orderNumber:`SO-${String(id).padStart(3,'0')}`,payments:[]}])
    }
    setOrderForm(null)
  }

  function addPayment(orderId, payment) {
    setOrders(os=>os.map(o=>{
      if (o.id!==orderId) return o
      const payments=[...(o.payments||[]),{...payment,id:Date.now()}]
      const totalIncl=o.amount*(1+o.btw/100)
      const paid=payments.reduce((s,p)=>s+p.amount,0)
      const paymentStatus=paid>=totalIncl?'betaald':paid>0?'gedeeltelijk':'te_betalen'
      return {...o,payments,paymentStatus}
    }))
    setPayModal(null)
  }

  const TAB_LABELS = {
    subcontractors: { nl:'Onderaannemers', en:'Subcontractors' },
    orders:         { nl:'Opdrachten',     en:'Orders' },
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Onderaannemers','Subcontractors')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Beheer onderaannemers en hun opdrachten','Manage subcontractors and their orders')}</p>
        </div>
        <div className={styles.headerBtns}>
          {tab==='subcontractors' && <button className={styles.addBtn} onClick={()=>setSubForm('new')}><Plus size={15}/>{lbl('Toevoegen','Add')}</button>}
          {tab==='orders'         && <button className={styles.addBtn} onClick={()=>setOrderForm('new')}><Plus size={15}/>{lbl('Nieuwe opdracht','New order')}</button>}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label:lbl('Actief','Active'),       value:stats.activeSubs,              color:'green' },
          { label:lbl('Totaal subs','Total'),   value:stats.totalSubs,               color:'blue' },
          { label:lbl('Open opdrachten','Open'),value:stats.openOrders,              color:'orange', alert:stats.openOrders>0 },
          { label:lbl('Opdrachten','Orders'),   value:stats.totalOrders,             color:'sky' },
          { label:lbl('Verplicht','Committed'), value:fmtEur(stats.totalCommitted),  color:'purple' },
          { label:lbl('Uitbetaald','Paid'),     value:fmtEur(stats.totalPaid),       color:'teal' },
        ].map(s=>(
          <div key={s.label} className={`${styles.statCard} ${s.alert?styles.statAlert:''}`}
            style={{ borderLeftColor: STAT_COLORS[s.color] }}>
            <span className={styles.statVal} style={{ color: STAT_COLORS[s.color] }}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t=>(
          <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`}
            onClick={()=>{setTab(t);setSearch('');setFilterSpec('');setFilterStatus('')}}>
            {lang==='nl'?TAB_LABELS[t].nl:TAB_LABELS[t].en}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon}/>
          <input className={styles.searchInput} placeholder={lbl('Zoeken…','Search…')} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{color:'var(--grey-300)'}}/>
          {tab==='subcontractors' && (
            <select className={styles.filterSelect} value={filterSpec} onChange={e=>setFilterSpec(e.target.value)}>
              <option value="">{lbl('Alle specialismen','All specialties')}</option>
              {specialties.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <select className={styles.filterSelect} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">{lbl('Alle statussen','All statuses')}</option>
            {(tab==='subcontractors'
              ? ['actief','inactief']
              : ['concept','goedgekeurd','in_uitvoering','afgerond','geannuleerd']
            ).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {tab==='subcontractors' && (
        <SubList subs={subs} search={search} filterSpec={filterSpec} filterStatus={filterStatus}
          lang={lang} orders={orders}
          onEdit={s=>setSubForm(s)}
          onDelete={id=>setSubs(ss=>ss.filter(s=>s.id!==id))} />
      )}
      {tab==='orders' && (
        <SubOrders orders={orders} subs={subs} search={search} filterStatus={filterStatus}
          lang={lang}
          onEdit={o=>setOrderForm(o)}
          onDelete={id=>setOrders(os=>os.filter(o=>o.id!==id))}
          onPayment={o=>setPayModal(o)} />
      )}

      {subForm   && <SubForm sub={subForm==='new'?null:subForm} lang={lang} onSave={saveSub} onClose={()=>setSubForm(null)} />}
      {orderForm && <SubOrderForm order={orderForm==='new'?null:orderForm} subs={subs} lang={lang} onSave={saveOrder} onClose={()=>setOrderForm(null)} />}
      {payModal  && <PayModal order={payModal} lang={lang} onSave={p=>addPayment(payModal.id,p)} onClose={()=>setPayModal(null)} />}
    </div>
  )
}

const STAT_COLORS = { green:'#43A047', blue:'#1A3E6F', orange:'#FB8C00', sky:'#1E88E5', purple:'#7B1FA2', teal:'#00838F' }

function PayModal({ order, lang, onSave, onClose }) {
  const lbl = (nl,en) => lang==='nl'?nl:en
  const [date,   setDate]   = useState(new Date().toISOString().slice(0,10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('overschrijving')
  const [note,   setNote]   = useState('')
  const totalIncl = order.amount * (1 + order.btw/100)
  const paid      = (order.payments||[]).reduce((s,p)=>s+p.amount,0)
  const remaining = totalIncl - paid
  return (
    <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{lbl('Betaling registreren','Register payment')}</h3>
          <button onClick={onClose} className={styles.modalClose}>✕</button>
        </div>
        <div className={styles.modalSum}>
          <div className={styles.sumItem}><span>{lbl('Totaal','Total')}</span><strong>€ {totalIncl.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
          <div className={styles.sumItem}><span>{lbl('Betaald','Paid')}</span><strong style={{color:'#2E7D32'}}>€ {paid.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
          <div className={styles.sumItem}><span>{lbl('Resterend','Remaining')}</span><strong style={{color:'#E65100'}}>€ {remaining.toLocaleString('nl-NL',{minimumFractionDigits:2})}</strong></div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.mRow}>
            <div className={styles.mField}><label>{lbl('Datum','Date')}</label><input type="date" className={styles.mInput} value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div className={styles.mField}><label>{lbl('Bedrag €','Amount €')}</label><input type="number" step="0.01" className={styles.mInput} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={remaining.toFixed(2)}/></div>
          </div>
          <div className={styles.mRow}>
            <div className={styles.mField}><label>{lbl('Methode','Method')}</label>
              <select className={styles.mInput} value={method} onChange={e=>setMethod(e.target.value)}>
                {['overschrijving','pin','contant','ideal'].map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className={styles.mField}><label>Note</label><input className={styles.mInput} value={note} onChange={e=>setNote(e.target.value)}/></div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
          <button className={styles.saveBtn} onClick={()=>{if(!amount||+amount<=0)return;onSave({date,amount:+amount,method,note})}}>{lbl('Opslaan','Save')}</button>
        </div>
      </div>
    </div>
  )
}