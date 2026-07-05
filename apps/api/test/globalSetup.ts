import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://gctc:gctc@localhost:5433/gctc_test'

export default function setup() {
  const apiDir = fileURLToPath(new URL('..', import.meta.url))
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  })
}
