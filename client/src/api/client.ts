import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Firebase ID token if user is signed in
apiClient.interceptors.request.use(async (config) => {
  try {
    const { auth } = await import('./firebaseAuth')
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // Firebase not configured or user not signed in — proceed unauthenticated
  }
  return config
})
