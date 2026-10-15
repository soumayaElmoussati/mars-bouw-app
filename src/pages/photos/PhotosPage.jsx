import { useState, useMemo, useRef } from 'react'
import {
  Plus, Search, Filter, X, ZoomIn,
  Camera, Calendar, User, Tag, Trash2, Edit3, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { photosSeed } from '../../data/photosSeed'
import { projectsSeed } from '../../data/projectsSeed'
import styles from './PhotosPage.module.css'

const CATEGORIES = [
  { key: 'voor',       nl: 'Voor',       en: 'Before',   color: '#1565C0', bg: '#E3F2FD' },
  { key: 'uitvoering', nl: 'Uitvoering', en: 'During',   color: '#E65100', bg: '#FFF3E0' },
  { key: 'na',         nl: 'Na',         en: 'After',    color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'probleem',   nl: 'Probleem',   en: 'Issue',    color: '#B71C1C', bg: '#FFEBEE' },
  { key: 'materiaal',  nl: 'Materiaal',  en: 'Material', color: '#7B1FA2', bg: '#F3E5F5' },
  { key: 'overig',     nl: 'Overig',     en: 'Other',    color: '#607D8B', bg: '#ECEFF1' },
]

function getCatStyle(key) { return CATEGORIES.find(c => c.key === key) || CATEGORIES[5] }
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-'); return `${day}-${m}-${y}`
}

export default function PhotosPage() {
  const { lang } = useLang()
  const lbl = (nl, en) => lang === 'nl' ? nl : en
  const fileRef = useRef()

  const [photos, setPhotos]           = useState(photosSeed)
  const [search, setSearch]           = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [viewMode, setViewMode]       = useState('grid')
  const [lightbox, setLightbox]       = useState(null)
  const [uploadModal, setUploadModal] = useState(false)
  const [editPhoto, setEditPhoto]     = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return photos.filter(p => {
      if (q && !p.caption?.toLowerCase().includes(q) && !p.projectName?.toLowerCase().includes(q) && !(p.tags||[]).some(t => t.includes(q))) return false
      if (filterProject && String(p.projectId) !== filterProject) return false
      if (filterCat && p.category !== filterCat) return false
      return true
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [photos, search, filterProject, filterCat])

  const byProject = useMemo(() => {
    const map = {}
    filtered.forEach(p => {
      if (!map[p.projectId]) map[p.projectId] = { name: p.projectName, photos: [] }
      map[p.projectId].photos.push(p)
    })
    return Object.entries(map)
  }, [filtered])

  const lbIndex = lightbox ? filtered.findIndex(p => p.id === lightbox.id) : -1

  function handleFiles(files) {
    const arr = Array.from(files)
    const pr = projectsSeed.find(p => String(p.id) === filterProject) || projectsSeed[0]
    arr.forEach(file => {
      const url = URL.createObjectURL(file)
      setPhotos(ps => [{
        id: Date.now() + Math.random(), projectId: pr.id, projectName: pr.name,
        url, thumbnail: url, caption: file.name.replace(/\.[^.]+$/, ''),
        category: 'uitvoering', uploadedBy: 'Jan de Vries',
        date: new Date().toISOString().slice(0,10), tags: [],
      }, ...ps])
    })
    setUploadModal(false)
  }

  function deletePhoto(id) {
    setPhotos(ps => ps.filter(p => p.id !== id))
    if (lightbox?.id === id) setLightbox(null)
  }

  function saveEdit(updated) {
    setPhotos(ps => ps.map(p => p.id === updated.id ? updated : p))
    if (lightbox?.id === updated.id) setLightbox(updated)
    setEditPhoto(null)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{lbl("Foto's chantier",'Site photos')}</h1>
          <p className={styles.pageSubtitle}>{lbl('Voor, tijdens en na de werkzaamheden','Before, during and after works')}</p>
        </div>
        <div className={styles.headerBtns}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode==='grid'?styles.viewBtnActive:''}`} onClick={()=>setViewMode('grid')}>⊞ {lbl('Raster','Grid')}</button>
            <button className={`${styles.viewBtn} ${viewMode==='project'?styles.viewBtnActive:''}`} onClick={()=>setViewMode('project')}>📁 {lbl('Per project','By project')}</button>
          </div>
          <button className={styles.addBtn} onClick={()=>setUploadModal(true)}>
            <Plus size={15} /> {lbl("Foto's uploaden",'Upload photos')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}><span className={styles.statNum}>{photos.length}</span><span className={styles.statLbl}>{lbl("Totaal foto's",'Total photos')}</span></div>
        {CATEGORIES.slice(0,4).map(c => (
          <div key={c.key} className={`${styles.stat} ${styles.statClickable} ${filterCat===c.key?styles.statActive:''}`}
            style={{ borderLeftColor: c.color }}
            onClick={()=>setFilterCat(filterCat===c.key?'':c.key)}>
            <span className={styles.statNum} style={{ color: c.color }}>{photos.filter(p=>p.category===c.key).length}</span>
            <span className={styles.statLbl}>{lang==='nl'?c.nl:c.en}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder={lbl("Zoeken op bijschrift, tag…",'Search caption, tag…')} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className={styles.filters}>
          <Filter size={14} style={{color:'var(--grey-300)'}} />
          <select className={styles.filterSelect} value={filterProject} onChange={e=>setFilterProject(e.target.value)}>
            <option value="">{lbl('Alle projecten','All projects')}</option>
            {projectsSeed.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
            <option value="">{lbl('Alle categorieën','All categories')}</option>
            {CATEGORIES.map(c=><option key={c.key} value={c.key}>{lang==='nl'?c.nl:c.en}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <Camera size={44} style={{color:'var(--grey-200)',display:'block',margin:'0 auto 12px'}} />
          <p>{lbl("Geen foto's gevonden",'No photos found')}</p>
        </div>
      )}

      {/* Grid */}
      {viewMode==='grid' && filtered.length>0 && (
        <div className={styles.grid}>
          {filtered.map(photo=>(
            <PhotoCard key={photo.id} photo={photo} lang={lang}
              onOpen={()=>setLightbox(photo)}
              onEdit={()=>setEditPhoto(photo)}
              onDelete={()=>deletePhoto(photo.id)} />
          ))}
        </div>
      )}

      {/* By project */}
      {viewMode==='project' && byProject.map(([pid, group])=>(
        <div key={pid} className={styles.projectGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupTitle}>{group.name}</span>
            <span className={styles.groupCount}>{group.photos.length} {lbl("foto's",'photos')}</span>
          </div>
          <div className={styles.grid}>
            {group.photos.map(photo=>(
              <PhotoCard key={photo.id} photo={photo} lang={lang}
                onOpen={()=>setLightbox(photo)}
                onEdit={()=>setEditPhoto(photo)}
                onDelete={()=>deletePhoto(photo.id)} />
            ))}
          </div>
        </div>
      ))}

      {/* Upload modal */}
      {uploadModal && <UploadModal lang={lang} fileRef={fileRef} onFiles={handleFiles} onClose={()=>setUploadModal(false)} />}

      {/* Edit modal */}
      {editPhoto && <EditModal photo={editPhoto} lang={lang} onSave={saveEdit} onClose={()=>setEditPhoto(null)} />}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lbOverlay} onClick={()=>setLightbox(null)}>
          <button className={styles.lbClose} onClick={()=>setLightbox(null)}><X size={20}/></button>
          {lbIndex>0 && <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={e=>{e.stopPropagation();setLightbox(filtered[lbIndex-1])}}><ChevronLeft size={24}/></button>}
          {lbIndex<filtered.length-1 && <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={e=>{e.stopPropagation();setLightbox(filtered[lbIndex+1])}}><ChevronRight size={24}/></button>}
          <div className={styles.lbContent} onClick={e=>e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption} className={styles.lbImage} />
            <div className={styles.lbInfo}>
              {(() => { const c=getCatStyle(lightbox.category); return <span className={styles.lbCat} style={{background:c.bg,color:c.color}}>{lang==='nl'?c.nl:c.en}</span> })()}
              <p className={styles.lbCaption}>{lightbox.caption}</p>
              {lightbox.projectName && <p className={styles.lbProject}>{lightbox.projectName}</p>}
              <div className={styles.lbMeta}>
                <span><Calendar size={11}/>{fmtDate(lightbox.date)}</span>
                <span><User size={11}/>{lightbox.uploadedBy}</span>
              </div>
              {(lightbox.tags||[]).length>0 && (
                <div className={styles.lbTags}>
                  {lightbox.tags.map(t=><span key={t} className={styles.lbTag}><Tag size={9}/>{t}</span>)}
                </div>
              )}
              <div className={styles.lbActions}>
                <button className={styles.lbEditBtn} onClick={()=>{setEditPhoto(lightbox);setLightbox(null)}}><Edit3 size={13}/>{lang==='nl'?'Bewerken':'Edit'}</button>
                <button className={styles.lbDelBtn} onClick={()=>deletePhoto(lightbox.id)}><Trash2 size={13}/>{lang==='nl'?'Verwijderen':'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoCard({ photo, lang, onOpen, onEdit, onDelete }) {
  const cat = getCatStyle(photo.category)
  return (
    <div className={styles.card}>
      <div className={styles.cardImg} onClick={onOpen}>
        <img src={photo.thumbnail||photo.url} alt={photo.caption} loading="lazy" />
        <div className={styles.cardOverlay}><ZoomIn size={22} className={styles.zoomIcon}/></div>
        <span className={styles.catBadge} style={{background:cat.bg,color:cat.color}}>{lang==='nl'?cat.nl:cat.en}</span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardCaption}>{photo.caption||'—'}</p>
        <div className={styles.cardMeta}>
          <span><Calendar size={10}/> {photo.date}</span>
          {photo.uploadedBy && <span><User size={10}/> {photo.uploadedBy}</span>}
        </div>
        {photo.projectName && <p className={styles.cardProject}>{photo.projectName}</p>}
      </div>
      <div className={styles.cardActions}>
        <button className={styles.cardBtn} onClick={onEdit}><Edit3 size={13}/></button>
        <button className={`${styles.cardBtn} ${styles.cardBtnRed}`} onClick={onDelete}><Trash2 size={13}/></button>
      </div>
    </div>
  )
}

function UploadModal({ lang, fileRef, onFiles, onClose }) {
  const lbl = (nl, en) => lang==='nl'?nl:en
  const [drag, setDrag] = useState(false)
  return (
    <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{lbl("Foto's uploaden",'Upload photos')}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={16}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={`${styles.dropzone} ${drag?styles.dropActive:''}`}
            onDragOver={e=>{e.preventDefault();setDrag(true)}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);onFiles(e.dataTransfer.files)}}
            onClick={()=>fileRef.current?.click()}>
            <Camera size={36} className={styles.dropIcon}/>
            <p className={styles.dropText}>{lbl("Sleep foto's hierheen of klik om te uploaden",'Drop photos here or click to upload')}</p>
            <p className={styles.dropHint}>JPG, PNG, WEBP — max 20MB</p>
            <input ref={fileRef} type="file" multiple accept="image/*" className={styles.fileInput} onChange={e=>onFiles(e.target.files)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EditModal({ photo, lang, onSave, onClose }) {
  const lbl = (nl, en) => lang==='nl'?nl:en
  const [data, setData] = useState({...photo})
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !(data.tags||[]).includes(t)) setData(d=>({...d,tags:[...(d.tags||[]),t]}))
    setTagInput('')
  }

  return (
    <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{lbl('Foto bewerken','Edit photo')}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={16}/></button>
        </div>
        <div className={styles.modalBody}>
          <img src={data.thumbnail||data.url} alt="" className={styles.editPreview}/>
          <div className={styles.editField}>
            <label>{lbl('Bijschrift','Caption')}</label>
            <input className={styles.editInput} value={data.caption||''} onChange={e=>setData(d=>({...d,caption:e.target.value}))} />
          </div>
          <div className={styles.editRow}>
            <div className={styles.editField}>
              <label>{lbl('Categorie','Category')}</label>
              <select className={styles.editSelect} value={data.category} onChange={e=>setData(d=>({...d,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c.key} value={c.key}>{lang==='nl'?c.nl:c.en}</option>)}
              </select>
            </div>
            <div className={styles.editField}>
              <label>{lbl('Project','Project')}</label>
              <select className={styles.editSelect} value={data.projectId} onChange={e=>{
                const p=projectsSeed.find(p=>String(p.id)===e.target.value)
                setData(d=>({...d,projectId:+e.target.value,projectName:p?.name||''}))
              }}>
                {projectsSeed.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.editField}>
            <label>Tags</label>
            <div className={styles.tagRow}>
              <input className={styles.editInput} value={tagInput} onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} placeholder={lbl('Tag toevoegen…','Add tag…')} />
              <button type="button" className={styles.tagAddBtn} onClick={addTag}><Plus size={13}/></button>
            </div>
            {(data.tags||[]).length>0 && (
              <div className={styles.tagsList}>
                {data.tags.map(t=>(
                  <span key={t} className={styles.tagChip}>{t}
                    <button onClick={()=>setData(d=>({...d,tags:d.tags.filter(x=>x!==t)}))} className={styles.tagRemove}><X size={10}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>{lbl('Annuleren','Cancel')}</button>
          <button className={styles.saveBtn} onClick={()=>onSave(data)}>{lbl('Opslaan','Save')}</button>
        </div>
      </div>
    </div>
  )
}