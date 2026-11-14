import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  NavLink,
  Link,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'
import PatientProfilePage from './pages/PatientProfilePage'
import DashboardPage from './pages/DashboardPage'
import { HabitsTemplatesPage } from './pages/HabitsTemplatesPage'
import { CrmKanban } from '@/components/crm/CrmKanban'
import { CrmProvider } from '@/stores/useCrmStore'

const crmNav = [
  { to: '/crm', label: 'Funil', end: true },
  { to: '/crm/dashboard', label: 'Dashboard' },
  { to: '/crm/templates', label: 'Hábitos & Templates' },
]

const CrmLayout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link to="/crm" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              KB
            </span>
            CRM Atalaia
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {crmNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 transition ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Ver site público ↗
        </Link>
      </div>
    </header>
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Outlet />
    </main>
  </div>
)

const App = () => (
  <BrowserRouter>
    <TooltipProvider delayDuration={0}>
      <CrmProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/crm" element={<CrmLayout />}>
            <Route index element={<CrmKanban />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="templates" element={<HabitsTemplatesPage />} />
            <Route path="pacientes/:id" element={<PatientProfilePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CrmProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
