import { useCallback, useEffect, useState } from 'react'
import {
  formatMoney,
  type PriceRevisionDTO,
  type SellerProductDTO,
  type SellerSaleDTO,
  type SessionUserDTO,
} from '@gctc/shared'
import { ApiError, api } from '../api/client.ts'
import { AccessDenied, MetricCard } from '../components/chrome.tsx'

export function SellerPage({
  onCatalogueChanged,
  user,
}: {
  onCatalogueChanged: () => void
  user: SessionUserDTO
}) {
  const [products, setProducts] = useState<SellerProductDTO[]>([])
  const [sales, setSales] = useState<SellerSaleDTO[]>([])
  const [audits, setAudits] = useState<PriceRevisionDTO[]>([])
  const [error, setError] = useState<string | null>(null)

  const isSeller = user.role === 'seller'

  useEffect(() => {
    if (!isSeller) return
    let cancelled = false
    Promise.all([api.sellerProducts(), api.sellerSales(), api.sellerAudits()])
      .then(([productsRes, salesRes, auditsRes]) => {
        if (cancelled) return
        setProducts(productsRes.products)
        setSales(salesRes.sales)
        setAudits(auditsRes.audits)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load seller data')
      })
    return () => {
      cancelled = true
    }
  }, [isSeller])

  const updatePrice = useCallback(
    async (product: SellerProductDTO, newPrice: number, reason: string): Promise<string> => {
      try {
        const { product: updated } = await api.updatePrice(product.id, {
          newPrice,
          reason,
          expectedVersion: product.priceVersion,
        })
        setProducts((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)))
        const { audits: freshAudits } = await api.sellerAudits()
        setAudits(freshAudits)
        onCatalogueChanged()
        return 'Price updated and audit entry created.'
      } catch (cause) {
        if (cause instanceof ApiError && cause.code === 'VERSION_CONFLICT') {
          const { products: fresh } = await api.sellerProducts()
          setProducts(fresh)
          return 'This listing changed elsewhere. It has been refreshed — review and retry.'
        }
        return cause instanceof Error ? cause.message : 'Enter a valid price and a reason.'
      }
    },
    [onCatalogueChanged],
  )

  if (!isSeller) return <AccessDenied needed="seller" />

  const grossSales = sales.reduce((total, sale) => total + sale.amount, 0)
  const acceptedSales = sales.filter((sale) => sale.qualityStatus === 'passed').length
  const qualityRate = sales.length > 0 ? Math.round((acceptedSales / sales.length) * 100) : 100

  return (
    <section className="dashboard-grid">
      <MetricCard label="My active listings" value={String(products.length)} detail="Only your products are editable" />
      <MetricCard label="Recorded sales" value={formatMoney(grossSales)} detail={`${sales.length} completed sales in this report`} />
      <MetricCard label="Quality acceptance" value={`${qualityRate}%`} detail="Exceptions are reviewed by GCTC operations" />
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <span>Seller center</span>
            <h2>My products and pricing</h2>
          </div>
          <p>Change only your current GCTC offer. Every update is timestamped and auditable.</p>
        </div>
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="seller-listings">
          {products.map((product) => (
            <SellerListingRow product={product} key={`${product.id}-${product.priceVersion}`} updatePrice={updatePrice} />
          ))}
        </div>
      </article>
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <span>Backend report</span>
            <h2>Sales and quality record</h2>
          </div>
          <a className="outline-button" href="/api/seller/sales.csv" download>
            Export CSV
          </a>
        </div>
        <div className="report-table" role="table" aria-label="Seller sales report">
          <div className="report-row report-head" role="row">
            <span>Sale</span><span>Product</span><span>Quantity</span><span>Value</span><span>Quality</span>
          </div>
          {sales.map((sale) => (
            <div className="report-row" role="row" key={sale.id}>
              <span><strong>{sale.id}</strong><small>{sale.soldAt}</small></span>
              <span>{sale.productName}</span>
              <span>{sale.quantityTons} tons · {sale.lots} lots</span>
              <span>{formatMoney(sale.amount)}</span>
              <span className={`status-label ${sale.qualityStatus}`}>{sale.qualityStatus}</span>
            </div>
          ))}
        </div>
      </article>
      <article className="panel">
        <span>Price audit</span>
        <h2>Recent changes</h2>
        {audits.length > 0 ? (
          <div className="audit-list">
            {audits.slice(0, 4).map((audit) => (
              <div key={audit.id}>
                <strong>{formatMoney(audit.previousPrice)} → {formatMoney(audit.newPrice)}</strong>
                <span>{audit.reason}</span>
                <small>{new Date(audit.effectiveAt).toLocaleString('en-IN')}</small>
              </div>
            ))}
          </div>
        ) : <p>No price changes recorded yet.</p>}
      </article>
      <article className="panel">
        <span>Seller rules</span>
        <h2>No bypass channel</h2>
        <p>Seller dashboard excludes buyer phone, buyer email, and final retail customer data. GCTC owns buyer communication, settlement, and dispute handling.</p>
      </article>
    </section>
  )
}

function SellerListingRow({
  product,
  updatePrice,
}: {
  product: SellerProductDTO
  updatePrice: (product: SellerProductDTO, newPrice: number, reason: string) => Promise<string>
}) {
  const [price, setPrice] = useState(String(product.basePrice))
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function savePrice() {
    const parsed = Number(price)
    if (!Number.isFinite(parsed) || parsed <= 0 || !reason.trim()) {
      setMessage('Enter a valid price and a reason.')
      return
    }
    setBusy(true)
    const result = await updatePrice(product, Math.round(parsed), reason.trim())
    setBusy(false)
    setMessage(result)
    if (result.startsWith('Price updated')) setReason('')
  }

  return (
    <form
      className="seller-listing-row"
      onSubmit={(event) => {
        event.preventDefault()
        void savePrice()
      }}
    >
      <img src={product.imageUrl} alt={product.name} />
      <div className="listing-identity">
        <strong>{product.name}</strong>
        <span>{product.availableQty} · {product.procurementFrequency}</span>
        <small>Last effective {product.priceUpdatedAt}</small>
      </div>
      <label>
        <span>Offer price (INR)</span>
        <input
          aria-label={`Offer price for ${product.name}`}
          min="1"
          step="100"
          type="number"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <label>
        <span>Reason for change</span>
        <input
          aria-label={`Price change reason for ${product.name}`}
          maxLength={120}
          placeholder="Supply or market adjustment"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <button data-testid={`update-price-${product.id}`} type="button" disabled={busy} onClick={() => void savePrice()}>
        {busy ? 'Saving…' : 'Update price'}
      </button>
      <small className="form-message" aria-live="polite">{message}</small>
    </form>
  )
}
