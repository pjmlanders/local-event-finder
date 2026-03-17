import { Router } from 'express'
import { searchEvents, getEventById, trackClick, getClickAnalytics } from '../controllers/events.controller.js'
import { validateQuery } from '../middleware/validateRequest.js'
import { eventSearchSchema } from '../validators/events.schema.js'

export const eventsRouter = Router()

eventsRouter.get('/', validateQuery(eventSearchSchema), searchEvents)
eventsRouter.get('/analytics/clicks', getClickAnalytics)
eventsRouter.get('/:id', getEventById)
eventsRouter.post('/:id/click', trackClick)
