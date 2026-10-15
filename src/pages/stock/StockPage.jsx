import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Search, Filter, Package, AlertTriangle,
  ShoppingCart, ClipboardCheck, BarChart2,
  ArrowRightLeft, TrendingDown
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
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

  const [stock,     setStock]     = useState([])
  const [orders,    setOrders]    = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('stock')
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modals
  const [stockForm,    setStockForm]    = useState(null)
  const [movementForm, setMovementForm] = useState(null)
  const [orderForm,    setOrderForm]    = useState(null)
  const [qcForm,       setQcForm]       = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [s, o, sup] = await Promise.all([
        api.get('/stock/items'),
        api.get('/stock/orders'),
        api.get('/stock/suppliers'),
      ])
      setStock(s); setOrders(o); setSuppliers(sup)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Stock CRUD ─────────────────────────────────────────────────────────────
  async function saveStock(data) {
    try {
      const payload = toItemPayload(data)
      if (data.id) {
        const updated = await api.put(`/stock/items/${data.id}`, payload)
        setStock(ss => ss.map(s => s.id === data.id ? updated : s))
      } else {
        const created = await api.post('/stock/items', payload)
        setStock(ss => [...ss, created])
      }
      setStockForm(null)
    } catch (e) { alert(e.message) }
  }

  async function deleteStock(id) {
    try {
      await api.delete(`/stock/items/${id}`)
      setStock(ss => ss.filter(s => s.id !== id))
    } catch (e) { alert(e.message) }
  }

  // ── Movement (in/out) ──────────────────────────────────────────────────────
  async function saveMovement({ stockId, type, qty }) {
    try {
      const delta = type === 'in' ? qty : -qty
      const updated = await api.patch(`/stock/items/${stockId}/quantity`, { delta })
      setStock(ss => ss.map(s => s.id === stockId ? updated : s))
      setMovementForm(null)
    } catch (e) { alert(e.message) }
  }

  // ── Orders CRUD ───────────────────────────────────────────────────────────
  async function saveOrder(data) {
    try {
      const payload = toOrderPayload(data)
      if (data.id) {
        // No update endpoint in original, just update locally
        setOrders(os => os.map(o => o.id === data.id ? { ...o, ...data } : o))
      } else {
        const created = await api.post('/stock/orders', payload)
        setOrders(os => [{ ...created, items: data.items || [] }, ...os])
      }
      setOrderForm(null)
    } catch (e) { alert(e.message) }
  }

  async function markReceived(orderId) {
    try {
      const updated = await api.patch(`/stock/orders/${orderId}/receive`)
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status: 'ontvangen', received_date: updated.received_date } : o))
      // Reload stock to get updated quantities
      const newStock = await api.get('/stock/items')
      setStock(newStock)
    } catch (e) { alert(e.message) }
  }

  function saveQC(orderId, qcData) {
    setOrders(os => os.map(o => o.id === orderId ? { ...o, ...qcData } : o))
    setQcForm(null)
  }

  function toItemPayload(d) {
    return {
      name: d.name, sku: d.sku, category: d.category || 'overig',
      unit: d.unit || 'stuk', quantity: d.quantity || 0,
      minStock: d.min_stock ?? d.minStock ?? 0,
      maxStock: d.max_stock ?? d.maxStock ?? 100,
      location: d.location || '',
      supplierId: d.supplier_id || d.supplierId || null,
      supplierName: d.supplier_name || d.supplierName || '',
      purchasePrice: d.purchase_price ?? d.purchasePrice ?? 0,
      description: d.description || '',
    }
  }

  function toOrderPayload(d) {
    return {
      supplierId:   d.supplier_id   || d.supplierId   || null,
      supplierName: d.supplier_name || d.supplierName || '',
      projectId:    d.project_id    || d.projectId    || null,
      projectName:  d.project_name  || d.projectName  || '',
      status:       d.status        || 'besteld',
      orderDate:    d.order_date    || d.orderDate    || new Date().toISOString().slice(0, 10),
      expectedDate: d.expected_date || d.expectedDate || null,
      notes:        d.notes         || '',
      items: (d.items || []).map(i => ({
        stockId:   i.stock_id   || i.stockId   || null,
        name:      i.name       || '',
        quantity:  i.quantity   || 1,
        unit:      i.unit       || 'stuk',
        unitPrice: i.unit_price || i.unitPrice  || 0,
      })),
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const lowStock  = stock.filter(s => +s.quantity <= +s.min_stock)
    const outStock  = stock.filter(s => +s.quantity === 0)
    const pending   = orders.filter(o => o.status === 'besteld')
    const pendingQC = orders.filter(o => o.status === 'ontvangen' && !o.qc_status)
    const totalVal  = stock.reduce((sum, s) => sum + (+s.quantity * +s.purchase_price), 0)
    return {
      total: stock.length, lowStock: lowStock.length, outStock: outStock.length,
      pending: pending.length, pendingQC: pendingQC.length, totalVal,
    }
  }, [stock, orders])

  const categories = useMemo(() => [...new Set(stock.map(s => s.category))], [stock])

  const TAB_LABELS = {
    stock:  { nl: 'Voorraad',             en: 'Stock' },
    orders: { nl: 'Inkooporders',         en: 'Purchase orders' },
    qc:     { nl: 'Kwaliteitscontrole',   en: 'Quality control' },
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
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl('Voorraadbeheer', 'Stock management')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Materialen, inkoop en kwaliteitscontrole', 'Materials, purchasing and quality control')}</p>
        </div>
        <div className={styles.headerBtns}>
          {activeTab === 'stock' && (
            <>
              <button className={styles.secBtn} onClick={() => setMovementForm('pick')}>
                <ArrowRightLeft size={15}/>{lbl('Beweging', 'Movement')}
              </button>
              <button className={styles.addBtn} onClick={() => setStockForm('add')}>
                <Plus size={15}/>{lbl('Artikel toevoegen', 'Add item')}
              </button>
            </>
          )}
          {activeTab === 'orders' && (
            <button className={styles.addBtn} onClick={() => setOrderForm('add')}>
              <Plus size={15}/>{lbl('Nieuwe bestelling', 'New order')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard icon={Package}        label={lbl('Artikelen', 'Items')}        value={stats.total}     color="blue"/>
        <StatCard icon={TrendingDown}   label={lbl('Laag stock', 'Low stock')}   value={stats.lowStock}  color="orange" alert={stats.lowStock > 0}/>
        <StatCard icon={AlertTriangle}  label={lbl('Uitverkocht', 'Out of stock')} value={stats.outStock} color="red" alert={stats.outStock > 0}/>
        <StatCard icon={ShoppingCart}   label={lbl('Openstaand', 'Pending')}     value={stats.pending}   color="sky"/>
        <StatCard icon={ClipboardCheck} label={lbl('KQ controle', 'QC pending')} value={stats.pendingQC} color="purple" alert={stats.pendingQC > 0}/>
        <StatCard icon={BarChart2}      label={lbl('Waarde', 'Value')}
          value={'€ ' + stats.totalVal.toLocaleString('nl-NL', { minimumFractionDigits: 0 })} color="green" wide/>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}>
            {lang === 'nl' ? TAB_LABELS[tab].nl : TAB_LABELS[tab].en}
            {tab === 'qc'    && stats.pendingQC > 0 && <span className={styles.tabBadge}>{stats.pendingQC}</span>}
            {tab === 'stock' && stats.lowStock > 0  && <span className={styles.tabBadgeOrange}>{stats.lowStock}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon}/>
          <input className={styles.searchInput}
            placeholder={
              activeTab === 'stock'  ? lbl('Artikel zoeken…', 'Search items…') :
              activeTab === 'orders' ? lbl('Order zoeken…', 'Search orders…') :
                                       lbl('QC zoeken…', 'Search QC…')
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--grey-300)' }}/>
          {activeTab === 'stock' && (
            <select className={styles.filterSelect} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">{lbl('Alle categorieën', 'All categories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {(activeTab === 'orders' || activeTab === 'qc') && (
            <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{lbl('Alle statussen', 'All statuses')}</option>
              {(activeTab === 'orders'
                ? ['besteld', 'ontvangen', 'gedeeltelijk', 'geannuleerd']
                : ['goedgekeurd', 'afgekeurd', 'gedeeltelijk']
              ).map(s => <option key={s} value={s}>{s}</option>)}
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
          suppliers={suppliers}
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
          suppliers={suppliers}
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
    <div className={`${styles.statCard} ${styles['color_' + color]} ${wide ? styles.statWide : ''} ${alert ? styles.statAlert : ''}`}>
      <div className={styles.statIcon}><Icon size={16}/></div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  )
}