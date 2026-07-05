export function Icon({ name }: { name: string }) {
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
