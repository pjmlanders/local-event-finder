import { Router } from 'express'
import { searchEvents, getEventById } from '../controllers/events.controller.js'
import { validateQuery } from '../middleware/validateRequest.js'
import { eventSearchSchema } from '../validators/events.schema.js'

export const eventsRouter = Router()

eventsRouter.get('/', validateQuery(eventSearchSchema), searchEvents)
eventsRouter.get('/:id', getEventById)
