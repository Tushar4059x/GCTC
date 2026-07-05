import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const scryptAsync = (password: string, salt: string, keylen: number, options: { N: number }) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) =>
      err ? reject(err) : resolve(derivedKey),
    )
  })

const SCRYPT_KEYLEN = 64
const SCRYPT_COST = 16384

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST })
  return `scrypt:${SCRYPT_COST}:${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, costRaw, salt, hashHex] = stored.split(':')
  if (scheme !== 'scrypt' || !costRaw || !salt || !hashHex) return false
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, { N: Number(costRaw) })
  const expected = Buffer.from(hashHex, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
