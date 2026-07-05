import type { Role } from '@gctc/shared'

export type RouteId =
  | 'marketplace'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'seller'
  | 'admin'
  | 'account'
  | 'login'

export interface NavItem {
  activeRoutes: RouteId[]
  label: string
  route: RouteId
}

export const routeTitles: Record<RouteId, string> = {
  marketplace: 'Marketplace',
  product: 'Product',
  cart: 'Cart',
  checkout: 'Checkout',
  orders: 'Orders',
  seller: 'Seller Center',
  admin: 'Admin Console',
  account: 'Account',
  login: 'Login',
}

export const routePaths: Record<RouteId, string> = {
  marketplace: '/',
  product: '/product',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  seller: '/seller',
  admin: '/admin',
  account: '/account',
  login: '/login',
}

export function routeFromPath(pathname: string): RouteId {
  const match = (Object.entries(routePaths) as Array<[RouteId, string]>).find(
    ([, path]) => path === pathname,
  )
  return match?.[0] ?? 'marketplace'
}

/** Routes that only make sense with a signed-in session. */
export const authRoutes: RouteId[] = ['cart', 'checkout', 'orders', 'seller', 'admin', 'account']

export function getNavItems(role: Role | undefined): NavItem[] {
  if (role === 'admin') {
    return [
      { label: 'Discover', route: 'marketplace', activeRoutes: ['marketplace'] },
      { label: 'Admin console', route: 'admin', activeRoutes: ['admin'] },
      { label: 'Orders', route: 'orders', activeRoutes: ['orders'] },
      { label: 'Account', route: 'account', activeRoutes: ['account', 'login'] },
    ]
  }

  if (role === 'seller') {
    return [
      { label: 'Discover', route: 'marketplace', activeRoutes: ['marketplace'] },
      { label: 'Seller center', route: 'seller', activeRoutes: ['seller'] },
      { label: 'Orders', route: 'orders', activeRoutes: ['orders'] },
      { label: 'Account', route: 'account', activeRoutes: ['account', 'login'] },
    ]
  }

  return [
    { label: 'Discover', route: 'marketplace', activeRoutes: ['marketplace'] },
    { label: 'Product & checkout', route: 'product', activeRoutes: ['product', 'cart', 'checkout'] },
    { label: 'Orders', route: 'orders', activeRoutes: ['orders'] },
    { label: 'Account', route: 'account', activeRoutes: ['account', 'login'] },
  ]
}
