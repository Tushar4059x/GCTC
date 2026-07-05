// Loads apps/api/.env in development; a no-op in containers where the
// environment is injected by the orchestrator.
import 'dotenv/config'
import closeWithGrace from 'close-with-grace'
import { buildApp } from './app.ts'
import { loadEnv } from './env.ts'

const env = loadEnv()
const app = await buildApp(env)

closeWithGrace({ delay: 10_000 }, async ({ signal, err }) => {
  if (err) {
    app.log.error({ err }, 'server closing due to error')
  } else {
    app.log.info({ signal }, 'server closing gracefully')
  }
  await app.close()
})

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
