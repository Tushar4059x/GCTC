import {
  calculateInvoice,
  formatMoney,
  getCorridor,
  type CatalogueItemDTO,
  type Corridor,
  type DeliveryTier,
  type FulfilmentOption,
} from '@gctc/shared'
import { Icon } from '../components/Icon.tsx'

export interface TradeSelection {
  lots: number
  freightTier: DeliveryTier
  moverTier: DeliveryTier
  fulfilment: FulfilmentOption
}

export interface TradeSelectionHandlers {
  setLots: (lots: number) => void
  setFreightTier: (tier: DeliveryTier) => void
  setMoverTier: (tier: DeliveryTier) => void
  setFulfilment: (option: FulfilmentOption) => void
}

function tierCost(item: CatalogueItemDTO, component: 'freight' | 'movers', tier: DeliveryTier) {
  const invoice = calculateInvoice({
    corridorId: item.corridorId,
    basePrice: item.basePrice,
    lots: 1,
    freightTier: component === 'freight' ? tier : 'normal',
    moverTier: component === 'movers' ? tier : 'normal',
    fulfilment: 'turnkey',
  })
  return invoice[component]
}

export function ProductPage({
  item,
  onContinue,
  selection,
  handlers,
}: {
  item: CatalogueItemDTO
  onContinue: () => void
  selection: TradeSelection
  handlers: TradeSelectionHandlers
}) {
  const corridor = getCorridor(item.corridorId)
  return (
    <section className="product-layout">
      <article className="panel product-detail">
        <div className="product-gallery">
          <img src={item.imageUrl} alt={item.name} />
        </div>
        <div className="product-copy">
          <span>Product detail</span>
          <h2>{item.name}</h2>
          <p>{item.note}</p>
          <div className="seller-privacy large">
            <Icon name="Shield" />
            <span>
              Seller identity and underlying market-cost history are protected. The displayed amount is the current seller-authorised GCTC offer.
            </span>
          </div>
          <InfoColumns item={item} corridor={corridor} />
        </div>
      </article>
      <BuyBox item={item} corridor={corridor} selection={selection} handlers={handlers} onContinue={onContinue} />
    </section>
  )
}

function InfoColumns({ corridor, item }: { corridor: Corridor; item: CatalogueItemDTO }) {
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
        <span>{corridor.trustScore}% sourcing-route trust</span>
        <span>{corridor.protection}</span>
        <span>Price updated {item.priceUpdatedAt}</span>
        <span>Procurement: {item.procurementFrequency}</span>
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

export function BuyBox({
  corridor,
  handlers,
  item,
  onContinue,
  selection,
}: {
  corridor: Corridor
  handlers: TradeSelectionHandlers
  item: CatalogueItemDTO
  onContinue: () => void
  selection: TradeSelection
}) {
  return (
    <aside className="buy-box">
      <span>Trade cart</span>
      <strong>{formatMoney(item.basePrice, corridor.currency)} / lot</strong>
      <p>{item.unit}</p>
      <label className="quantity-control">
        <span>Lots</span>
        <input
          aria-label="Lots"
          min="1"
          max="10"
          type="number"
          value={selection.lots}
          onChange={(event) => handlers.setLots(Math.max(1, Number(event.target.value) || 1))}
        />
      </label>
      <FulfilmentSelector selected={selection.fulfilment} onChange={handlers.setFulfilment} />
      {selection.fulfilment === 'turnkey' ? (
        <>
          <QuotePanel
            title="Interstate transport"
            description="Delivery speed"
            selected={selection.freightTier}
            normal={tierCost(item, 'freight', 'normal')}
            urgent={tierCost(item, 'freight', 'urgent')}
            currency={corridor.currency}
            onChange={handlers.setFreightTier}
            testIdPrefix="freight"
          />
          <QuotePanel
            title="Packing"
            description="Handling option"
            selected={selection.moverTier}
            normal={tierCost(item, 'movers', 'normal')}
            urgent={tierCost(item, 'movers', 'urgent')}
            currency={corridor.currency}
            onChange={handlers.setMoverTier}
            testIdPrefix="movers"
          />
        </>
      ) : (
        <div className="buyer-responsibility">
          <Icon name="Document" />
          <span>Buyer arranges pickup, interstate transport, transit insurance, and final delivery.</span>
        </div>
      )}
      <button type="button" onClick={onContinue}>
        Add to trade cart
      </button>
    </aside>
  )
}

function FulfilmentSelector({
  selected,
  onChange,
}: {
  selected: FulfilmentOption
  onChange: (option: FulfilmentOption) => void
}) {
  const options: Array<{ id: FulfilmentOption; title: string; description: string }> = [
    {
      id: 'sourcing-only',
      title: 'Option 1 · GCTC sourcing',
      description: 'Product sourcing at the agreed quality, quantity, price, and frequency. Buyer manages pickup and interstate transport.',
    },
    {
      id: 'turnkey',
      title: 'Option 2 · GCTC delivered',
      description: 'Product, interstate transport, transit insurance, handling, and delivery coordination under one GCTC package.',
    },
  ]

  return (
    <div className="fulfilment-selector" role="radiogroup" aria-label="Fulfilment option">
      <span>Choose service scope</span>
      {options.map((option) => (
        <button
          aria-checked={selected === option.id}
          className={selected === option.id ? 'selected' : ''}
          data-testid={`fulfilment-${option.id}`}
          key={option.id}
          role="radio"
          type="button"
          onClick={() => onChange(option.id)}
        >
          <strong>{option.title}</strong>
          <span>{option.description}</span>
        </button>
      ))}
    </div>
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
