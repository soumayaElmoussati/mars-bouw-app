import { useState, useMemo } from 'react'
import {
  Plus, Search, Filter, Package, AlertTriangle,
  ShoppingCart, ClipboardCheck, BarChart2,
  ArrowRightLeft, TrendingDown
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { stockSeed, purchaseOrdersSeed, suppliersSeed } from '../../data/stockSeed'
import StockList from './components/StockList'
import StockForm from './components/StockForm'
import StockMovement from './components/StockMovement'
import PurchaseOrders from './components/PurchaseOrders'
import PurchaseOrderForm from './components/PurchaseOrderForm'
import QualityControl from './components/QualityControl'
import styles from './StockPage.module.css'

const TABS = ['stock', 'orders', 'qc']

export default function StockPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en

  const [stock, setStock] = useState(stockSeed)
  const [orders, setOrders] = useState(purchaseOrdersSeed)
  const [activeTab, setActiveTab] = useState('stock')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modals
  const [stockForm, setStockForm] = useState(null)      // null | 'add' | item
  const [movementForm, setMovementForm] = useState(null) // null | item
  const [orderForm, setOrderForm] = useState(null)       // null | 'add' | order
  const [qcForm, setQcForm] = useState(null)             // null | order

  // Stats
  const stats = useMemo(() => {
    const lowStock  = stock.filter(s => s.quantity <= s.minStock)
    const outStock  = stock.filter(s => s.quantity === 0)
    const pending   = orders.filter(o => o.status === 'besteld')
    const pendingQC = orders.filter(o => o.status === 'ontvangen' && !o.qcStatus)
    const totalVal  = stock.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0)
    return { total: stock.length, lowStock: lowStock.length, outStock: outStock.length, pending: pending.length, pendingQC: pendingQC.length, totalVal }
  }, [stock, orders])

  const categories = useMemo(() => [...new Set(stock.map(s => s.category))], [stock])

  // Stock CRUD
  function saveStock(data) {
    if (data.id) {
      setStock(ss => ss.map(s => s.id === data.id ? data : s))
    } else {
      const newId = Math.max(0, ...stock.map(s => s.id)) + 1
      setStock(ss => [...ss, { ...data, id: newId, createdAt: new Date().toISOString().slice(0,10) }])
    }
    setStockForm(null)
  }

  function deleteStock(id) {
    setStock(ss => ss.filter(s => s.id !== id))
  }

  // Movement (in/out)
  function saveMovement({ stockId, type, qty, note }) {
    setStock(ss => ss.map(s => {
      if (s.id !== stockId) return s
      const newQty = type === 'in' ? s.quantity + qty : Math.max(0, s.quantity - qty)
      return { ...s, quantity: newQty }
    }))
    setMovementForm(null)
  }

  // Orders CRUD
  function saveOrder(data) {
    if (data.id) {
      setOrders(os => os.map(o => o.id === data.id ? data : o))
    } else {
      const newId = Math.max(0, ...orders.map(o => o.id)) + 1
      const num = `PO-2024-${String(newId).padStart(3,'0')}`
      setOrders(os => [...os, { ...data, id: newId, orderNumber: num, qcStatus: null, qcDate: null, qcBy: null, qcNotes: '' }])
    }
    setOrderForm(null)
  }

  // Mark order received → update stock
  function markReceived(orderId) {
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      return { ...o, status: 'ontvangen', receivedDate: new Date().toISOString().slice(0,10) }
    }))
    const order = orders.find(o => o.id === orderId)
    if (order) {
      order.items.forEach(item => {
        setStock(ss => ss.map(s => s.id === item.stockId
          ? { ...s, quantity: s.quantity + (item.received || item.quantity) }
          : s
        ))
      })
    }
  }

  // QC Save
  function saveQC(orderId, qcData) {
    setOrders(os => os.map(o => o.id === orderId ? { ...o, ...qcData } : o))
    setQcForm(null)
  }

  const TAB_LABELS = {
    stock:  { nl: 'Voorraad',        en: 'Stock' },
    orders: { nl: 'Inkooporders',    en: 'Purchase orders' },
    qc:     { nl: 'Kwaliteitscontrole', en: 'Quality control' },
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Voorraadbeheer', 'Stock management')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Materialen, inkoop en kwaliteitscontrole', 'Materials, purchasing and quality control')}</p>
        </div>
        <div className={styles.headerBtns}>
          {activeTab === 'stock' && (
            <>
              <button className={styles.secBtn} onClick={() => setMovementForm('pick')}>
                <ArrowRightLeft size={15} /> {lbl('Beweging', 'Movement')}
              </button>
              <button className={styles.addBtn} onClick={() => setStockForm('add')}>
                <Plus size={15} /> {lbl('Artikel toevoegen', 'Add item')}
              </button>
            </>
          )}
          {activeTab === 'orders' && (
            <button className={styles.addBtn} onClick={() => setOrderForm('add')}>
              <Plus size={15} /> {lbl('Nieuwe bestelling', 'New order')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard icon={Package}       label={lbl('Artikelen', 'Items')}       value={stats.total}     color="blue" />
        <StatCard icon={TrendingDown}  label={lbl('Laag stock', 'Low stock')}  value={stats.lowStock}  color="orange" alert={stats.lowStock > 0} />
        <StatCard icon={AlertTriangle} label={lbl('Uitverkocht', 'Out of stock')} value={stats.outStock} color="red" alert={stats.outStock > 0} />
        <StatCard icon={ShoppingCart}  label={lbl('Openstaand', 'Pending')}    value={stats.pending}   color="sky" />
        <StatCard icon={ClipboardCheck} label={lbl('KQ controle', 'QC pending')} value={stats.pendingQC} color="purple" alert={stats.pendingQC > 0} />
        <StatCard icon={BarChart2}     label={lbl('Waarde', 'Value')}
          value={'€ ' + stats.totalVal.toLocaleString('nl-NL', { minimumFractionDigits: 0 })} color="green" wide />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {lang === 'nl' ? TAB_LABELS[tab].nl : TAB_LABELS[tab].en}
            {tab === 'qc' && stats.pendingQC > 0 && (
              <span className={styles.tabBadge}>{stats.pendingQC}</span>
            )}
            {tab === 'stock' && stats.lowStock > 0 && (
              <span className={styles.tabBadgeOrange}>{stats.lowStock}</span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={
              activeTab === 'stock'  ? lbl('Artikel zoeken…', 'Search items…') :
              activeTab === 'orders' ? lbl('Order zoeken…',   'Search orders…') :
                                       lbl('QC zoeken…',      'Search QC…')
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-300)' }} />
          {activeTab === 'stock' && (
            <select className={styles.filterSelect} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">{lbl('Alle categorieën', 'All categories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {(activeTab === 'orders' || activeTab === 'qc') && (
            <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{lbl('Alle statussen', 'All statuses')}</option>
              {activeTab === 'orders'
                ? ['besteld','ontvangen','gedeeltelijk','geannuleerd'].map(s => <option key={s} value={s}>{s}</option>)
                : ['goedgekeurd','afgekeurd','gedeeltelijk'].map(s => <option key={s} value={s}>{s}</option>)
              }
            </select>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'stock' && (
        <StockList
          stock={stock}
          search={search}
          filterCat={filterCat}
          lang={lang}
          onEdit={item => setStockForm(item)}
          onDelete={deleteStock}
          onMovement={item => setMovementForm(item)}
        />
      )}

      {activeTab === 'orders' && (
        <PurchaseOrders
          orders={orders}
          search={search}
          filterStatus={filterStatus}
          lang={lang}
          onEdit={o => setOrderForm(o)}
          onReceive={markReceived}
          onQC={o => setQcForm(o)}
        />
      )}

      {activeTab === 'qc' && (
        <QualityControl
          orders={orders}
          search={search}
          filterStatus={filterStatus}
          lang={lang}
          onQC={o => setQcForm(o)}
        />
      )}

      {/* Modals */}
      {stockForm && (
        <StockForm
          item={stockForm === 'add' ? null : stockForm}
          suppliers={suppliersSeed}
          lang={lang}
          onSave={saveStock}
          onClose={() => setStockForm(null)}
        />
      )}

      {movementForm && (
        <StockMovement
          stock={stock}
          selected={movementForm === 'pick' ? null : movementForm}
          lang={lang}
          onSave={saveMovement}
          onClose={() => setMovementForm(null)}
        />
      )}

      {orderForm && (
        <PurchaseOrderForm
          order={orderForm === 'add' ? null : orderForm}
          stock={stock}
          suppliers={suppliersSeed}
          lang={lang}
          onSave={saveOrder}
          onClose={() => setOrderForm(null)}
        />
      )}

      {qcForm && (
        <QualityControl
          singleOrder={qcForm}
          lang={lang}
          onSave={saveQC}
          onClose={() => setQcForm(null)}
          modal
        />
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