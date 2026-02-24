import { Routes, Route, Link, useLocation as useRouterLocation } from 'react-router-dom'
import { useLocation } from './context/LocationContext'
import { useAuth } from './context/AuthContext'
import ErrorBoundary, { RouteErrorFallback } from './components/ui/ErrorBoundary'
import ProtectedRoute from './components/ui/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import EventDetailPage from './pages/EventDetailPage'
import DiagnosticsPage from './pages/DiagnosticsPage'
import VenueDiagnosticsPage from './pages/VenueDiagnosticsPage'
import MapPage from './pages/MapPage'
import AiSearchPage from './pages/AiSearchPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import FavoritesPage from './pages/FavoritesPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import { useState } from 'react'

function NavLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const { pathname } = useRouterLocation()
  const isActive = pathname === to
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 hover:border-indigo-300"
      >
        Sign in
      </Link>
    )
  }

  const initials = (user.displayName ?? user.email ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-200"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            <div className="border-b border-gray-100 px-3 py-2">
              <p className="truncate text-xs font-medium text-gray-700">{user.displayName ?? 'User'}</p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </Link>
            <Link
              to="/favorites"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Favorites
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Settings
            </Link>
            <button
              onClick={() => { signOut(); setOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function App() {
  const { label, status } = useLocation()
  const { pathname } = useRouterLocation()
  const isMapPage = pathname === '/map'

  return (
    <div className="app-shell text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-indigo-200/60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                EventFinder<span className="text-violet-600">.</span>
              </h1>
              {status === 'success' ? (
                <p className="text-xs text-slate-500">{label}</p>
              ) : (
                <p className="text-xs font-medium text-violet-500/70">Live events near you</p>
              )}
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 sm:flex">
            <NavLink
              to="/"
              label="Home"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              }
            />
            <NavLink
              to="/search"
              label="Search"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              }
            />
            <NavLink
              to="/map"
              label="Map"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
              }
            />
            <NavLink
              to="/ai"
              label="AI Search"
              icon={<span className="text-sm leading-none">✨</span>}
            />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main content — no padding/max-width wrapper for MapPage */}
      <ErrorBoundary fallback={<RouteErrorFallback />}>
        <main className={isMapPage ? '' : 'mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-8'}>
          <Routes>
            <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />
            <Route path="/event/:id" element={<ErrorBoundary><EventDetailPage /></ErrorBoundary>} />
            <Route path="/map" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
            <Route path="/ai" element={<ErrorBoundary><AiSearchPage /></ErrorBoundary>} />
            <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
            <Route path="/signup" element={<ErrorBoundary><SignUpPage /></ErrorBoundary>} />
            <Route path="/favorites" element={<ErrorBoundary><ProtectedRoute><FavoritesPage /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><ProtectedRoute><ProfilePage /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><ProtectedRoute><SettingsPage /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/diagnostics" element={<ErrorBoundary><DiagnosticsPage /></ErrorBoundary>} />
            <Route path="/venues" element={<ErrorBoundary><VenueDiagnosticsPage /></ErrorBoundary>} />
          </Routes>
        </main>
      </ErrorBoundary>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:hidden">
        <div className="flex">
          <MobileNavItem to="/" label="Home" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          } />
          <MobileNavItem to="/search" label="Search" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          } />
          <MobileNavItem to="/map" label="Map" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
          } />
          <MobileNavItem to="/ai" label="AI" icon={<span className="text-xl leading-none">✨</span>} />
          <MobileNavItem to="/profile" label="Profile" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          } />
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="app-shell__spacer h-16 sm:hidden" />
    </div>
  )
}

function MobileNavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const { pathname } = useRouterLocation()
  const isActive = pathname === to
  return (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
        isActive ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export default App
