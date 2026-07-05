import { DEMO_PASSWORD, demoUsers, type SessionUserDTO } from '@gctc/shared'

const demoAccounts = demoUsers.filter((candidate) => candidate.demoPassword)

export function AccountPage({
  onLogin,
  onLogout,
  user,
}: {
  onLogin: (email: string, password: string) => void
  onLogout: () => void
  user: SessionUserDTO
}) {
  return (
    <section className="panel account-panel">
      <span>Account</span>
      <h2>{user.name}</h2>
      <p>{user.organization} · {user.email}</p>
      <div className="role-grid">
        {demoAccounts.map((account) => (
          <button
            className={account.role === user.role ? 'selected-role' : ''}
            type="button"
            onClick={() => onLogin(account.email, DEMO_PASSWORD)}
            key={account.id}
          >
            <strong>{account.role}</strong>
            <span>{account.email}</span>
          </button>
        ))}
      </div>
      <button className="ghost-button" type="button" onClick={onLogout}>
        Sign out
      </button>
    </section>
  )
}
