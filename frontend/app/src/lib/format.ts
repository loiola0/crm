export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const compactNumberFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Nao informado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
