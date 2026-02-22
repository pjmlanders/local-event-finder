import { Router } from 'express'
import { authenticateToken } from '../middleware/authenticateToken.js'
import {
  syncUserHandler,
  getFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
} from '../controllers/users.controller.js'

export const usersRouter = Router()

usersRouter.use(authenticateToken)

usersRouter.post('/sync', syncUserHandler)
usersRouter.get('/favorites', getFavoritesHandler)
usersRouter.post('/favorites', addFavoriteHandler)
usersRouter.delete('/favorites/:eventId', removeFavoriteHandler)
usersRouter.get('/preferences', getPreferencesHandler)
usersRouter.put('/preferences', updatePreferencesHandler)
