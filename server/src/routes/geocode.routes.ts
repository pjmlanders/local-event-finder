import { Router } from 'express'
import { geocodeZip } from '../controllers/geocode.controller.js'
import { validateQuery } from '../middleware/validateRequest.js'
import { geocodeSchema } from '../validators/geocode.schema.js'

export const geocodeRouter = Router()

geocodeRouter.get('/', validateQuery(geocodeSchema), geocodeZip)
