import { Suspense, lazy, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FileText, LayoutDashboard, LibraryBig, LogOut, Settings2, UsersRound } from 'lucide-react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { formatUserRole } from './lib/labels'

const queryClient = new QueryClient()
const DashboardPage = lazy(async () => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const DocumentationPage = lazy(async () => import('./pages/DocumentationPage').then((module) => ({ default: module.DocumentationPage })))
const EducationPage = lazy(async () => import('./pages/EducationPage').then((module) => ({ default: module.EducationPage })))
const LeadDetailPage = lazy(async () => import('./pages/LeadDetailPage').then((module) => ({ default: module.LeadDetailPage })))
const LeadsPage = lazy(async () => import('./pages/LeadsPage').then((module) => ({ default: module.LeadsPage })))
const LoginPage = lazy(async () => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const SettingsPage = lazy(async () => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

function AppShell() {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(243,114,44,0.18),_transparent_30%),linear-gradient(180deg,_#fff9ef_0%,_#fffefe_38%,_#f7f4ee_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 md:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:flex">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-500">Focar Lab</p>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-slate-950">CRM focado em automacao</h1>
            <p className="mt-3 text-sm text-slate-500">Comercial, operacao e jornada do aluno em um workspace pronto para escala.</p>
          </div>

          <nav className="space-y-2">
            <SidebarLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Painel</SidebarLink>
            <SidebarLink to="/leads" icon={<UsersRound className="h-4 w-4" />}>Leads</SidebarLink>
            <SidebarLink to="/education" icon={<LibraryBig className="h-4 w-4" />}>Educacao</SidebarLink>
            <SidebarLink to="/documentation" icon={<FileText className="h-4 w-4" />}>Documentacao</SidebarLink>
            <SidebarLink to="/settings" icon={<Settings2 className="h-4 w-4" />}>Configuracoes</SidebarLink>
          </nav>

          <div className="mt-auto rounded-[1.5rem] border border-slate-200/70 bg-slate-950 p-4 text-slate-50">
            <p className="text-sm font-semibold">{user?.fullName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-orange-300">{formatUserRole(user?.role)}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/80 px-5 py-4 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-500">Central de Operacoes</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Focar Lab CRM</h2>
              </div>

              <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-500">
                Conectado como <span className="font-semibold text-slate-900">{user?.email}</span>
              </div>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200/80 px-5 py-4 xl:hidden md:px-8">
            <SidebarLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Painel</SidebarLink>
            <SidebarLink to="/leads" icon={<UsersRound className="h-4 w-4" />}>Leads</SidebarLink>
            <SidebarLink to="/education" icon={<LibraryBig className="h-4 w-4" />}>Educacao</SidebarLink>
            <SidebarLink to="/documentation" icon={<FileText className="h-4 w-4" />}>Documentacao</SidebarLink>
            <SidebarLink to="/settings" icon={<Settings2 className="h-4 w-4" />}>Configuracoes</SidebarLink>
          </nav>

          <div className="flex-1 px-5 py-5 md:px-8 md:py-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarLink({
  children,
  icon,
  to,
}: {
  children: ReactNode
  icon: ReactNode
  to: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  )
}

function AppRoutes() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-soft">
          Conectando ao workspace do CRM...
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<RouteLoadingState />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:leadId" element={<LeadDetailPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function RouteLoadingState() {
  return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-soft">
          Carregando a tela do workspace...
        </div>
      </div>
    )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '1rem',
                background: '#0f172a',
                color: '#fff',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
