import type { Request, Response, NextFunction } from 'express'
import * as userService from '../services/user.service.js'
import { logger } from '../utils/logger.js'

export async function syncUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid, email } = res.locals as { firebaseUid: string; email: string }
    const { displayName, photoUrl } = req.body as { displayName?: string; photoUrl?: string }
    const user = await userService.syncUser(firebaseUid, email, displayName ?? null, photoUrl ?? null)
    logger.info({ event: 'user_sync_success', firebaseUid }, 'User synced')
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

export async function deleteAccountHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    await userService.deleteAccount(firebaseUid)
    logger.info({ event: 'account_deleted', firebaseUid }, 'User account deleted')
    res.json({ ok: true, message: 'Account and all associated data have been deleted.' })
  } catch (err) {
    next(err)
  }
}

export async function exportDataHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const { firebaseUid } = res.locals as { firebaseUid: string }
    const data = await userService.exportUserData(firebaseUid)
    logger.info({ event: 'data_export', firebaseUid }, 'User data exported')
    res.setHeader('Content-Disposition', 'attachment; filename="my-eventfinder-data.json"')
    res.json(data)
  } catch (err) {
    next(err)
  }
}
