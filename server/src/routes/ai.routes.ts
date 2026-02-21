import { Router } from 'express'
import { aiSearch } from '../controllers/ai.controller.js'
import { validateBody } from '../middleware/validateRequest.js'
import { aiSearchSchema } from '../validators/ai.schema.js'

export const aiRouter = Router()

aiRouter.post('/search', validateBody(aiSearchSchema), aiSearch)
