// Shared helpers for the admin pages
export const CURRENCY = '₱'
export const LOW_STOCK_LIMIT = 5

export const money = (value) =>
    `${CURRENCY}${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`

export const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : '—'

export const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })
        : '—'

export const formatShortDateTime = (value) =>
    value
        ? new Date(value).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })
        : ''
