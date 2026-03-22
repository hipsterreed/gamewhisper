import { app } from './app'
import { log } from './lib/logger'

const PORT = parseInt(process.env.PORT ?? '3000')

app.listen(PORT)

log('info', 'server started', { port: PORT })
