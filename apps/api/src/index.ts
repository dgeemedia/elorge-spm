// apps/api/src/index.ts
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'

import authRouter          from './routes/auth'
import productsRouter      from './routes/products'
import organisationsRouter from './routes/organisations'
import leadsRouter        from './routes/leads'
import clientsRouter      from './routes/clients'
import commissionsRouter  from './routes/commissions'
import transactionsRouter from './routes/transactions'
import usersRouter        from './routes/users'
import remappingRouter    from './routes/remapping'
import webhooksRouter     from './routes/webhooks'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000' }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'Elorge SPM API' }))

// Routes
app.use('/api/auth',          authRouter)
app.use('/api/products',      productsRouter)
app.use('/api/organisations', organisationsRouter)
app.use('/api/leads',        leadsRouter)
app.use('/api/clients',      clientsRouter)
app.use('/api/commissions',  commissionsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/users',        usersRouter)
app.use('/api/remapping',    remappingRouter)
app.use('/webhooks',         webhooksRouter) // HMAC authenticated — no JWT middleware

app.listen(PORT, () => {
  console.log(`🚀 Elorge SPM API running on http://localhost:${PORT}`)
})

export default app
