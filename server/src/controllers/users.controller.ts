import type { Request, Response, NextFunction } from 'express'
import * as userService from '../services/user.service.js'

export async function syncUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid, email } = res.locals as { firebaseUid: string; email: string }
    const { displayName, photoUrl } = req.body as { displayName?: string; photoUrl?: string }
    const user = await userService.syncUser(firebaseUid, email, displayName ?? null, photoUrl ?? null)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function getFavoritesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    const favorites = await userService.getUserFavorites(firebaseUid)
    res.json({ events: favorites })
  } catch (err) {
    next(err)
  }
}

export async function addFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    await userService.addFavorite(firebaseUid, req.body)
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function removeFavoriteHandler(req: Request<{ eventId: string }>, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    const { eventId } = req.params
    await userService.removeFavorite(firebaseUid, eventId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function getPreferencesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    const prefs = await userService.getUserPreferences(firebaseUid)
    res.json(prefs ?? {})
  } catch (err) {
    next(err)
  }
}

export async function updatePreferencesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    const prefs = await userService.upsertUserPreferences(firebaseUid, req.body)
    res.json(prefs)
  } catch (err) {
    next(err)
  }
}
