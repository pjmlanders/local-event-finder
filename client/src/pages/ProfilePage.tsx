import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getFavorites } from '../api/users'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 5 * 60 * 1000,
  })

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (!user) return null

  const initials = (user.displayName ?? user.email ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Unknown'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
            {initials}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.displayName ?? 'User'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-indigo-600">{favorites.length}</p>
          <p className="text-sm text-gray-500 mt-1">Saved events</p>
        </div>
        <Link
          to="/favorites"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-indigo-300 transition-colors block"
        >
          <p className="text-3xl font-bold text-indigo-600">♥</p>
          <p className="text-sm text-gray-500 mt-1">View favorites</p>
        </Link>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 shadow-sm overflow-hidden">
        <Link
          to="/settings"
          className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">Settings & Preferences</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-between px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="font-medium">Sign out</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
