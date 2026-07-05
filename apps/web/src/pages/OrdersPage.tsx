import { formatMoney, type OrderDTO, type SessionUserDTO } from '@gctc/shared'

const tracking = ['Payment received', 'Seller confirmed', 'Packed', 'Documents', 'In transit', 'Delivered']

export function OrdersPage({
  loading,
  orders,
  user,
}: {
  loading: boolean
  orders: OrderDTO[]
  user: SessionUserDTO
}) {
  const activeIndex = orders.length > 0 ? 1 : 0
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span>{user.role === 'buyer' ? 'My orders' : 'Order operations'}</span>
          <h2>Trade tracking</h2>
        </div>
        <p>Amazon-style order status, adapted for interstate wholesale procurement.</p>
      </div>
      {orders.length === 0 && (
        <p>{loading ? 'Loading orders…' : 'No orders yet. Lock a quote at checkout to start one.'}</p>
      )}
      <div className="order-grid">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <img src={order.imageUrl} alt={order.productName} />
            <div>
              <strong>{order.id}</strong>
              <h3>{order.productName}</h3>
              <p>{order.status}</p>
              <span>{order.protection} · {order.corridorLabel}</span>
              {user.role !== 'buyer' && <span>{order.buyerLabel}</span>}
            </div>
            <strong>{formatMoney(order.totalAmount, order.currency)}</strong>
          </article>
        ))}
      </div>
      {orders.length > 0 && (
        <div className="tracker">
          {tracking.map((step, index) => (
            <span className={index <= activeIndex ? 'active' : ''} key={step}>
              {step}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
