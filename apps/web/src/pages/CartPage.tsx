import {
  calculateInvoice,
  formatMoney,
  getCorridor,
  type CatalogueItemDTO,
  type PaymentStatus,
} from '@gctc/shared'
import { DocumentChecklist, InvoicePanel } from '../components/commerce.tsx'
import type { TradeSelection } from './ProductPage.tsx'

export function CartPage({
  busy,
  error,
  item,
  onProceed,
  paymentStatus,
  selection,
}: {
  busy: boolean
  error: string | null
  item: CatalogueItemDTO
  onProceed: () => void
  paymentStatus: PaymentStatus
  selection: TradeSelection
}) {
  const corridor = getCorridor(item.corridorId)
  const invoice = calculateInvoice({
    corridorId: item.corridorId,
    basePrice: item.basePrice,
    lots: selection.lots,
    freightTier: selection.freightTier,
    moverTier: selection.moverTier,
    fulfilment: selection.fulfilment,
  })

  return (
    <section className="content-grid">
      <article className="panel cart-panel">
        <div className="section-heading">
          <div>
            <span>Trade cart</span>
            <h2>{item.name}</h2>
          </div>
          <p>{corridor.from} to {corridor.to}</p>
        </div>
        <div className="cart-line">
          <img src={item.imageUrl} alt={item.name} />
          <div>
            <strong>{item.name}</strong>
            <span>{selection.lots} lot · {item.unit}</span>
            <span>{selection.fulfilment === 'turnkey' ? 'GCTC delivered fulfilment' : 'GCTC sourcing only · buyer-managed transport'}</span>
            <span>Seller identity protected by GCTC</span>
          </div>
          <strong>{formatMoney(invoice.subtotal, corridor.currency)}</strong>
        </div>
        <DocumentChecklist corridor={corridor} item={item} />
        {error && <p className="form-message" role="alert">{error}</p>}
      </article>
      <InvoicePanel
        busy={busy}
        corridorLabel={`${corridor.from} to ${corridor.to}`}
        currency={corridor.currency}
        fulfilment={selection.fulfilment}
        invoice={invoice}
        itemName={item.name}
        lots={selection.lots}
        note="Estimated with the live rule pack. A locked quote is issued at checkout."
        onPrimary={onProceed}
        paymentStatus={paymentStatus}
        primaryAction="Proceed to checkout"
      />
    </section>
  )
}
