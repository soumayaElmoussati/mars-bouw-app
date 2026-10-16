import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/dashboard/Dashboardpage'
import ClientsPage from './pages/clients/ClientsPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import PlanningPage from './pages/planning/PlanningPage'
import TimetrackingPage from './pages/timetracking/TimetrackingPage'
import TasksPage from './pages/tasks/TasksPage'
import StockPage from './pages/stock/StockPage'
import FinancePage from './pages/finance/FinancePage'
import PhotosPage from './pages/photos/PhotosPage'
import SubcontractorsPage from './pages/subcontractors/SubcontractorsPage'
import ReportsPage from './pages/reports/ReportsPage'
import WerkbonPage from './pages/werkbon/WerkbonPage'
import ChecklistPage from './pages/checklist/ChecklistPage'
import GanttPage from './pages/gantt/GanttPage'
import CRMPage from './pages/crm/CRMPage'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'

/* ───────────────────────── SHIMMER ───────────────────────── */

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

/* ───────────────────────── APP-LEVEL SKELETON ─────────────────────────
   Utilisé pendant le chargement de l'AuthContext (loading=true)
   avant même que le Layout ou les routes soient montés.
   ─────────────────────────────────────────────────────────────────────── */

function AppBootstrapSkeleton() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f6f8',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Topbar */}
      <div style={{
        height: 60,
        background: '#fff',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shimmer w={32} h={32} r={8} />
          <Shimmer w={140} h={16} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shimmer w={90} h={32} r={8} />
          <Shimmer w={36} h={36} r={18} />
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: 240,
          background: '#fff',
          borderRight: '1px solid #eee',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <Shimmer w={18} h={18} r={4} />
              <Shimmer w={`${50 + (i % 4) * 12}%`} h={13} />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 24 }}>
          {/* Page header */}
          <div style={{ marginBottom: 24 }}>
            <Shimmer w={220} h={26} style={{ marginBottom: 8 }} />
            <Shimmer w={320} h={14} />
          </div>

          {/* KPI row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 18,
                borderTop: '3px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <Shimmer w={36} h={36} r={8} />
                <div style={{ flex: 1 }}>
                  <Shimmer w={70} h={18} style={{ marginBottom: 6 }} />
                  <Shimmer w={90} h={11} />
                </div>
              </div>
            ))}
          </div>

          {/* Content blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 20,
                minHeight: 180,
              }}>
                <Shimmer w={150} h={15} style={{ marginBottom: 16 }} />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid #f3f3f3',
                  }}>
                    <Shimmer w={32} h={32} r={16} />
                    <div style={{ flex: 1 }}>
                      <Shimmer w={`${55 + (j % 3) * 12}%`} h={12} style={{ marginBottom: 5 }} />
                      <Shimmer w="40%" h={10} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── ROUTES ───────────────────────── */

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <AppBootstrapSkeleton />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <AppBootstrapSkeleton />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { logout } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"       element={<DashboardPage />} />
        <Route path="clients"         element={<ClientsPage />} />
        <Route path="projects"        element={<ProjectsPage />} />
        <Route path="planning"        element={<PlanningPage />} />
        <Route path="timetracking"    element={<TimetrackingPage />} />
        <Route path="tasks"           element={<TasksPage />} />
        <Route path="stock"           element={<StockPage />} />
        <Route path="invoices"        element={<FinancePage />} />
        <Route path="photos"          element={<PhotosPage />} />
        <Route path="subcontractors"  element={<SubcontractorsPage />} />
        <Route path="reports"         element={<ReportsPage />} />
        <Route path="werkbon"         element={<WerkbonPage />} />
        <Route path="checklist"       element={<ChecklistPage />} />
        <Route path="gantt"           element={<GanttPage />} />
        <Route path="crm"             element={<CRMPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}