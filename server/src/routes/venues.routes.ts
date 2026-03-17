import { Router } from 'express'
import { searchVenues, getVenueEvents } from '../controllers/venues.controller.js'

export const venuesRouter = Router()

venuesRouter.get('/', searchVenues)
venuesRouter.get('/:venueKey/events', getVenueEvents)
