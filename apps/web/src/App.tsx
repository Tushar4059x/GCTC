import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  getCorridor,
  type CatalogueItemDTO,
  type DeliveryTier,
  type FulfilmentOption,
  type OrderDTO,
  type PaymentStatus,
  type QuoteDTO,
  type SessionUserDTO,
} from '@gctc/shared'
import { ApiError, api } from './api/client.ts'
import { Header, Sidebar } from './components/chrome.tsx'
import { authRoutes, routeFromPath, routePaths, type RouteId } from './lib/routes.ts'
import { AccountPage } from './pages/AccountPage.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
import { CartPage } from './pages/CartPage.tsx'
import { CheckoutPage } from './pages/CheckoutPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { MarketplacePage } from './pages/MarketplacePage.tsx'
import { OrdersPage } from './pages/OrdersPage.tsx'
import { ProductPage, type TradeSelection, type TradeSelectionHandlers } from './pages/ProductPage.tsx'
import { SellerPage } from './pages/SellerPage.tsx'

function App() {
  const [route, setRoute] = useState<RouteId>(() => routeFromPath(window.location.pathname))
  const [user, setUser] = useState<SessionUserDTO | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  const [items, setItems] = useState<CatalogueItemDTO[]>([])
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [lots, setLots] = useState(1)
  const [freightTier, setFreightTier] = useState<DeliveryTier>('normal')
  const [moverTier, setMoverTier] = useState<DeliveryTier>('normal')
  const [fulfilment, setFulfilment] = useState<FulfilmentOption>('turnkey')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('draft')

  const [activeQuote, setActiveQuote] = useState<QuoteDTO | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [loginBusy, setLoginBusy] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    api
      .me()
      .then(({ user: sessionUser }) => setUser(sessionUser))
      .catch(() => setUser(null))
      .finally(() => setSessionChecked(true))
  }, [])

  const refreshCatalogue = useCallback(async (search = '') => {
    setCatalogueLoading(true)
    try {
      const { items: fresh } = await api.catalogue(search)
      setItems(fresh)
      return fresh
    } finally {
      setCatalogueLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCatalogue().catch(() => setItems([]))
  }, [refreshCatalogue])

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const { orders: fresh } = await api.orders()
      setOrders(fresh)
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      void refreshOrders()
    } else {
      setOrders([])
    }
  }, [user, refreshOrders])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0] ?? null,
    [items, selectedItemId],
  )

  const navigate = useCallback((nextRoute: RouteId) => {
    setRoute(nextRoute)
    window.history.pushState(null, '', routePaths[nextRoute])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const selection: TradeSelection = { lots, freightTier, moverTier, fulfilment }

  // Any change to the trade parameters invalidates a previously locked quote.
  const selectionHandlers: TradeSelectionHandlers = useMemo(
    () => ({
      setLots: (value) => {
        setLots(value)
        setActiveQuote(null)
      },
      setFreightTier: (value) => {
        setFreightTier(value)
        setActiveQuote(null)
      },
      setMoverTier: (value) => {
        setMoverTier(value)
        setActiveQuote(null)
      },
      setFulfilment: (value) => {
        setFulfilment(value)
        setActiveQuote(null)
      },
    }),
    [],
  )

  function selectItem(item: CatalogueItemDTO) {
    const corridor = getCorridor(item.corridorId)
    setSelectedItemId(item.id)
    setPaymentStatus(corridor.trustScore < 80 ? 'escrow-required' : 'ready')
    setActiveQuote(null)
    setCheckoutError(null)
    navigate('product')
  }

  function handleSearch() {
    const nextQuery = query.trim()
    setSubmittedQuery(nextQuery)
    refreshCatalogue(nextQuery)
      .then((matches) => {
        if (matches[0]) {
          const corridor = getCorridor(matches[0].corridorId)
          setSelectedItemId(matches[0].id)
          setPaymentStatus(corridor.trustScore < 80 ? 'escrow-required' : 'ready')
        }
      })
      .catch(() => {})
    navigate('marketplace')
  }

  function login(email: string, password: string) {
    setLoginBusy(true)
    setLoginError(null)
    api
      .login(email, password)
      .then(({ user: nextUser }) => {
        setUser(nextUser)
        navigate(nextUser.role === 'seller' ? 'seller' : nextUser.role === 'admin' ? 'admin' : 'marketplace')
      })
      .catch((cause: unknown) => {
        setLoginError(cause instanceof Error ? cause.message : 'Could not sign in')
      })
      .finally(() => setLoginBusy(false))
  }

  function logout() {
    api.logout().catch(() => {})
    setUser(null)
    setActiveQuote(null)
    navigate('marketplace')
  }

  function proceedToCheckout() {
    if (!user) {
      navigate('login')
      return
    }
    if (!selectedItem) return
    setCheckoutBusy(true)
    setCheckoutError(null)
    api
      .createQuote({
        productId: selectedItem.id,
        lots,
        freightTier,
        moverTier,
        fulfilment,
      })
      .then(({ quote }) => {
        setActiveQuote(quote)
        navigate('checkout')
      })
      .catch((cause: unknown) => {
        setCheckoutError(cause instanceof Error ? cause.message : 'Could not create a quote')
      })
      .finally(() => setCheckoutBusy(false))
  }

  function buyThroughGctc() {
    if (!activeQuote) return
    setCheckoutBusy(true)
    setCheckoutError(null)
    api
      .checkout(activeQuote.id)
      .then(() => {
        setPaymentStatus('secured')
        setActiveQuote(null)
        void refreshOrders()
        navigate('orders')
      })
      .catch((cause: unknown) => {
        // A price change between quote and checkout surfaces as a 409; the
        // buyer must re-quote rather than pay a superseded total.
        if (cause instanceof ApiError && (cause.code === 'QUOTE_INVALID' || cause.code === 'QUOTE_STALE')) {
          setActiveQuote(null)
        }
        setCheckoutError(cause instanceof Error ? cause.message : 'Checkout failed')
      })
      .finally(() => setCheckoutBusy(false))
  }

  function renderPage() {
    if (!sessionChecked) {
      return (
        <section className="panel">
          <h2>Loading…</h2>
        </section>
      )
    }

    if (route === 'login' || (authRoutes.includes(route) && !user)) {
      return <LoginPage busy={loginBusy} error={loginError} onLogin={login} />
    }

    if (route === 'seller') {
      return <SellerPage user={user!} onCatalogueChanged={() => void refreshCatalogue(submittedQuery)} />
    }
    if (route === 'admin') return <AdminPage user={user!} />
    if (route === 'orders') return <OrdersPage user={user!} orders={orders} loading={ordersLoading} />
    if (route === 'account') return <AccountPage user={user!} onLogin={login} onLogout={logout} />

    if (route === 'product' || route === 'cart' || route === 'checkout') {
      if (!selectedItem) {
        return (
          <section className="panel">
            <h2>{catalogueLoading ? 'Loading product…' : 'No products available'}</h2>
          </section>
        )
      }
      if (route === 'product') {
        return (
          <ProductPage
            item={selectedItem}
            selection={selection}
            handlers={selectionHandlers}
            onContinue={() => navigate('cart')}
          />
        )
      }
      if (route === 'cart') {
        return (
          <CartPage
            busy={checkoutBusy}
            error={checkoutError}
            item={selectedItem}
            onProceed={proceedToCheckout}
            paymentStatus={paymentStatus}
            selection={selection}
          />
        )
      }
      return (
        <CheckoutPage
          busy={checkoutBusy}
          error={checkoutError}
          item={selectedItem}
          onBuy={buyThroughGctc}
          onBackToCart={() => navigate('cart')}
          paymentStatus={paymentStatus}
          quote={activeQuote}
        />
      )
    }

    return (
      <MarketplacePage
        items={items}
        loading={catalogueLoading}
        selectItem={selectItem}
        submittedQuery={submittedQuery}
      />
    )
  }

  return (
    <main className={`product-shell route-${route}`}>
      <Sidebar
        handleSearch={handleSearch}
        navigate={navigate}
        query={query}
        route={route}
        setQuery={setQuery}
        user={user}
      />
      <section className={route === 'marketplace' ? 'workspace discover-workspace' : 'workspace'}>
        {route !== 'login' && route !== 'marketplace' && (
          <Header navigate={navigate} onLogout={logout} route={route} user={user} />
        )}
        {renderPage()}
      </section>
    </main>
  )
}

export default App
