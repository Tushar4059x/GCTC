import {
  commonIndiaTradeDocuments,
  formatMoney,
  productClassDocuments,
  type CatalogueItemDTO,
  type Corridor,
  type FulfilmentOption,
  type InvoiceTotals,
  type PaymentStatus,
} from '@gctc/shared'
import { Icon } from './Icon.tsx'

export function DocumentChecklist({ corridor, item }: { corridor: Corridor; item: CatalogueItemDTO }) {
  const documents = Array.from(
    new Set([
      ...commonIndiaTradeDocuments,
      ...corridor.compliance,
      ...productClassDocuments[item.productClass],
    ]),
  )

  return (
    <div className="document-list">
      {documents.map((document) => (
        <span key={document}>
          <Icon name="Document" />
          {document}
        </span>
      ))}
    </div>
  )
}

export function InvoicePanel({
  busy,
  corridorLabel,
  currency,
  fulfilment,
  invoice,
  itemName,
  lots,
  note,
  onPrimary,
  paymentStatus,
  primaryAction,
}: {
  busy?: boolean
  corridorLabel: string
  currency: string
  fulfilment: FulfilmentOption
  invoice: InvoiceTotals
  itemName: string
  lots: number
  note?: string
  onPrimary?: () => void
  paymentStatus: PaymentStatus
  primaryAction?: string
}) {
  const rows = [
    [`Seller-authorised offer x ${lots}`, invoice.subtotal],
    ['Interstate transport', invoice.freight],
    ['Packing/handling', invoice.movers],
    ['Transit insurance', invoice.insurance],
    ['Delivery coordination', invoice.clearanceSupport],
    ['GCTC margin', invoice.platformMargin],
    ['Delivered service charge', invoice.turnkeyServiceCharge],
    ['GST', invoice.gst],
    ['Escrow protection', invoice.escrowFee],
  ] as const

  return (
    <aside className="invoice-panel" aria-label="Checkout summary">
      <div className="invoice-head">
        <span>Checkout summary</span>
        <strong>{itemName}</strong>
        <p>{corridorLabel}</p>
        <small>{fulfilment === 'turnkey' ? 'Option 2 · GCTC delivered package' : 'Option 1 · GCTC sourcing only'}</small>
      </div>
      <div className="invoice-rows">
        {rows.map(([label, value]) => (
          <div className={value === 0 ? 'muted' : ''} key={label}>
            <span>{label}</span>
            <strong>{formatMoney(value, currency)}</strong>
          </div>
        ))}
      </div>
      <div className="invoice-total" data-testid="invoice-total">
        <span>{fulfilment === 'turnkey' ? 'Final delivered amount' : 'GCTC payable amount'}</span>
        <strong>{formatMoney(invoice.total, currency)}</strong>
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
      {note && <small className="form-message">{note}</small>}
      <button
        className="pay-button"
        data-testid="secure-payment-button"
        type="button"
        disabled={busy}
        onClick={onPrimary}
      >
        {busy ? 'Working…' : (primaryAction ?? 'Buy through GCTC')}
      </button>
    </aside>
  )
}
