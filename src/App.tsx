import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  calculateInvoice,
  corridors,
  formatMoney,
  tradeItems,
  type Corridor,
  type DeliveryTier,
  type InvoiceTotals,
  type PaymentStatus,
  type TradeItem,
} from './data/trade'

type Role = 'buyer' | 'seller' | 'admin' | 'support'
type RouteId = 'marketplace' | 'product' | 'cart' | 'checkout' | 'orders' | 'seller' | 'admin' | 'account' | 'login'

interface NavItem {
  activeRoutes: RouteId[]
  label: string
  route: RouteId
}

interface DemoUser {
  id: string
  name: string
  email: string
  role: Role
  organization: string
}

interface Order {
  id: string
  itemId: string
  buyer: string
  status: string
  amount: number
  corridor: string
  protection: string
}

interface PageProps {
  corridor: Corridor
  freightTier: DeliveryTier
  handleSearch: () => void
  invoice: InvoiceTotals
  lotCount: number
  moverTier: DeliveryTier
  navigate: (route: RouteId) => void
  paymentStatus: PaymentStatus
  query: string
  selectItem: (item: TradeItem) => void
  selectedItem: TradeItem
  setFreightTier: (tier: DeliveryTier) => void
  setLotCount: (quantity: number) => void
  setMoverTier: (tier: DeliveryTier) => void
  setPaymentStatus: (status: PaymentStatus) => void
  setQuery: (value: string) => void
  submittedQuery: string
  user: DemoUser
  visibleItems: TradeItem[]
}

const demoUsers: DemoUser[] = [
  {
    id: 'buyer-1',
    name: 'Aarav Mehta',
    email: 'buyer@gctc.demo',
    role: 'buyer',
    organization: 'Mehta Retail Imports',
  },
  {
    id: 'seller-1',
    name: 'Verified Supplier Desk',
    email: 'seller@gctc.demo',
    role: 'seller',
    organization: 'GCTC Supplier Network',
  },
  {
    id: 'admin-1',
    name: 'Operations Admin',
    email: 'admin@gctc.demo',
    role: 'admin',
    organization: 'Global Chamber of Trade and Commerce',
  },
]

const routeTitles: Record<RouteId, string> = {
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

const routePaths: Record<RouteId, string> = {
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

const sampleOrders: Order[] = [
  {
    id: 'GCTC-1027',
    itemId: 'cashew-africa',
    buyer: 'Mehta Retail Imports',
    status: 'Customs documents under review',
    amount: 661948,
    corridor: 'West Africa supplier network to Mumbai, India',
    protection: 'Escrow active',
  },
  {
    id: 'GCTC-1018',
    itemId: 'turmeric-singapore',
    buyer: 'Lion City Foods',
    status: 'Packed and awaiting freight pickup',
    amount: 270128,
    corridor: 'Coimbatore, India to Singapore',
    protection: 'Platform hold',
  },
]

const categoryTabs = ['All', 'Food & Spice', 'Dry fruits', 'Business support', 'Coffee', 'Services'] as const
type CategoryTab = (typeof categoryTabs)[number]

const originOptions = ['Africa', 'India', 'Vietnam', 'Platform'] as const
type OriginFilter = (typeof originOptions)[number]

const productCardMeta: Record<string, { caption: string; rating: string; sold: string }> = {
  'cashew-africa': { caption: 'cashew kernels', rating: '4.9', sold: '1.8k lots' },
  'cocoa-africa': { caption: 'natural cocoa', rating: '4.8', sold: '920 lots' },
  'sesame-africa': { caption: 'hulled sesame', rating: '4.7', sold: '1.1k lots' },
  'turmeric-singapore': { caption: 'turmeric powder', rating: '4.9', sold: '740 lots' },
  'millet-singapore': { caption: 'millet pouches', rating: '4.6', sold: '680 lots' },
  'cardamom-uae': { caption: 'green cardamom', rating: '4.8', sold: '410 lots' },
  'coffee-india': { caption: 'robusta beans', rating: '4.7', sold: '520 lots' },
  'packaging-service': { caption: 'export packaging', rating: '4.9', sold: '260 jobs' },
  'quality-service': { caption: 'quality inspection', rating: '4.9', sold: '310 jobs' },
}

function getCorridor(item: TradeItem) {
  return corridors.find((corridor) => corridor.id === item.corridorId) ?? corridors[0]
}

function getSellerAlias(item: TradeItem) {
  if (item.kind === 'service') return 'GCTC service bench'
  if (item.origin.toLowerCase().includes('africa')) return 'Verified origin cluster'
  if (item.origin.toLowerCase().includes('vietnam')) return 'ASEAN supplier desk'
  return 'GCTC verified seller'
}

function getOriginLabel(item: TradeItem) {
  const corridor = getCorridor(item)
  if (corridor.id === 'west-africa-india') return 'Africa · IN'
  if (corridor.id === 'india-singapore') return 'India · SG'
  if (corridor.id === 'india-uae') return 'India · UAE'
  return 'Vietnam · IN'
}

function getOriginFilter(item: TradeItem): OriginFilter {
  if (item.kind === 'service') return 'Platform'
  const corridor = getCorridor(item)
  if (corridor.id === 'west-africa-india') return 'Africa'
  if (corridor.id === 'vietnam-india') return 'Vietnam'
  return 'India'
}

function categoryMatches(item: TradeItem, category: CategoryTab) {
  if (category === 'All') return true
  const haystack = `${item.name} ${item.category} ${item.kind}`.toLowerCase()
  if (category === 'Food & Spice') return haystack.includes('food') || haystack.includes('spice') || haystack.includes('consumable')
  if (category === 'Dry fruits') return haystack.includes('dry fruits') || haystack.includes('cashew')
  if (category === 'Business support') return item.kind === 'service'
  if (category === 'Coffee') return haystack.includes('coffee')
  return item.kind === 'service'
}

function getNavItems(role: Role): NavItem[] {
  if (role === 'admin') {
    return [
      { label: 'Discover', route: 'marketplace', activeRoutes: ['marketplace'] },
      { label: 'Admin console', route: 'admin', activeRoutes: ['admin'] },
      { label: 'Seller center', route: 'seller', activeRoutes: ['seller'] },
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

function getPrimaryAction(user: DemoUser): { label: string; route: RouteId } {
  if (user.role === 'admin') return { label: 'Admin console', route: 'admin' }
  if (user.role === 'seller') return { label: 'Seller center', route: 'seller' }
  return { label: 'Cart · 1', route: 'cart' }
}

function itemMatchesQuery(item: TradeItem, query: string) {
  const corridor = getCorridor(item)
  const haystack = [
    item.name,
    item.category,
    item.origin,
    item.unit,
    item.availableQty,
    item.specs.join(' '),
    item.certifications.join(' '),
    corridor.from,
    corridor.to,
    corridor.searchTerms.join(' '),
  ]
    .join(' ')
    .toLowerCase()

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

function scaleInvoice(invoice: InvoiceTotals, lotCount: number): InvoiceTotals {
  return Object.fromEntries(
    Object.entries(invoice).map(([key, value]) => [key, value * lotCount]),
  ) as unknown as InvoiceTotals
}

function routeFromPath(pathname: string): RouteId {
  const match = (Object.entries(routePaths) as Array<[RouteId, string]>).find(([, path]) => path === pathname)
  return match?.[0] ?? 'marketplace'
}

function App() {
  const [route, setRoute] = useState<RouteId>(() => routeFromPath(window.location.pathname))
  const [user, setUser] = useState<DemoUser>(demoUsers[0])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('cashew-africa')
  const [freightTier, setFreightTier] = useState<DeliveryTier>('normal')
  const [moverTier, setMoverTier] = useState<DeliveryTier>('normal')
  const [lotCount, setLotCount] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('draft')

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const visibleItems = useMemo(() => {
    const matches = tradeItems.filter((item) => itemMatchesQuery(item, submittedQuery))
    return matches.length > 0 ? matches : tradeItems
  }, [submittedQuery])

  const selectedItem = useMemo(
    () => tradeItems.find((item) => item.id === selectedItemId) ?? visibleItems[0] ?? tradeItems[0],
    [selectedItemId, visibleItems],
  )

  const corridor = useMemo(() => getCorridor(selectedItem), [selectedItem])

  const invoice = useMemo(() => {
    const baseInvoice = calculateInvoice(corridor, selectedItem, freightTier, moverTier)
    return scaleInvoice(baseInvoice, lotCount)
  }, [corridor, selectedItem, freightTier, moverTier, lotCount])

  function navigate(nextRoute: RouteId) {
    setRoute(nextRoute)
    window.history.pushState(null, '', routePaths[nextRoute])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectItem(item: TradeItem) {
    const nextCorridor = getCorridor(item)
    setSelectedItemId(item.id)
    setPaymentStatus(nextCorridor.trustScore < 80 ? 'escrow-required' : 'ready')
    navigate('product')
  }

  function handleSearch() {
    const nextQuery = query.trim()
    const matches = tradeItems.filter((item) => itemMatchesQuery(item, nextQuery))
    setSubmittedQuery(nextQuery)
    if (matches[0]) {
      const nextCorridor = getCorridor(matches[0])
      setSelectedItemId(matches[0].id)
      setPaymentStatus(nextCorridor.trustScore < 80 ? 'escrow-required' : 'ready')
    }
    navigate('marketplace')
  }

  function loginAs(nextUser: DemoUser) {
    setUser(nextUser)
    navigate(nextUser.role === 'seller' ? 'seller' : nextUser.role === 'admin' ? 'admin' : 'marketplace')
  }

  const pageProps = {
    corridor,
    freightTier,
    handleSearch,
    invoice,
    lotCount,
    moverTier,
    navigate,
    paymentStatus,
    query,
    selectItem,
    selectedItem,
    setFreightTier,
    setLotCount,
    setMoverTier,
    setPaymentStatus,
    setQuery,
    submittedQuery,
    user,
    visibleItems,
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
          <Header loginAs={loginAs} navigate={navigate} route={route} user={user} />
        )}
        <Page {...pageProps} route={route} loginAs={loginAs} />
      </section>
    </main>
  )
}

function Page({
  route,
  loginAs,
  ...props
}: PageProps & {
  route: RouteId
  loginAs: (user: DemoUser) => void
}) {
  if (route === 'login') return <LoginPage loginAs={loginAs} />
  if (route === 'product') return <ProductPage {...props} />
  if (route === 'cart') return <CartPage {...props} />
  if (route === 'checkout') return <CheckoutPage {...props} />
  if (route === 'orders') return <OrdersPage {...props} />
  if (route === 'seller') return <SellerPage {...props} />
  if (route === 'admin') return <AdminPage {...props} />
  if (route === 'account') return <AccountPage {...props} loginAs={loginAs} />
  return <MarketplacePage {...props} />
}

function Sidebar({
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
  user: DemoUser
}) {
  const navItems = getNavItems(user.role)
  const primaryAction = getPrimaryAction(user)

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
        <span className="prototype-meta">Responsive web · Ship to India</span>
      </div>

      <div className="commerce-bar">
        <button className="commerce-brand" type="button" onClick={() => navigate('marketplace')}>
          <span className="brand-mark" aria-hidden="true" />
          <strong>GCTC</strong>
        </button>
        <label className="commerce-search">
          <Icon name="marketplace" />
          <input
            aria-label="Search products from global corridors"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
            placeholder="Search products from verified corridors"
          />
        </label>
        <div className="commerce-actions">
          <button className="commerce-select" type="button">
            Ship to India <span aria-hidden="true">▾</span>
          </button>
          <button className="commerce-select" type="button">
            INR <span aria-hidden="true">▾</span>
          </button>
          <button className="cart-pill" type="button" onClick={() => navigate(primaryAction.route)}>
            {primaryAction.label}
          </button>
          <button className={`commerce-avatar ${user.role}`} type="button" onClick={() => navigate('account')} aria-label="Account">
            {user.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </button>
        </div>
      </div>
    </header>
  )
}
function Header({
  loginAs,
  navigate,
  route,
  user,
}: {
  loginAs: (user: DemoUser) => void
  navigate: (route: RouteId) => void
  route: RouteId
  user: DemoUser
}) {
  return (
    <header className="topbar">
      <div>
        <span className="route-kicker">{routeTitles[route]}</span>
        <h1>{route === 'marketplace' ? 'Shop verified global trade products' : routeTitles[route]}</h1>
        <p>{headerCopy(route, user.role)}</p>
      </div>
      <div className="topbar-actions">
        <span className={`role-badge ${user.role}`}>{user.role}</span>
        <button type="button" onClick={() => navigate('login')}>
          Switch login
        </button>
        {user.role !== 'buyer' && (
          <button className="ghost-button" type="button" onClick={() => loginAs(demoUsers[0])}>
            Buyer view
          </button>
        )}
      </div>
    </header>
  )
}

function headerCopy(route: RouteId, role: Role) {
  if (route === 'seller') return 'Manage listings, documents, fulfilment, and settlement without direct buyer bypass.'
  if (route === 'admin') return 'Operate verification, compliance, risk controls, seller onboarding, and platform revenue.'
  if (route === 'orders') return 'Track orders from payment to supplier confirmation, customs, dispatch, and delivery.'
  if (route === 'checkout') return 'Review the landed cost and pay GCTC upfront before supplier settlement.'
  if (route === 'login') return 'Use demo roles to test buyer, seller, and admin permission levels.'
  if (role === 'seller') return 'Seller account active. Buyer marketplace still masks your direct identity.'
  return 'Amazon-style buying for cross-border commerce, with GCTC-managed sellers, logistics, taxes, and payment.'
}

function MarketplacePage({
  selectItem,
  submittedQuery,
  visibleItems,
}: PageProps) {
  const [category, setCategory] = useState<CategoryTab>('All')
  const [selectedOrigins, setSelectedOrigins] = useState<OriginFilter[]>([...originOptions])
  const [maxPrice, setMaxPrice] = useState(900000)
  const [protectedOnly, setProtectedOnly] = useState(true)

  const marketItems = visibleItems.filter((item) => {
    const corridor = getCorridor(item)
    const landed = calculateInvoice(corridor, item, 'normal', 'normal').total
    const originMatch = selectedOrigins.length === 0 || selectedOrigins.includes(getOriginFilter(item))
    const protectionMatch = !protectedOnly || corridor.transactionSecurity >= 75
    return categoryMatches(item, category) && originMatch && landed <= maxPrice && protectionMatch
  })

  function toggleOrigin(origin: OriginFilter) {
    setSelectedOrigins((current) =>
      current.includes(origin) ? current.filter((item) => item !== origin) : [...current, origin],
    )
  }

  return (
    <div className="discover-page">
      <section className="discover-hero">
        <div className="discover-hero-copy">
          <span>All-in pricing · protected suppliers</span>
          <h1>Shop the world. One honest price.</h1>
          <p>
            Duties, taxes, shipping, platform fulfilment, and buyer protection are calculated before you buy, with seller identity protected by GCTC.
          </p>
          <div className="discover-hero-actions">
            <button
              type="button"
              onClick={() => document.getElementById('discover-products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start browsing
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => document.getElementById('discover-products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How it works
            </button>
          </div>
        </div>
        <div className="discover-hero-media">
          <img src="/landing-hero-global-trade.png" alt="Global trade goods with shipping documents" />
          <span>global goods · GCTC managed trade</span>
        </div>
      </section>

      <nav className="category-row" aria-label="Marketplace categories">
        {categoryTabs.map((tab) => (
          <button className={category === tab ? 'active' : ''} type="button" onClick={() => setCategory(tab)} key={tab}>
            {tab}
          </button>
        ))}
      </nav>

      <section className="discover-layout" id="discover-products">
        <FilterPanel
          maxPrice={maxPrice}
          protectedOnly={protectedOnly}
          selectedOrigins={selectedOrigins}
          setMaxPrice={setMaxPrice}
          setProtectedOnly={setProtectedOnly}
          toggleOrigin={toggleOrigin}
          totalCount={marketItems.length}
        />
        <div className="discover-results">
          <div className="discover-results-head">
            <div>
              <h2>{submittedQuery ? `${marketItems.length} verified listings for “${submittedQuery}”` : 'Trending across borders'}</h2>
              <p>Supplier details are masked. Every listing is fulfilled through GCTC checkout.</p>
            </div>
            <button className="sort-button" type="button">
              Sort: Popular <span aria-hidden="true">▾</span>
            </button>
          </div>
          <div className="item-grid">
            {marketItems.map((item) => (
              <CatalogueCard item={item} onSelect={() => selectItem(item)} key={item.id} />
            ))}
          </div>
          {marketItems.length === 0 && (
            <div className="empty-results">
              <h3>No matching listings</h3>
              <p>Try another category, origin, or higher all-in price range.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function CatalogueCard({ item, onSelect }: { item: TradeItem; onSelect: () => void }) {
  const corridor = getCorridor(item)
  const landedTotal = calculateInvoice(corridor, item, 'normal', 'normal').total
  const meta = productCardMeta[item.id] ?? { caption: item.category, rating: '4.7', sold: '120 lots' }
  return (
    <article
      className="item-card"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect()
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.name}`}
    >
      <div className="item-media">
        <img className="item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
        <span className="origin-chip">{getOriginLabel(item)}</span>
        <span className="duties-chip">Duties in</span>
        <span className="media-caption">{meta.caption}</span>
      </div>
      <div className="item-body">
        <h3>{item.name}</h3>
        <p>{getSellerAlias(item)}</p>
        <div className="price-row">
          <div>
            <strong>{formatMoney(landedTotal, corridor.currency)}</strong>
            <span>All-in · base {formatMoney(item.basePrice, corridor.currency)}</span>
          </div>
          <span className="rating">★ {meta.rating} · {meta.sold}</span>
        </div>
      </div>
    </article>
  )
}

function FilterPanel({
  maxPrice,
  protectedOnly,
  selectedOrigins,
  setMaxPrice,
  setProtectedOnly,
  toggleOrigin,
  totalCount,
}: {
  maxPrice: number
  protectedOnly: boolean
  selectedOrigins: OriginFilter[]
  setMaxPrice: (price: number) => void
  setProtectedOnly: (enabled: boolean) => void
  toggleOrigin: (origin: OriginFilter) => void
  totalCount: number
}) {
  return (
    <aside className="filter-panel" aria-label="Marketplace filters">
      <div className="filter-head">
        <h2>Filters</h2>
        <span>{totalCount} results</span>
      </div>
      <div className="filter-section">
        <h3>Ships from</h3>
        {originOptions.map((origin) => (
          <label className="filter-check" key={origin}>
            <input checked={selectedOrigins.includes(origin)} type="checkbox" onChange={() => toggleOrigin(origin)} />
            <span>{origin}</span>
          </label>
        ))}
      </div>
      <div className="filter-section">
        <h3>All-in price (India)</h3>
        <input
          aria-label="Maximum all-in price"
          max="1200000"
          min="50000"
          step="25000"
          type="range"
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
        />
        <div className="range-labels">
          <span>₹50k</span>
          <strong>{formatMoney(maxPrice)}</strong>
        </div>
      </div>
      <label className="filter-toggle">
        <span>Protected checkout only</span>
        <input checked={protectedOnly} type="checkbox" onChange={(event) => setProtectedOnly(event.target.checked)} />
      </label>
    </aside>
  )
}

function ProductPage(props: PageProps) {
  const { corridor, navigate, selectedItem } = props
  return (
    <section className="product-layout">
      <article className="panel product-detail">
        <div className="product-gallery">
          <img src={selectedItem.imageUrl} alt={selectedItem.name} />
        </div>
        <div className="product-copy">
          <span>Product detail</span>
          <h2>{selectedItem.name}</h2>
          <p>{selectedItem.note}</p>
          <div className="seller-privacy large">
            <Icon name="Shield" />
            <span>
              Seller identity protected. GCTC reveals quality, origin, inspection, and price, but not direct seller contact.
            </span>
          </div>
          <InfoColumns item={selectedItem} corridor={corridor} />
        </div>
      </article>
      <BuyBox {...props} onContinue={() => navigate('cart')} />
    </section>
  )
}

function InfoColumns({ corridor, item }: { corridor: Corridor; item: TradeItem }) {
  return (
    <div className="detail-columns">
      <div>
        <strong>Specs</strong>
        {item.specs.map((spec) => (
          <span key={spec}>{spec}</span>
        ))}
      </div>
      <div>
        <strong>Trust</strong>
        <span>{corridor.trustScore}% corridor trust</span>
        <span>{corridor.protection}</span>
      </div>
      <div>
        <strong>Certifications</strong>
        {item.certifications.map((cert) => (
          <span key={cert}>{cert}</span>
        ))}
      </div>
      <div>
        <strong>Why buy</strong>
        {item.decisionFactors.map((factor) => (
          <span key={factor}>{factor}</span>
        ))}
      </div>
    </div>
  )
}

function BuyBox({
  corridor,
  freightTier,
  lotCount,
  moverTier,
  navigate,
  selectedItem,
  setFreightTier,
  setLotCount,
  setMoverTier,
  onContinue,
}: PageProps & { onContinue?: () => void }) {
  return (
    <aside className="buy-box">
      <span>Trade cart</span>
      <strong>{formatMoney(selectedItem.basePrice, corridor.currency)} / lot</strong>
      <p>{selectedItem.unit}</p>
      <label className="quantity-control">
        <span>Lots</span>
        <input
          aria-label="Lots"
          min="1"
          max="10"
          type="number"
          value={lotCount}
          onChange={(event) => setLotCount(Math.max(1, Number(event.target.value) || 1))}
        />
      </label>
      <QuotePanel
        title="Freight"
        description="Delivery option"
        selected={freightTier}
        normal={calculateInvoice(corridor, selectedItem, 'normal', moverTier).freight}
        urgent={calculateInvoice(corridor, selectedItem, 'urgent', moverTier).freight}
        currency={corridor.currency}
        onChange={setFreightTier}
        testIdPrefix="freight"
      />
      <QuotePanel
        title="Packing"
        description="Handling option"
        selected={moverTier}
        normal={calculateInvoice(corridor, selectedItem, freightTier, 'normal').movers}
        urgent={calculateInvoice(corridor, selectedItem, freightTier, 'urgent').movers}
        currency={corridor.currency}
        onChange={setMoverTier}
        testIdPrefix="movers"
      />
      <button type="button" onClick={onContinue ?? (() => navigate('cart'))}>
        Add to trade cart
      </button>
    </aside>
  )
}

function QuotePanel({
  title,
  description,
  selected,
  normal,
  urgent,
  currency,
  onChange,
  testIdPrefix,
}: {
  title: string
  description: string
  selected: DeliveryTier
  normal: number
  urgent: number
  currency: string
  onChange: (tier: DeliveryTier) => void
  testIdPrefix: string
}) {
  return (
    <article className="quote-panel">
      <div>
        <span>{description}</span>
        <h3>{title}</h3>
      </div>
      <div className="tier-toggle" role="group" aria-label={`${title} tier`}>
        <button
          className={selected === 'normal' ? 'selected' : ''}
          data-testid={`${testIdPrefix}-normal`}
          type="button"
          onClick={() => onChange('normal')}
        >
          <span>Normal</span>
          <strong>{formatMoney(normal, currency)}</strong>
        </button>
        <button
          className={selected === 'urgent' ? 'selected' : ''}
          data-testid={`${testIdPrefix}-urgent`}
          type="button"
          onClick={() => onChange('urgent')}
        >
          <span>Urgent</span>
          <strong>{formatMoney(urgent, currency)}</strong>
        </button>
      </div>
    </article>
  )
}

function CartPage(props: PageProps) {
  const { corridor, invoice, lotCount, navigate, selectedItem } = props
  return (
    <section className="content-grid">
      <article className="panel cart-panel">
        <div className="section-heading">
          <div>
            <span>Trade cart</span>
            <h2>{selectedItem.name}</h2>
          </div>
          <p>{corridor.from} to {corridor.to}</p>
        </div>
        <div className="cart-line">
          <img src={selectedItem.imageUrl} alt={selectedItem.name} />
          <div>
            <strong>{selectedItem.name}</strong>
            <span>{lotCount} lot · {selectedItem.unit}</span>
            <span>Seller identity protected by GCTC</span>
          </div>
          <strong>{formatMoney(invoice.subtotal, corridor.currency)}</strong>
        </div>
        <DocumentChecklist corridor={corridor} />
      </article>
      <InvoicePanel {...props} primaryAction="Proceed to checkout" onPrimary={() => navigate('checkout')} />
    </section>
  )
}

function CheckoutPage(props: PageProps) {
  const { corridor, paymentStatus, setPaymentStatus } = props
  return (
    <section className="content-grid">
      <article className="panel checkout-panel">
        <span>Checkout</span>
        <h2>Pay GCTC upfront</h2>
        <p>
          This checkout simulates a payment intent. In production, the server signs final invoice totals before sending the buyer to a PCI-compliant provider.
        </p>
        <div className="checkout-steps">
          <span className="active">Address locked</span>
          <span className="active">Documents queued</span>
          <span className={paymentStatus === 'secured' ? 'active' : ''}>Payment secured</span>
          <span>Supplier settlement</span>
        </div>
        <DocumentChecklist corridor={corridor} />
      </article>
      <InvoicePanel {...props} primaryAction="Buy through GCTC" onPrimary={() => setPaymentStatus('secured')} />
    </section>
  )
}

function InvoicePanel({
  corridor,
  invoice,
  lotCount,
  paymentStatus,
  primaryAction,
  onPrimary,
  selectedItem,
}: PageProps & { primaryAction?: string; onPrimary?: () => void }) {
  const rows = [
    [`Product/service x ${lotCount}`, invoice.subtotal],
    ['Freight', invoice.freight],
    ['Packing/handling', invoice.movers],
    ['GCTC margin', invoice.platformMargin],
    ['Customs duty', invoice.duty],
    ['VAT/import levy', invoice.vat],
    ['GST', invoice.gst],
    ['Escrow protection', invoice.escrowFee],
  ] as const

  return (
    <aside className="invoice-panel" aria-label="Checkout summary">
      <div className="invoice-head">
        <span>Checkout summary</span>
        <strong>{selectedItem.name}</strong>
        <p>{corridor.from} to {corridor.to}</p>
      </div>
      <div className="invoice-rows">
        {rows.map(([label, value]) => (
          <div className={value === 0 ? 'muted' : ''} key={label}>
            <span>{label}</span>
            <strong>{formatMoney(value, corridor.currency)}</strong>
          </div>
        ))}
      </div>
      <div className="invoice-total" data-testid="invoice-total">
        <span>Final landed amount</span>
        <strong>{formatMoney(invoice.total, corridor.currency)}</strong>
      </div>
      <div className={`payment-state ${paymentStatus}`}>
        <Icon name="Shield" />
        <span>
          {paymentStatus === 'secured'
            ? 'Payment secured. Order tracking started. Seller identity remains protected.'
            : paymentStatus === 'escrow-required'
              ? 'Escrow required before supplier settlement.'
              : 'Pay GCTC upfront. Seller is paid only through platform controls.'}
        </span>
      </div>
      <button className="pay-button" data-testid="secure-payment-button" type="button" onClick={onPrimary}>
        {primaryAction ?? 'Buy through GCTC'}
      </button>
    </aside>
  )
}

function DocumentChecklist({ corridor }: { corridor: Corridor }) {
  return (
    <div className="document-list">
      {corridor.compliance.map((document) => (
        <span key={document}>
          <Icon name="Document" />
          {document}
        </span>
      ))}
    </div>
  )
}

function OrdersPage({ paymentStatus, user }: PageProps) {
  const tracking = ['Payment received', 'Supplier confirmed', 'Packed', 'Export docs', 'Customs', 'Delivered']
  const activeIndex = paymentStatus === 'secured' ? 1 : 0
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span>{user.role === 'buyer' ? 'My orders' : 'Order operations'}</span>
          <h2>Trade tracking</h2>
        </div>
        <p>Amazon-style order status, adapted for international trade controls.</p>
      </div>
      <div className="order-grid">
        {sampleOrders.map((order) => {
          const item = tradeItems.find((tradeItem) => tradeItem.id === order.itemId) ?? tradeItems[0]
          return (
            <article className="order-card" key={order.id}>
              <img src={item.imageUrl} alt={item.name} />
              <div>
                <strong>{order.id}</strong>
                <h3>{item.name}</h3>
                <p>{order.status}</p>
                <span>{order.protection} · {order.corridor}</span>
              </div>
              <strong>{formatMoney(order.amount)}</strong>
            </article>
          )
        })}
      </div>
      <div className="tracker">
        {tracking.map((step, index) => (
          <span className={index <= activeIndex ? 'active' : ''} key={step}>
            {step}
          </span>
        ))}
      </div>
    </section>
  )
}

function SellerPage({ user }: PageProps) {
  if (user.role !== 'seller' && user.role !== 'admin') return <AccessDenied needed="seller or admin" />
  return (
    <section className="dashboard-grid">
      <MetricCard label="Active listings" value="9" detail="Buyer-facing seller identity masked" />
      <MetricCard label="Open orders" value="14" detail="7 pending docs, 3 pending dispatch" />
      <MetricCard label="Settlement hold" value="₹18.4L" detail="Released after GCTC fulfilment checks" />
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <span>Seller center</span>
            <h2>Inventory and fulfilment</h2>
          </div>
          <p>Sellers manage stock and documents, but buyers still transact through GCTC.</p>
        </div>
        <div className="table-list">
          {tradeItems.slice(0, 6).map((item) => (
            <div key={item.id}>
              <img src={item.imageUrl} alt={item.name} />
              <span>{item.name}</span>
              <span>{item.availableQty}</span>
              <strong>GCTC masked listing</strong>
            </div>
          ))}
        </div>
      </article>
      <article className="panel">
        <span>Seller rules</span>
        <h2>No bypass channel</h2>
        <p>Seller dashboard excludes buyer phone, buyer email, and final retail customer data. GCTC owns buyer communication, settlement, and dispute handling.</p>
      </article>
    </section>
  )
}

function AdminPage({ user }: PageProps) {
  if (user.role !== 'admin') return <AccessDenied needed="admin" />
  return (
    <section className="dashboard-grid">
      <MetricCard label="GMV pipeline" value="₹2.8Cr" detail="Across 4 demo corridors" />
      <MetricCard label="Verification queue" value="23" detail="Suppliers, docs, quality checks" />
      <MetricCard label="Risk alerts" value="6" detail="Escrow or enhanced document review" />
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <span>Admin console</span>
            <h2>Identity vault and platform controls</h2>
          </div>
          <p>Only admin operations can see internal supplier identity references.</p>
        </div>
        <div className="table-list admin-table">
          {['Supplier legal entity encrypted', 'KYB review pending', 'Payout hold approved', 'Customs rule pack updated'].map((row, index) => (
            <div key={row}>
              <span>CTRL-{index + 104}</span>
              <span>{row}</span>
              <strong>{index % 2 === 0 ? 'Needs review' : 'Approved'}</strong>
            </div>
          ))}
        </div>
      </article>
      <article className="panel">
        <span>Platform revenue</span>
        <h2>Margin controls</h2>
        <p>Admin can tune platform margin, escrow requirements, corridor trust scores, and compliance rule packs before invoices are issued.</p>
      </article>
    </section>
  )
}

function AccountPage({ loginAs, user }: PageProps & { loginAs: (user: DemoUser) => void }) {
  return (
    <section className="panel account-panel">
      <span>Account</span>
      <h2>{user.name}</h2>
      <p>{user.organization} · {user.email}</p>
      <div className="role-grid">
        {demoUsers.map((demoUser) => (
          <button className={demoUser.role === user.role ? 'selected-role' : ''} type="button" onClick={() => loginAs(demoUser)} key={demoUser.id}>
            <strong>{demoUser.role}</strong>
            <span>{demoUser.email}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function LoginPage({ loginAs }: { loginAs: (user: DemoUser) => void }) {
  return (
    <section className="login-grid">
      <aside className="auth-brand">
        <div className="auth-lockup">
          <span className="brand-mark" aria-hidden="true" />
          <strong>GCTC</strong>
        </div>
        <div>
          <h2>Buy and sell across borders, honestly.</h2>
          <p>Demo the platform from buyer, seller, and admin levels with prepaid duties, locked totals, and protected counterparties.</p>
          <ul>
            <li>Buyer sees landed cost before checkout</li>
            <li>Seller receives controlled platform orders</li>
            <li>Admin governs verification and risk</li>
          </ul>
        </div>
        <small>Global Chamber of Trade and Commerce</small>
      </aside>
      <div className="auth-form">
        <div className="auth-form-inner">
          <span>Choose account type</span>
          <h2>Continue with a demo login</h2>
          <p>Switch roles to test buyer journeys, seller operations, and admin controls.</p>
          {demoUsers.map((user) => (
            <article className="login-card" key={user.id}>
              <span>{user.role}</span>
              <h3>{user.name}</h3>
              <p>{user.organization}</p>
              <button type="button" onClick={() => loginAs(user)}>
                Continue as {user.role}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function MetricCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function AccessDenied({ needed }: { needed: string }) {
  return (
    <section className="panel access-denied">
      <Icon name="Lock" />
      <h2>Access restricted</h2>
      <p>This page requires {needed} permission. Switch login from the top right to test this role.</p>
    </section>
  )
}

function Icon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    admin: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4',
    cart: 'M4 5h2l2 10h9l2-7H7M9 20h.01M17 20h.01',
    checkout: 'M7 3h10v18l-2-1-2 1-2-1-2 1-2-1zM10 8h5M10 12h5M10 16h3',
    login: 'M10 17l5-5-5-5M15 12H3M21 4v16',
    marketplace: 'M10 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM14 14l5 5',
    orders: 'M5 5h14M5 12h14M5 19h14',
    product: 'M5 7l7-4 7 4v10l-7 4-7-4zM12 11l7-4M12 11 5 7M12 11v10',
    seller: 'M4 9h16l-2-5H6zM6 9v11h12V9M9 13h6',
    Catalogue: 'M5 5h14v14H5zM8 9h8M8 13h8M8 17h5',
    Document: 'M7 3h7l4 4v14H7zM14 3v5h5M10 13h6M10 17h6',
    Lock: 'M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6zM12 14v3',
    Shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4',
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icons[name] ?? icons.marketplace} />
    </svg>
  )
}

export default App
