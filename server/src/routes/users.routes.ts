import { Router } from 'express'
import { authenticateToken } from '../middleware/authenticateToken.js'
import { validateBody } from '../middleware/validateRequest.js'
import { addFavoriteSchema, updatePreferencesSchema } from '../validators/users.schema.js'
import {
  syncUserHandler,
  getFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
  deleteAccountHandler,
  exportDataHandler,
} from '../controllers/users.controller.js'

export const usersRouter = Router()

usersRouter.use(authenticateToken)

usersRouter.post('/sync', syncUserHandler)
usersRouter.get('/favorites', getFavoritesHandler)
usersRouter.post('/favorites', validateBody(addFavoriteSchema), addFavoriteHandler)
usersRouter.delete('/favorites/:eventId', removeFavoriteHandler)
usersRouter.get('/preferences', getPreferencesHandler)
usersRouter.put('/preferences', validateBody(updatePreferencesSchema), updatePreferencesHandler)
usersRouter.delete('/account', deleteAccountHandler)
usersRouter.get('/export', exportDataHandler)
