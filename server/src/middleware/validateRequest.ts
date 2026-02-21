import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: result.error.flatten().fieldErrors,
        statusCode: 400,
      })
      return
    }
    res.locals.validatedQuery = result.data
    next()
  }
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request body',
        details: result.error.flatten().fieldErrors,
        statusCode: 400,
      })
      return
    }
    req.body = result.data
    next()
  }
}
