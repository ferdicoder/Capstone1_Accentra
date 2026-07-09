import { rateLimit } from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 60 * 5 * 1000, 
  max: 5, 
  message: 'Too many login attempts, please try again after an hour.'
})

export { 
  loginLimiter 
}