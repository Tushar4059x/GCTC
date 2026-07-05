import type {
  AdminSaleExceptionDTO,
  ApiErrorBody,
  CatalogueItemDTO,
  DeliveryTier,
  FulfilmentOption,
  LogisticsPartnerDTO,
  OrderDTO,
  PriceRevisionDTO,
  QuoteDTO,
  SellerProductDTO,
  SellerSaleDTO,
  SessionUserDTO,
} from '@gctc/shared'

export class ApiError extends Error {
  statusCode: number
  code: string

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.statusCode = body.statusCode
    this.code = body.error
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    let body: ApiErrorBody
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = { statusCode: response.status, error: 'ERROR', message: response.statusText }
    }
    throw new ApiError(body)
  }
  return (await response.json()) as T
}

export interface QuoteRequest {
  productId: string
  lots: number
  freightTier: DeliveryTier
  moverTier: DeliveryTier
  fulfilment: FulfilmentOption
}

export interface PriceUpdateRequest {
  newPrice: number
  reason: string
  expectedVersion: number
}

export const api = {
  me: () => request<{ user: SessionUserDTO | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: SessionUserDTO }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  catalogue: (query = '') =>
    request<{ items: CatalogueItemDTO[] }>(
      `/api/catalogue${query ? `?query=${encodeURIComponent(query)}` : ''}`,
    ),

  createQuote: (input: QuoteRequest) =>
    request<{ quote: QuoteDTO }>('/api/quotes', { method: 'POST', body: JSON.stringify(input) }),
  checkout: (quoteId: string) =>
    request<{ order: OrderDTO }>('/api/orders', { method: 'POST', body: JSON.stringify({ quoteId }) }),
  orders: () => request<{ orders: OrderDTO[] }>('/api/orders'),

  sellerProducts: () => request<{ products: SellerProductDTO[] }>('/api/seller/products'),
  updatePrice: (productId: string, input: PriceUpdateRequest) =>
    request<{ product: SellerProductDTO }>(`/api/seller/products/${encodeURIComponent(productId)}/price`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  sellerAudits: () => request<{ audits: PriceRevisionDTO[] }>('/api/seller/price-audits'),
  sellerSales: () => request<{ sales: SellerSaleDTO[] }>('/api/seller/sales'),

  adminPartners: () => request<{ partners: LogisticsPartnerDTO[] }>('/api/admin/logistics-partners'),
  adminExceptions: () =>
    request<{ exceptions: AdminSaleExceptionDTO[] }>('/api/admin/sales-exceptions'),
  adminMetrics: () =>
    request<{ metrics: { gmvPipeline: number; exceptionCount: number; partnerCount: number } }>(
      '/api/admin/metrics',
    ),
}
