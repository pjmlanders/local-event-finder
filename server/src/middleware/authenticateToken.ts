import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

let adminApp: import('firebase-admin/app').App | null = null

async function getAdminAuth() {
  if (!adminApp) {
    const { initializeApp, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not configured')
    }

    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY)
    adminApp = initializeApp({ credential: cert(serviceAccount) }, 'admin')
    return getAuth(adminApp)
  }

  const { getAuth } = await import('firebase-admin/auth')
  return getAuth(adminApp)
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header', statusCode: 401 })
    return
  }

  const token = authHeader.slice(7)
  try {
    const adminAuth = await getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(token)
    res.locals.firebaseUid = decoded.uid
    res.locals.email = decoded.email ?? ''
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token', statusCode: 401 })
  }
}
