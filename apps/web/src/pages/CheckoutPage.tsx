import { getCorridor, type CatalogueItemDTO, type PaymentStatus, type QuoteDTO } from '@gctc/shared'
import { DocumentChecklist, InvoicePanel } from '../components/commerce.tsx'

export function CheckoutPage({
  busy,
  error,
  item,
  onBuy,
  onBackToCart,
  paymentStatus,
  quote,
}: {
  busy: boolean
  error: string | null
  item: CatalogueItemDTO
  onBuy: () => void
  onBackToCart: () => void
  paymentStatus: PaymentStatus
  quote: QuoteDTO | null
}) {
  const corridor = getCorridor(item.corridorId)

  if (!quote) {
    return (
      <section className="panel checkout-panel">
        <span>Checkout</span>
        <h2>No active quote</h2>
        <p>Your quote expired or was already used. Return to the trade cart to lock a fresh delivered price.</p>
        <button type="button" onClick={onBackToCart}>Back to trade cart</button>
      </section>
    )
  }

  const expiresIn = Math.max(0, Math.round((new Date(quote.expiresAt).getTime() - Date.now()) / 60000))

  return (
    <section className="content-grid">
      <article className="panel checkout-panel">
        <span>Checkout</span>
        <h2>Pay GCTC upfront</h2>
        <p>
          {quote.fulfilment === 'turnkey'
            ? 'GCTC coordinates the product, interstate transport, transit insurance, handling, and delivery under one package.'
            : 'GCTC secures the product order. Your team remains responsible for pickup, interstate transport, transit insurance, and final delivery.'}
        </p>
        <div className="checkout-steps">
          <span className="active">Address locked</span>
          <span className="active">Documents queued</span>
          <span className={paymentStatus === 'secured' ? 'active' : ''}>Payment secured</span>
          <span>Supplier settlement</span>
        </div>
        <DocumentChecklist corridor={corridor} item={item} />
        {error && <p className="form-message" role="alert">{error}</p>}
      </article>
      <InvoicePanel
        busy={busy}
        corridorLabel={`${corridor.from} to ${corridor.to}`}
        currency={quote.currency}
        fulfilment={quote.fulfilment}
        invoice={quote.totals}
        itemName={quote.productName}
        lots={quote.lots}
        note={`Server-locked quote · expires in ${expiresIn} min`}
        onPrimary={onBuy}
        paymentStatus={paymentStatus}
        primaryAction="Buy through GCTC"
      />
    </section>
  )
}
