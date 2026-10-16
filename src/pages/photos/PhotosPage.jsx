import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, Search, Filter, X, ZoomIn,
  Camera, Calendar, User, Trash2, Edit3, ChevronLeft, ChevronRight,
  AlertCircle
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { api } from '../../api/client'
import styles from './PhotosPage.module.css'

const CATEGORIES = [
  { key:'voor',       nl:'Voor',       en:'Before',   color:'#1565C0', bg:'#E3F2FD' },
  { key:'uitvoering', nl:'Uitvoering', en:'During',   color:'#E65100', bg:'#FFF3E0' },
  { key:'na',         nl:'Na',         en:'After',    color:'#2E7D32', bg:'#E8F5E9' },
  { key:'probleem',   nl:'Probleem',   en:'Issue',    color:'#B71C1C', bg:'#FFEBEE' },
  { key:'materiaal',  nl:'Materiaal',  en:'Material', color:'#7B1FA2', bg:'#F3E5F5' },
  { key:'overig',     nl:'Overig',     en:'Other',    color:'#607D8B', bg:'#ECEFF1' },
]

function getCatStyle(key) { return CATEGORIES.find(c => c.key === key) || CATEGORIES[5] }
function fmtDate(d) {
  if (!d) return '—'
  return d.toString().slice(0, 10).split('-').reverse().join('-')
}

// Support snake_case (DB) and camelCase
function g(o, camel, snake) { return o[camel] !== undefined ? o[camel] : o[snake] }

/* ── Confirm Modal (inline) ──────────────────────────────────────────────── */
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
          <button
            onClick={onCancel}
            style={{
              padding:'8px 18px', borderRadius:8, border:'1px solid #E0E0E0',
              background:'white', color:'#555', fontSize:13.5, fontWeight:500, cursor:'pointer',
            }}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding:'8px 18px', borderRadius:8, border:'none',
              background:'#C8102E', color:'white',
              fontSize:13.5, fontWeight:600, cursor:'pointer',
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PhotosPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fileRef = useRef()

  const [photos,         setPhotos]         = useState([])
  const [projects,       setProjects]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [filterProject,  setFilterProject]  = useState('')
  const [filterCat,      setFilterCat]      = useState('')
  const [viewMode,       setViewMode]       = useState('grid')
  const [lightbox,       setLightbox]       = useState(null)
  const [uploadModal,    setUploadModal]    = useState(false)
  const [editPhoto,      setEditPhoto]      = useState(null)
  const [uploadCategory, setUploadCategory] = useState('uitvoering')
  const [confirmId,      setConfirmId]      = useState(null)

  const confirmPhoto = photos.find(p => p.id === confirmId)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [ph, pr] = await Promise.all([api.get('/photos'), api.get('/projects')])
      setPhotos(ph); setProjects(pr)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return photos.filter(p => {
      const caption     = p.caption     || ''
      const projectName = g(p,'projectName','project_name') || ''
      const tags        = p.tags || []
      if (q && !caption.toLowerCase().includes(q) && !projectName.toLowerCase().includes(q) && !tags.some(t => t.includes(q))) return false
      if (filterProject && String(g(p,'projectId','project_id')) !== filterProject) return false
      if (filterCat && p.category !== filterCat) return false
      return true
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [photos, search, filterProject, filterCat])

  const byProject = useMemo(() => {
    const map = {}
    filtered.forEach(p => {
      const pid  = g(p,'projectId','project_id')
      const pnam = g(p,'projectName','project_name') || 'Geen project'
      if (!map[pid]) map[pid] = { name: pnam, photos: [] }
      map[pid].photos.push(p)
    })
    return Object.entries(map)
  }, [filtered])

  const lbIndex = lightbox ? filtered.findIndex(p => p.id === lightbox.id) : -1

  async function handleFiles(files) {
    const arr = Array.from(files)
    const selectedProject = projects.find(p => String(p.id) === filterProject) || projects[0]
    for (const file of arr) {
      const url = URL.createObjectURL(file)
      try {
        const created = await api.post('/photos', {
          projectId:   selectedProject?.id   || null,
          projectName: selectedProject?.name || '',
          url, thumbnail: url,
          caption:     file.name.replace(/\.[^.]+$/, ''),
          category:    uploadCategory,
          uploadedBy:  'Jan de Vries',
          date:        new Date().toISOString().slice(0, 10),
          tags:        [],
        })
        setPhotos(ps => [created, ...ps])
      } catch (e) { console.error(e) }
    }
    setUploadModal(false)
  }

  async function saveEdit(photo) {
    try {
      const updated = await api.put(`/photos/${photo.id}`, {
        projectId:   g(photo,'projectId','project_id'),
        projectName: g(photo,'projectName','project_name'),
        caption:     photo.caption,
        category:    photo.category,
        tags:        photo.tags || [],
      })
      setPhotos(ps => ps.map(p => p.id === photo.id ? updated : p))
      setEditPhoto(null)
    } catch (e) { alert(e.message) }
  }

  async function deletePhoto(id) {
    try {
      await api.delete(`/photos/${id}`)
      setPhotos(ps => ps.filter(p => p.id !== id))
      if (lightbox?.id === id) setLightbox(null)
    } catch (e) { alert(e.message) }
  }

  function handleConfirmDelete() {
    if (confirmId) {
      deletePhoto(confirmId)
      setConfirmId(null)
    }
  }

  // Stats per category
  const catCounts = useMemo(() => {
    const m = {}
    CATEGORIES.forEach(c => { m[c.key] = photos.filter(p => p.category === c.key).length })
    return m
  }, [photos])

  if (loading) return <PhotosSkeleton lang={lang} lbl={lbl} viewMode={viewMode} />

  return (
    <div className={styles.page}>

      {/* Confirm delete */}
      {confirmId && (
        <ConfirmModal
          title={lbl('Foto verwijderen', 'Delete photo')}
          message={lbl(
            `Weet u zeker dat u deze foto wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
            `Are you sure you want to delete this photo? This cannot be undone.`
          )}
          confirmLabel={lbl('Verwijderen', 'Delete')}
          cancelLabel={lbl('Annuleren', 'Cancel')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl("Foto's chantier",'Site photos')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Voor, tijdens en na de werkzaamheden','Before, during and after works')}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode==='grid'?styles.viewBtnActive:''}`} onClick={() => setViewMode('grid')}>⊞ {lbl('Raster','Grid')}</button>
            <button className={`${styles.viewBtn} ${viewMode==='project'?styles.viewBtnActive:''}`} onClick={() => setViewMode('project')}>📁 {lbl('Per project','By project')}</button>
          </div>
          <button className={styles.addBtn} onClick={() => setUploadModal(true)}>
            <Plus size={15}/>{lbl("Foto's uploaden",'Upload photos')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{photos.length}</span>
          <span className={styles.statLbl}>{lbl("Totaal foto's",'Total photos')}</span>
        </div>
        {CATEGORIES.slice(0,4).map(c => (
          <div key={c.key} className={styles.statCard} style={{ borderLeftColor: c.color }}>
            <span className={styles.statVal} style={{ color: c.color }}>{catCounts[c.key] || 0}</span>
            <span className={styles.statLbl}>{lang==='nl'?c.nl:c.en}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon}/>
          <input className={styles.searchInput}
            placeholder={lbl('Zoeken op bijschrift, tag…','Search caption, tag…')}
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{ color:'var(--grey-300)' }}/>
          <select className={styles.filterSelect} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">{lbl('Alle projecten','All projects')}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">{lbl('Alle categorieën','All categories')}</option>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{lang==='nl'?c.nl:c.en}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <Camera size={44} style={{ display:'block', margin:'0 auto 12px', color:'var(--grey-200)' }}/>
          <p>{lbl("Geen foto's gevonden",'No photos found')}</p>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map(photo => {
            const cat = getCatStyle(photo.category)
            return (
              <div key={photo.id} className={styles.card}>
                <div className={styles.cardImg} onClick={() => setLightbox(photo)}>
                  <img src={photo.thumbnail || photo.url} alt={photo.caption} loading="lazy"/>
                  <div className={styles.cardOverlay}><ZoomIn size={22} className={styles.zoomIcon}/></div>
                  <span className={styles.catBadge} style={{ background: cat.bg, color: cat.color }}>
                    {lang==='nl'?cat.nl:cat.en}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardCaption}>{photo.caption || '—'}</p>
                  <div className={styles.cardMeta}>
                    <span><Calendar size={10}/>{fmtDate(photo.date)}</span>
                    {photo.uploaded_by && <span><User size={10}/>{photo.uploaded_by}</span>}
                  </div>
                  {g(photo,'projectName','project_name') && (
                    <p className={styles.cardProject}>{g(photo,'projectName','project_name')}</p>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.cardBtn} onClick={() => setEditPhoto({...photo})}><Edit3 size={13}/></button>
                  <button className={`${styles.cardBtn} ${styles.cardBtnRed}`} onClick={() => setConfirmId(photo.id)}><Trash2 size={13}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PROJECT VIEW */}
      {viewMode === 'project' && filtered.length > 0 && (
        <div className={styles.projectGroups}>
          {byProject.map(([pid, group]) => (
            <div key={pid} className={styles.projectGroup}>
              <h3 className={styles.projectGroupTitle}>
                📁 {group.name} <span className={styles.projectGroupCount}>{group.photos.length} {lbl("foto's",'photos')}</span>
              </h3>
              <div className={styles.grid}>
                {group.photos.map(photo => {
                  const cat = getCatStyle(photo.category)
                  return (
                    <div key={photo.id} className={styles.card}>
                      <div className={styles.cardImg} onClick={() => setLightbox(photo)}>
                        <img src={photo.thumbnail||photo.url} alt={photo.caption} loading="lazy"/>
                        <span className={styles.catBadge} style={{ background:cat.bg, color:cat.color }}>{lang==='nl'?cat.nl:cat.en}</span>
                      </div>
                      <div className={styles.cardBody}>
                        <p className={styles.cardCaption}>{photo.caption||'—'}</p>
                        <div className={styles.cardMeta}><span><Calendar size={10}/>{fmtDate(photo.date)}</span></div>
                      </div>
                      <div className={styles.cardActions}>
                        <button className={`${styles.cardBtn} ${styles.cardBtnRed}`} onClick={() => setConfirmId(photo.id)}><Trash2 size={13}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {uploadModal && (
        <div className={styles.modalOverlay} onClick={e => e.target===e.currentTarget&&setUploadModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{lbl("Foto's uploaden",'Upload photos')}</h3>
              <button onClick={() => setUploadModal(false)} className={styles.modalClose}><X size={16}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.mField}>
                <label>{lbl('Categorie','Category')}</label>
                <select className={styles.mInput} value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{lang==='nl'?c.nl:c.en}</option>)}
                </select>
              </div>
              <div className={styles.dropzone} onClick={() => fileRef.current?.click()}>
                <Camera size={36} className={styles.dropIcon}/>
                <p className={styles.dropText}>{lbl("Sleep foto's hierheen of klik om te selecteren",'Drop photos here or click to select')}</p>
                <input ref={fileRef} type="file" multiple accept="image/*" className={styles.fileInput}
                  onChange={e => handleFiles(e.target.files)}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit photo modal */}
      {editPhoto && (
        <div className={styles.modalOverlay} onClick={e => e.target===e.currentTarget&&setEditPhoto(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{lbl('Foto bewerken','Edit photo')}</h3>
              <button onClick={() => setEditPhoto(null)} className={styles.modalClose}><X size={16}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.mField}><label>{lbl('Bijschrift','Caption')}</label><input className={styles.mInput} value={editPhoto.caption||''} onChange={e => setEditPhoto(p=>({...p,caption:e.target.value}))}/></div>
              <div className={styles.mField}><label>{lbl('Categorie','Category')}</label>
                <select className={styles.mInput} value={editPhoto.category} onChange={e => setEditPhoto(p=>({...p,category:e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{lang==='nl'?c.nl:c.en}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setEditPhoto(null)}>{lbl('Annuleren','Cancel')}</button>
              <button className={styles.saveBtn} onClick={() => saveEdit(editPhoto)}>{lbl('Opslaan','Save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lbOverlay} onClick={() => setLightbox(null)}>
          <button className={styles.lbClose} onClick={() => setLightbox(null)}><X size={20}/></button>
          {lbIndex > 0 && <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={e => { e.stopPropagation(); setLightbox(filtered[lbIndex-1]) }}><ChevronLeft size={24}/></button>}
          {lbIndex < filtered.length-1 && <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={e => { e.stopPropagation(); setLightbox(filtered[lbIndex+1]) }}><ChevronRight size={24}/></button>}
          <div className={styles.lbContent} onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption} className={styles.lbImage}/>
            <div className={styles.lbInfo}>
              <p className={styles.lbCaption}>{lightbox.caption}</p>
              {g(lightbox,'projectName','project_name') && <p className={styles.lbProject}>{g(lightbox,'projectName','project_name')}</p>}
              <div className={styles.lbActions}>
                <button className={styles.lbDelBtn} onClick={() => { setConfirmId(lightbox.id); }}>
                  <Trash2 size={13}/>{lbl('Verwijderen','Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function SkeletonPhotoCard({ index }) {
  const captionWidths = ['75%', '60%', '85%', '70%']
  const ratio = index % 3 === 0 ? 1.15 : index % 3 === 1 ? 0.85 : 1

  return (
    <div className={styles.card} style={{ pointerEvents: 'none' }}>
      <div className={styles.cardImg} style={{ paddingTop: `${ratio * 70}%`, position: 'relative', overflow: 'hidden' }}>
        <Shimmer
          w="100%"
          h="100%"
          r={0}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <Shimmer
          w={70}
          h={20}
          r={10}
          style={{ position: 'absolute', top: 10, left: 10 }}
        />
      </div>
      <div className={styles.cardBody}>
        <Shimmer w={captionWidths[index % captionWidths.length]} h={13} style={{ marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
          <Shimmer w={70} h={10} />
          <Shimmer w={60} h={10} />
        </div>
        <Shimmer w={`${50 + (index % 2) * 15}%`} h={10} />
      </div>
      <div className={styles.cardActions}>
        <Shimmer w={28} h={28} r={6} />
        <Shimmer w={28} h={28} r={6} />
      </div>
    </div>
  )
}

function SkeletonProjectGroup({ index }) {
  return (
    <div className={styles.projectGroup}>
      <div style={{ marginBottom: 14 }}>
        <Shimmer w={200} h={16} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPhotoCard key={i} index={i + index} />
        ))}
      </div>
    </div>
  )
}

function PhotosSkeleton({ lang, lbl, viewMode }) {
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
          <h1 className={styles.pageTitle}>{lbl("Foto's chantier",'Site photos')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Voor, tijdens en na de werkzaamheden','Before, during and after works')}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <Shimmer w={90} h={32} r={6} />
            <Shimmer w={110} h={32} r={6} />
          </div>
          <Shimmer w={160} h={38} r={8} />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} style={{ borderLeftColor: '#e0e0e0' }}>
          <Shimmer w={40} h={22} style={{ marginBottom: 6 }} />
          <Shimmer w={90} h={11} />
        </div>
        {CATEGORIES.slice(0,4).map(c => (
          <div key={c.key} className={styles.statCard} style={{ borderLeftColor: c.color, pointerEvents: 'none' }}>
            <Shimmer w={40} h={22} style={{ marginBottom: 6 }} />
            <Shimmer w={70} h={11} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Shimmer w={14} h={14} r={4} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <Shimmer w="100%" h={38} r={8} />
        </div>
        <div className={styles.filters}>
          <Shimmer w={14} h={14} r={4} />
          <Shimmer w={150} h={38} r={8} />
          <Shimmer w={150} h={38} r={8} />
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonPhotoCard key={i} index={i} />
          ))}
        </div>
      )}

      {/* Project view */}
      {viewMode === 'project' && (
        <div className={styles.projectGroups}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonProjectGroup key={i} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}