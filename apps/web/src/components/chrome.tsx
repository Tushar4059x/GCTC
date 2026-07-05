import type { Role, SessionUserDTO } from '@gctc/shared'
import { getNavItems, routeTitles, type RouteId } from '../lib/routes.ts'
import { Icon } from './Icon.tsx'

function getPrimaryAction(user: SessionUserDTO | null): { label: string; route: RouteId } {
  if (user?.role === 'admin') return { label: 'Admin console', route: 'admin' }
  if (user?.role === 'seller') return { label: 'Seller center', route: 'seller' }
  return { label: 'Cart · 1', route: 'cart' }
}

export function Sidebar({
  handleSearch,
  navigate,
  query,
  route,
  setQuery,
  user,
}: {
  handleSearch: () => void
  navigate: (route: RouteId) => void
  query: string
  route: RouteId
  setQuery: (value: string) => void
  user: SessionUserDTO | null
}) {
  const navItems = getNavItems(user?.role)
  const primaryAction = getPrimaryAction(user)
  const initials = user
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
    : 'IN'

  return (
    <header className="sidebar site-chrome" aria-label="Platform navigation">
      <div className="prototype-bar">
        <button className="prototype-brand" type="button" onClick={() => navigate('marketplace')}>
          <span className="brand-mark light" aria-hidden="true" />
          <strong>GCTC</strong>
        </button>
        <nav aria-label="Landing page navigation">
          {navItems.map((item) => (
            <button
              className={item.activeRoutes.includes(route) ? 'active prototype-link' : 'prototype-link'}
              type="button"
              onClick={() => navigate(item.route)}
              key={item.label}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <span className="prototype-meta">Products sourced across India</span>
      </div>

      <div className="commerce-bar">
        <button className="commerce-brand" type="button" onClick={() => navigate('marketplace')}>
          <span className="brand-mark" aria-hidden="true" />
          <strong>GCTC</strong>
        </button>
        <label className="commerce-search">
          <Icon name="marketplace" />
          <input
            aria-label="Search products by name, category, or Indian state"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
            placeholder="Search products or states across India"
          />
        </label>
        <div className="commerce-actions">
          <button className="commerce-select" type="button">
            Deliver in India <span aria-hidden="true">▾</span>
          </button>
          <button className="commerce-select" type="button">
            INR <span aria-hidden="true">▾</span>
          </button>
          <button className="cart-pill" type="button" onClick={() => navigate(primaryAction.route)}>
            {primaryAction.label}
          </button>
          <button
            className={`commerce-avatar ${user?.role ?? 'guest'}`}
            type="button"
            onClick={() => navigate(user ? 'account' : 'login')}
            aria-label="Account"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  )
}

export function Header({
  navigate,
  onLogout,
  route,
  user,
}: {
  navigate: (route: RouteId) => void
  onLogout: () => void
  route: RouteId
  user: SessionUserDTO | null
}) {
  return (
    <header className="topbar">
      <div>
        <span className="route-kicker">{routeTitles[route]}</span>
        <h1>{route === 'marketplace' ? 'Shop verified products across India' : routeTitles[route]}</h1>
        <p>{headerCopy(route, user?.role)}</p>
      </div>
      <div className="topbar-actions">
        <span className={`role-badge ${user?.role ?? 'guest'}`}>{user?.role ?? 'guest'}</span>
        <button type="button" onClick={() => navigate('login')}>
          Switch login
        </button>
        {user && (
          <button className="ghost-button" type="button" onClick={onLogout}>
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}

function headerCopy(route: RouteId, role: Role | undefined) {
  if (route === 'seller') return 'Manage listings, documents, fulfilment, and settlement without direct buyer bypass.'
  if (route === 'admin') return 'Operate verification, compliance, risk controls, seller onboarding, and platform revenue.'
  if (route === 'orders') return 'Track orders from payment to seller confirmation, dispatch, interstate transit, and delivery.'
  if (route === 'checkout') return 'Review the delivered cost and pay GCTC upfront before seller settlement.'
  if (route === 'login') return 'Sign in with a demo account to test buyer, seller, and admin permission levels.'
  if (role === 'seller') return 'Seller account active. Buyer marketplace still masks your direct identity.'
  return 'Amazon-style wholesale buying across Indian states, with verified sellers, transparent pricing, logistics, and payment.'
}

export function MetricCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

export function AccessDenied({ needed }: { needed: string }) {
  return (
    <section className="panel access-denied">
      <Icon name="Lock" />
      <h2>Access restricted</h2>
      <p>This page requires {needed} permission. Switch login from the top right to test this role.</p>
    </section>
  )
}
