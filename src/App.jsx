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

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Laden…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Laden…</div>
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