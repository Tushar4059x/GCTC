import { useState } from 'react'
import { DEMO_PASSWORD, demoUsers } from '@gctc/shared'

const demoAccounts = demoUsers.filter((user) => user.demoPassword)

export function LoginPage({
  busy,
  error,
  onLogin,
}: {
  busy: boolean
  error: string | null
  onLogin: (email: string, password: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <section className="login-grid">
      <aside className="auth-brand">
        <div className="auth-lockup">
          <span className="brand-mark" aria-hidden="true" />
          <strong>GCTC</strong>
        </div>
        <div>
          <h2>Source across India, confidently.</h2>
          <p>Sign in to buy, sell, or operate the platform. Sessions are issued by the GCTC API and roles are enforced server-side.</p>
          <ul>
            <li>Buyer sees delivered cost before checkout</li>
            <li>Seller receives controlled platform orders</li>
            <li>Admin governs verification and risk</li>
          </ul>
        </div>
        <small>Global Chamber of Trade and Commerce</small>
      </aside>
      <div className="auth-form">
        <div className="auth-form-inner">
          <span>Sign in</span>
          <h2>Continue with your account</h2>
          <p>Use a demo account below, or enter credentials directly.</p>
          <form
            className="login-card"
            onSubmit={(event) => {
              event.preventDefault()
              onLogin(email.trim(), password)
            }}
          >
            <label>
              <span>Email</span>
              <input
                autoComplete="username"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.in"
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {error && <p className="form-message" role="alert">{error}</p>}
          {demoAccounts.map((account) => (
            <article className="login-card" key={account.id}>
              <span>{account.role}</span>
              <h3>{account.name}</h3>
              <p>{account.organization}</p>
              <button type="button" disabled={busy} onClick={() => onLogin(account.email, DEMO_PASSWORD)}>
                Continue as {account.role}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
