import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
    LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { money } from './adminHelpers'

const API = import.meta.env.VITE_API
const PURPLE = '#7e3d84'

// ---- date helpers (local time, "YYYY-MM-DD") ----
const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
}

// "2026-10-19" -> "Oct 19"   |   "2026-10" -> "Oct 2026"
const labelFor = (period, groupBy) => {
    const [y, m, d] = period.split('-').map(Number)
    return groupBy === 'month'
        ? new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const makePresets = () => {
    const today = new Date()
    return [
        { key: '7', label: '7D', from: iso(daysAgo(6)), to: iso(today), groupBy: 'day' },
        { key: '30', label: '30D', from: iso(daysAgo(29)), to: iso(today), groupBy: 'day' },
        { key: '90', label: '90D', from: iso(daysAgo(89)), to: iso(today), groupBy: 'month' },
        { key: 'all', label: 'All', from: '', to: '', groupBy: 'month' },
    ]
}

// small segmented toggle (inline styles, no admin.css needed)
const Segmented = ({ value, options, onChange }) => (
    <div style={{ display: 'inline-flex', border: '1px solid #e6d8ef', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        {options.map(o => (
            <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                style={{
                    padding: '0 12px',
                    height: 34,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: value === o.value ? PURPLE : '#fff',
                    color: value === o.value ? '#fff' : '#5a2a61',
                }}
            >
                {o.label}
            </button>
        ))}
    </div>
)

const fieldStyle = { height: 36, fontSize: '0.85rem', padding: '0 10px' }

/**
 * Renders the head + body of a dashboard chart card:
 *   <div className="adm-card adm-chart-wide"><SalesChart /></div>
 */
const SalesChart = () => {
    const presets = makePresets()

    const [from, setFrom] = useState('')          // default: all time, grouped by month
    const [to, setTo] = useState('')
    const [groupBy, setGroupBy] = useState('month')
    const [chartType, setChartType] = useState('line')
    const [customOpen, setCustomOpen] = useState(false)
    const [result, setResult] = useState({ sales: [], groupBy: 'month' })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const rangeInvalid = from && to && from > to
    const activePreset = customOpen ? null : presets.find(p => p.from === from && p.to === to)
    const showCustom = customOpen || !activePreset

    useEffect(() => {
        if (rangeInvalid) {
            setError('"From" must not be after "To"')
            return
        }
        setError('')
        setLoading(true)

        let cancelled = false
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

        axios.get(`${API}/admin/sales`, {
            params: { from, to, groupBy, tz },
            withCredentials: true,
        })
            .then(({ data }) => { if (!cancelled) setResult({ sales: data.sales || [], groupBy: data.groupBy }) })
            .catch((err) => {
                if (!cancelled) {
                    setResult({ sales: [], groupBy })
                    setError(err.response?.data?.message || err.message)
                }
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [from, to, groupBy, rangeInvalid])

    const chartData = useMemo(
        () => result.sales.map(r => ({ ...r, label: labelFor(r.period, result.groupBy) })),
        [result]
    )
    const totalSales = chartData.reduce((sum, r) => sum + r.total, 0)
    const totalOrders = chartData.reduce((sum, r) => sum + r.orders, 0)

    const onPreset = (key) => {
        const p = presets.find(x => x.key === key)
        if (!p) return
        setCustomOpen(false)
        setFrom(p.from)
        setTo(p.to)
        setGroupBy(p.groupBy)
    }

    const axisProps = { tick: { fontSize: 11, fill: '#6b5a73' }, stroke: '#cdbbd6' }
    const shared = (
        <>
            <CartesianGrid stroke="#e9dff0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={72} tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} />
            <Tooltip
                cursor={{ fill: 'rgba(126, 61, 132, 0.08)' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #e6d8ef', fontSize: 12 }}
                formatter={(value, name) => name === 'total' ? [money(value), 'Sales'] : [value, 'Orders']}
            />
        </>
    )

    const centered = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a73' }

    return (
        <>
            <div className="adm-card-head" style={{ display: 'block' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                    <h2 style={{ margin: 0 }}>Sales</h2>
                    <span style={{ color: '#6b5a73', fontSize: '0.9rem' }}>
                        <b style={{ color: '#3b1f42' }}>{money(totalSales)}</b> from {totalOrders} {totalOrders === 1 ? 'order' : 'orders'}
                    </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <Segmented
                        value={showCustom ? 'custom' : activePreset.key}
                        onChange={(v) => (v === 'custom' ? setCustomOpen(true) : onPreset(v))}
                        options={[...presets.map(p => ({ value: p.key, label: p.label })), { value: 'custom', label: 'Custom' }]}
                    />
                    <Segmented value={groupBy} onChange={setGroupBy}
                        options={[{ value: 'day', label: 'Day' }, { value: 'month', label: 'Month' }]} />
                    <Segmented value={chartType} onChange={setChartType}
                        options={[{ value: 'line', label: 'Line' }, { value: 'bar', label: 'Bar' }]} />
                </div>

                {showCustom && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <input type="date" className="adm-input" style={fieldStyle} value={from}
                            max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From date" title="From" />
                        <span style={{ color: '#6b5a73' }}>to</span>
                        <input type="date" className="adm-input" style={fieldStyle} value={to}
                            min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To date" title="To" />
                    </div>
                )}

                {error && <div style={{ color: '#b71c1c', fontWeight: 600, marginTop: 8, fontSize: '0.9rem' }}>{error}</div>}
            </div>

            <div className="adm-card-body">
                {loading ? (
                    <div style={centered}>Loading sales...</div>
                ) : chartData.length === 0 ? (
                    <div style={centered}>No sales in this date range.</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'line' ? (
                            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 5, left: 0 }}>
                                {shared}
                                <Line type="monotone" dataKey="total" stroke={PURPLE} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 16, bottom: 5, left: 0 }}>
                                {shared}
                                <Bar dataKey="total" fill={PURPLE} radius={[6, 6, 0, 0]} maxBarSize={72} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </>
    )
}

export default SalesChart
