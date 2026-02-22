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
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? 'bg-white/20 text-white' : 'text-indigo-200 hover:text-white'
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
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-200 hover:text-white transition-colors"
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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white hover:bg-white/30 transition-colors"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div>
              <h1 className="text-lg font-bold leading-tight">Local Event Finder</h1>
              {status === 'success' && (
                <p className="text-xs text-indigo-200">{label}</p>
              )}
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
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
            <NavLink
              to="/venues"
              label="Venues"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
              }
            />
            <NavLink
              to="/diagnostics"
              label="Diagnostics"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              }
            />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main content — no padding/max-width wrapper for MapPage */}
      <ErrorBoundary fallback={<RouteErrorFallback />}>
        <main className={isMapPage ? '' : 'mx-auto max-w-7xl px-4 py-6 pb-20 sm:pb-6'}>
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
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white sm:hidden">
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
      <div className="h-16 sm:hidden" />
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
        isActive ? 'text-indigo-600' : 'text-gray-500'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export default App
