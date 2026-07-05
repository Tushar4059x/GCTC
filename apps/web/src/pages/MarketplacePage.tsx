import { useState } from 'react'
import { formatMoney, getCorridor, type CatalogueItemDTO } from '@gctc/shared'

const categoryTabs = ['All', 'Food ingredients', 'Spices', 'Dry fruits', 'Grains', 'Coffee'] as const
type CategoryTab = (typeof categoryTabs)[number]

const stateOptions = ['Maharashtra', 'Andhra Pradesh', 'Gujarat', 'Telangana', 'Rajasthan', 'Kerala', 'Karnataka'] as const
type StateFilter = (typeof stateOptions)[number]

const productCardMeta: Record<string, { caption: string; rating: string; sold: string }> = {
  'cashew-maharashtra': { caption: 'cashew kernels', rating: '4.9', sold: '1.8k lots' },
  'cocoa-andhra': { caption: 'natural cocoa', rating: '4.8', sold: '920 lots' },
  'sesame-gujarat': { caption: 'hulled sesame', rating: '4.7', sold: '1.1k lots' },
  'turmeric-telangana': { caption: 'turmeric powder', rating: '4.9', sold: '740 lots' },
  'millet-rajasthan': { caption: 'pearl millet', rating: '4.6', sold: '680 lots' },
  'cardamom-kerala': { caption: 'green cardamom', rating: '4.8', sold: '410 lots' },
  'coffee-karnataka': { caption: 'robusta beans', rating: '4.7', sold: '520 lots' },
}

function getStateLabel(item: CatalogueItemDTO) {
  const abbreviations: Record<StateFilter, string> = {
    Maharashtra: 'MH',
    'Andhra Pradesh': 'AP',
    Gujarat: 'GJ',
    Telangana: 'TS',
    Rajasthan: 'RJ',
    Kerala: 'KL',
    Karnataka: 'KA',
  }
  return `${abbreviations[item.state as StateFilter] ?? item.state} · INDIA`
}

function categoryMatches(item: CatalogueItemDTO, category: CategoryTab) {
  if (category === 'All') return true
  // Substring match so e.g. the Grains tab also covers 'Seeds and grains'.
  return item.category.toLowerCase().includes(category.toLowerCase())
}

export function MarketplacePage({
  items,
  loading,
  selectItem,
  submittedQuery,
}: {
  items: CatalogueItemDTO[]
  loading: boolean
  selectItem: (item: CatalogueItemDTO) => void
  submittedQuery: string
}) {
  const [category, setCategory] = useState<CategoryTab>('All')
  const [selectedStates, setSelectedStates] = useState<StateFilter[]>([])
  const [maxPrice, setMaxPrice] = useState(900000)
  const [protectedOnly, setProtectedOnly] = useState(true)

  const marketItems = items.filter((item) => {
    const corridor = getCorridor(item.corridorId)
    const stateMatch = selectedStates.length === 0 || selectedStates.includes(item.state as StateFilter)
    const protectionMatch = !protectedOnly || corridor.transactionSecurity >= 75
    return categoryMatches(item, category) && stateMatch && item.deliveredPrice <= maxPrice && protectionMatch
  })

  function toggleState(state: StateFilter) {
    setSelectedStates((current) =>
      current.includes(state) ? current.filter((item) => item !== state) : [...current, state],
    )
  }

  return (
    <div className="discover-page">
      <section className="discover-hero">
        <div className="discover-hero-copy">
          <span>Verified products · state-level sourcing</span>
          <h1>Source across India. One trusted price.</h1>
          <p>
            Compare verified products from Indian states with GST, transport, handling, and buyer protection calculated before you order.
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
          <img src="/landing-hero-global-trade.png" alt="Wholesale products and trade documents for Indian buyers" />
          <span>Indian products · GCTC managed procurement</span>
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
          selectedStates={selectedStates}
          setMaxPrice={setMaxPrice}
          setProtectedOnly={setProtectedOnly}
          toggleState={toggleState}
          totalCount={marketItems.length}
        />
        <div className="discover-results">
          <div className="discover-results-head">
            <div>
              <h2>{submittedQuery ? `${marketItems.length} verified listings for “${submittedQuery}”` : 'Products from across India'}</h2>
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
          {marketItems.length === 0 && !loading && (
            <div className="empty-results">
              <h3>No matching listings</h3>
              <p>Try another category, state, or higher delivered-price range.</p>
            </div>
          )}
          {marketItems.length === 0 && loading && (
            <div className="empty-results">
              <h3>Loading verified listings…</h3>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function CatalogueCard({ item, onSelect }: { item: CatalogueItemDTO; onSelect: () => void }) {
  const meta = productCardMeta[item.id] ?? { caption: item.category, rating: '4.7', sold: '120 lots' }
  return (
    <article
      className="item-card"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.name}`}
    >
      <div className="item-media">
        <img className="item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
        <span className="origin-chip">{getStateLabel(item)}</span>
        <span className="duties-chip">Verified</span>
        <span className="media-caption">{meta.caption}</span>
      </div>
      <div className="item-body">
        <h3>{item.name}</h3>
        <p>GCTC verified seller · {item.state}</p>
        <div className="price-row">
          <div>
            <strong>{formatMoney(item.deliveredPrice, item.currency)}</strong>
            <span>Delivered · product {formatMoney(item.basePrice, item.currency)}</span>
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
  selectedStates,
  setMaxPrice,
  setProtectedOnly,
  toggleState,
  totalCount,
}: {
  maxPrice: number
  protectedOnly: boolean
  selectedStates: StateFilter[]
  setMaxPrice: (price: number) => void
  setProtectedOnly: (enabled: boolean) => void
  toggleState: (state: StateFilter) => void
  totalCount: number
}) {
  return (
    <aside className="filter-panel" aria-label="Marketplace filters">
      <div className="filter-head">
        <h2>Filters</h2>
        <span>{totalCount} results</span>
      </div>
      <div className="filter-section">
        <h3>Source state</h3>
        {stateOptions.map((state) => (
          <label className="filter-check" key={state}>
            <input checked={selectedStates.includes(state)} type="checkbox" onChange={() => toggleState(state)} />
            <span>{state}</span>
          </label>
        ))}
      </div>
      <div className="filter-section">
        <h3>Delivered price</h3>
        <input
          aria-label="Maximum delivered price"
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
