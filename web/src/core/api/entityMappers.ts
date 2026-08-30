export function mapIsoDateToDisplay(isoStr?: string | null): string {
  if (!isoStr) return 'N/A'
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoStr
  }
}

export function formatCurrencyINR(amount?: number | null): string {
  if (amount === undefined || amount === null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
