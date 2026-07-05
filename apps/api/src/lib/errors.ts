export class AppError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'You do not have permission to do this') =>
  new AppError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message)
export const conflict = (code: string, message: string) => new AppError(409, code, message)
export const badRequest = (message: string) => new AppError(400, 'BAD_REQUEST', message)
