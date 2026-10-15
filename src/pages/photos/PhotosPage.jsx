import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, Search, Filter, X, ZoomIn,
  Camera, Calendar, User, Trash2, Edit3, ChevronLeft, ChevronRight
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
    if (!confirm(lbl('Foto verwijderen?','Delete photo?'))) return
    try {
      await api.delete(`/photos/${id}`)
      setPhotos(ps => ps.filter(p => p.id !== id))
      if (lightbox?.id === id) setLightbox(null)
    } catch (e) { alert(e.message) }
  }

  // Stats per category
  const catCounts = useMemo(() => {
    const m = {}
    CATEGORIES.forEach(c => { m[c.key] = photos.filter(p => p.category === c.key).length })
    return m
  }, [photos])

  if (loading) return (
    <div className={styles.page}>
      <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
        <div style={{ width:32, height:32, border:'3px solid #e0e0e0', borderTopColor:'#1A3E6F', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
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
                  <button className={`${styles.cardBtn} ${styles.cardBtnRed}`} onClick={() => deletePhoto(photo.id)}><Trash2 size={13}/></button>
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
                        <button className={`${styles.cardBtn} ${styles.cardBtnRed}`} onClick={() => deletePhoto(photo.id)}><Trash2 size={13}/></button>
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
                <button className={styles.lbDelBtn} onClick={() => deletePhoto(lightbox.id)}>
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