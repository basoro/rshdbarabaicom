import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'

// load env
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')
const uploadsPath = path.join(projectRoot, 'uploads')

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(uploadsPath))

app.use('/api/public', publicRoutes)
app.use('/api/admin', adminRoutes)

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response): void => {
  void req;
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

/**
 * error handler middleware
 */
app.use(
  (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    void error;
    void req;
    void next;
    res.status(500).json({
      success: false,
      error: 'Server internal error',
    })
  },
)

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  if (req.method === 'GET' && fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'))
    return
  }

  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
