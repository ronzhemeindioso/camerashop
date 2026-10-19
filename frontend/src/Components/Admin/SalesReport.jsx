import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
    LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import { money } from './adminHelpers'

const API = import.meta.env.VITE_API
const PURPLE = '#7e3d84'

// ---- small date helpers (local time, "YYYY-MM-DD") ----
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

// ---- tiny segmented toggle (styled inline so it does not depend on admin.css) ----
const Segmented = ({ value, options, onChange }) => (
    <div style={{ display: 'inline-flex', border: '1px solid #e6d8ef', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        {options.map(o => (
            <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                style={{
                    padding: '0 16px',
                    height: 42,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
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

const SalesReport = () => {
    const today = new Date()
    const presets = [
        { label: 'Last 7 days', from: iso(daysAgo(6)), to: iso(today), groupBy: 'day' },
        { label: 'Last 30 days', from: iso(daysAgo(29)), to: iso(today), groupBy: 'day' },
        { label: 'This month', from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today), groupBy: 'day' },
        { label: 'This year', from: `${today.getFullYear()}-01-01`, to: iso(today), groupBy: 'month' },
        { label: 'All time', from: '', to: '', groupBy: 'month' },
    ]

    const [from, setFrom] = useState(presets[1].from)   // default: last 30 days
    const [to, setTo] = useState(presets[1].to)
    const [groupBy, setGroupBy] = useState('day')
    const [chartType, setChartType] = useState('line')
    const [result, setResult] = useState({ sales: [], groupBy: 'day' })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const rangeInvalid = from && to && from > to

    useEffect(() => {
        if (rangeInvalid) {
            setError('"From" date must not be after "To" date')
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
    const average = totalOrders ? totalSales / totalOrders : 0
    const best = chartData.reduce((top, r) => (!top || r.total > top.total ? r : top), null)

    const applyPreset = (p) => {
        setFrom(p.from)
        setTo(p.to)
        setGroupBy(p.groupBy)
    }

    const axisProps = {
        tick: { fontSize: 12, fill: '#6b5a73' },
        stroke: '#cdbbd6',
    }

    const sharedChart = (
        <>
            <CartesianGrid stroke="#e9dff0" strokeDasharray="4 4" />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} width={80} />
            <Tooltip
                formatter={(value, name) => name === 'total' ? [money(value), 'Sales'] : [value, 'Orders']}
                labelFormatter={(label) => label}
            />
        </>
    )

    return (
        <>
            <MetaData title={'Sales Report'} />
            <AdminLayout title="Sales report" subtitle="Pick a date range to see how much the store sold">
                {/* ---------- filters ---------- */}
                <div className="adm-card" style={{ marginBottom: 18 }}>
                    <div style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.85rem' }}>
                            From
                            <input type="date" className="adm-input" value={from} max={to || undefined}
                                onChange={(e) => setFrom(e.target.value)} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.85rem' }}>
                            To
                            <input type="date" className="adm-input" value={to} min={from || undefined}
                                onChange={(e) => setTo(e.target.value)} />
                        </label>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.85rem' }}>
                            Group by
                            <Segmented
                                value={groupBy}
                                onChange={setGroupBy}
                                options={[{ value: 'day', label: 'Day' }, { value: 'month', label: 'Month' }]}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.85rem' }}>
                            Chart
                            <Segmented
                                value={chartType}
                                onChange={setChartType}
                                options={[{ value: 'line', label: 'Line' }, { value: 'bar', label: 'Bar' }]}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '0 24px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {presets.map(p => {
                            const active = p.from === from && p.to === to
                            return (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 999,
                                        border: `1px solid ${active ? PURPLE : '#e6d8ef'}`,
                                        background: active ? '#f1e4f7' : '#fff',
                                        color: '#5a2a61',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {p.label}
                                </button>
                            )
                        })}
                    </div>

                    {error && (
                        <div style={{ margin: '0 24px 18px', color: '#b71c1c', fontWeight: 600 }}>{error}</div>
                    )}
                </div>

                {/* ---------- summary ---------- */}
                <div className="adm-stats">
                    <div className="adm-stat">
                        <div className="adm-stat-icon"><i className="fa fa-money"></i></div>
                        <div><div className="adm-stat-value">{money(totalSales)}</div><div className="adm-stat-label">Total sales</div></div>
                    </div>
                    <div className="adm-stat">
                        <div className="adm-stat-icon"><i className="fa fa-shopping-basket"></i></div>
                        <div><div className="adm-stat-value">{totalOrders}</div><div className="adm-stat-label">Orders</div></div>
                    </div>
                    <div className="adm-stat">
                        <div className="adm-stat-icon"><i className="fa fa-line-chart"></i></div>
                        <div><div className="adm-stat-value">{money(average)}</div><div className="adm-stat-label">Average order</div></div>
                    </div>
                    <div className="adm-stat">
                        <div className="adm-stat-icon"><i className="fa fa-trophy"></i></div>
                        <div>
                            <div className="adm-stat-value">{best ? money(best.total) : '—'}</div>
                            <div className="adm-stat-label">{best ? `Best ${result.groupBy}: ${best.label}` : 'Best period'}</div>
                        </div>
                    </div>
                </div>

                {/* ---------- chart ---------- */}
                <div className="adm-card">
                    <div className="adm-card-head">
                        <h2>{result.groupBy === 'month' ? 'Monthly' : 'Daily'} sales</h2>
                    </div>
                    <div style={{ padding: '0 24px 24px' }}>
                        {loading ? <Loader /> : chartData.length === 0 ? (
                            <div className="adm-empty" style={{ padding: '60px 0', textAlign: 'center' }}>
                                No sales in this date range.
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'line' ? (
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                                            {sharedChart}
                                            <Line type="monotone" dataKey="total" stroke={PURPLE} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    ) : (
                                        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                                            {sharedChart}
                                            <Bar dataKey="total" fill={PURPLE} radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}

export default SalesReport
