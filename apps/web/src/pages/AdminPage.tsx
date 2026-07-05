import { useEffect, useState } from 'react'
import {
  commonIndiaTradeDocuments,
  formatMoney,
  type AdminSaleExceptionDTO,
  type LogisticsPartnerDTO,
  type SessionUserDTO,
} from '@gctc/shared'
import { api } from '../api/client.ts'
import { AccessDenied, MetricCard } from '../components/chrome.tsx'

interface AdminMetrics {
  gmvPipeline: number
  exceptionCount: number
  partnerCount: number
}

export function AdminPage({ user }: { user: SessionUserDTO }) {
  const [partners, setPartners] = useState<LogisticsPartnerDTO[]>([])
  const [exceptions, setExceptions] = useState<AdminSaleExceptionDTO[]>([])
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    Promise.all([api.adminPartners(), api.adminExceptions(), api.adminMetrics()])
      .then(([partnersRes, exceptionsRes, metricsRes]) => {
        if (cancelled) return
        setPartners(partnersRes.partners)
        setExceptions(exceptionsRes.exceptions)
        setMetrics(metricsRes.metrics)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load admin data')
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  if (!isAdmin) return <AccessDenied needed="admin" />

  return (
    <section className="dashboard-grid">
      <MetricCard
        label="GMV pipeline"
        value={metrics ? formatMoney(metrics.gmvPipeline) : '…'}
        detail="Recorded sales plus live order pipeline"
      />
      <MetricCard
        label="Seller quality review"
        value={String(metrics?.exceptionCount ?? exceptions.length)}
        detail="Sales with quality or dispute exceptions"
      />
      <MetricCard
        label="Logistics partners"
        value={String(metrics?.partnerCount ?? partners.length)}
        detail="Private operator directory and tariffs"
      />
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <span>Private operations</span>
            <h2>Logistics partner and tariff desk</h2>
          </div>
          <p>Buyer screens expose GCTC support and quoted costs only, never contractor identity.</p>
        </div>
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="logistics-table">
          {partners.map((partner) => (
            <div key={partner.id}>
              <span><strong>{partner.type}</strong><small>{partner.id}</small></span>
              <span><strong>{partner.legalName}</strong><small>{partner.corridor}</small></span>
              <span>
                <strong>{formatMoney(partner.baseRatePerTon)} / ton</strong>
                <small>{partner.distanceRatePerTonKm > 0 ? `${formatMoney(partner.distanceRatePerTonKm)} / ton-km` : 'Fixed storage tariff'}</small>
              </span>
              <span><strong>{partner.capacity}</strong><small>Audited {partner.lastAudit}</small></span>
              <span className={partner.status === 'Verified' ? 'status-label passed' : 'status-label review'}>{partner.status}</span>
            </div>
          ))}
        </div>
      </article>
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <span>Quality control</span>
            <h2>Seller sales exceptions</h2>
          </div>
          <p>Review product performance without disclosing buyer contact details to sellers.</p>
        </div>
        <div className="report-table">
          <div className="report-row report-head">
            <span>Sale</span><span>Seller</span><span>Product</span><span>Disputes</span><span>Quality</span>
          </div>
          {exceptions.map((sale) => (
            <div className="report-row" key={sale.id}>
              <span><strong>{sale.id}</strong><small>{sale.soldAt}</small></span>
              <span>{sale.sellerId}</span>
              <span>{sale.productName}</span>
              <span>{sale.disputeCount}</span>
              <span className={`status-label ${sale.qualityStatus}`}>{sale.qualityStatus}</span>
            </div>
          ))}
        </div>
      </article>
      <article className="panel">
        <span>Domestic trade controls</span>
        <h2>Core document pack</h2>
        <p>{commonIndiaTradeDocuments.join(' · ')}</p>
      </article>
      <article className="panel">
        <span>Category approvals</span>
        <h2>Conditional documents</h2>
        <p>Food products: FSSAI and batch safety reports · Plant commodities: FSSAI and commodity quality reports.</p>
      </article>
    </section>
  )
}
