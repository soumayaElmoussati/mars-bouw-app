import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger = true }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .15s ease',
      }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        background: 'white', borderRadius: 14, padding: '28px 28px 24px',
        width: 400, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'slideUp .2s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: danger ? '#FFF0F3' : '#EEF5FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle size={22} color={danger ? '#C8102E' : '#1A3E6F'}/>
        </div>

        {/* Text */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px', borderRadius: 8, border: '1px solid #E0E0E0',
              background: 'white', color: '#555', fontSize: 13.5, fontWeight: 500,
              cursor: 'pointer', transition: 'background .15s',
            }}
            onMouseEnter={e => e.target.style.background = '#F5F5F5'}
            onMouseLeave={e => e.target.style.background = 'white'}
          >
            {cancelLabel || 'Annuleren'}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: danger ? '#C8102E' : '#1A3E6F',
              color: 'white', fontSize: 13.5, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity .15s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            {confirmLabel || 'Verwijderen'}
          </button>
        </div>
      </div>
    </div>
  )
}