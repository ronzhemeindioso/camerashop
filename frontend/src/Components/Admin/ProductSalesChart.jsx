import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getToken } from '../../Utils/helpers'
import { money } from './adminHelpers'

const TOP = 5
// one clear colour per slice; the last one (grey-purple) is for "Other"
const COLORS = ['#7e3d84', '#c49dd6', '#f3b35f', '#cd6e82', '#781528']
const OTHER_COLOR = '#d9d0de'
const LIGHT = new Set(['#c49dd6', '#f3b35f', '#d9d0de']) // slices that need dark text on them

const centered = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a73', fontSize: '0.9rem', textAlign: 'center', padding: '0 1rem' }

const RADIAN = Math.PI / 180

export default function ProductSalesChart() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${getToken()}` }, withCredentials: true }
                const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/product-sales`, config)
                const list = (data.sales || [])
                    .map(s => ({ name: s._id?.product || 'Unknown', total: Number(s.total) || 0 }))
                    .filter(s => s.total > 0)
                    .sort((a, b) => b.total - a.total)
                const sum = list.reduce((acc, r) => acc + r.total, 0)

                // keep the biggest few and fold everything else into one "Other" slice
                let slices = list
                if (list.length > TOP + 1) {
                    const rest = list.slice(TOP)
                    slices = [
                        ...list.slice(0, TOP),
                        { name: `Other (${rest.length} products)`, total: rest.reduce((acc, r) => acc + r.total, 0), other: true },
                    ]
                }
                setSales(slices.map((s, i) => ({
                    ...s,
                    // not called "percent": recharts passes its own fractional `percent` to the label
                    share: sum > 0 ? (s.total / sum) * 100 : 0,
                    color: s.other ? OTHER_COLOR : COLORS[i % COLORS.length],
                })))
            } catch (err) {
                setError(err.response?.data?.message || err.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return <div style={centered}>Loading...</div>
    if (error) return <div style={{ ...centered, color: '#b3262e' }}>{error}</div>
    if (sales.length === 0) return <div style={centered}>No product sales yet.</div>

    // percentage inside the slice (skipped on thin slices so labels never overlap)
    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        if (percent < 0.06) return null
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)
        return (
            <text x={x} y={y} fill={LIGHT.has(sales[index].color) ? '#3b1f42' : '#fff'} fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="central">
                {`${Math.round(percent * 100)}%`}
            </text>
        )
    }

    return (
        <div style={{ position: 'absolute', top: 0, bottom: '1rem', left: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flex: '1 1 48%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sales}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="92%"
                            stroke="#fff"
                            strokeWidth={2}
                            label={renderLabel}
                            labelLine={false}
                        >
                            {sales.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid #e6d8ef', fontSize: 12 }}
                            formatter={(value, name) => [money(value), name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* legend: just the colour dot and the product name */}
            <ul style={{ flex: '0 1 260px', minWidth: 0, maxHeight: '100%', overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sales.map((s, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flex: 'none' }} />
                        <span style={{ minWidth: 0, color: '#3b1f42', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>{s.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
