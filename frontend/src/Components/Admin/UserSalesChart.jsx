import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getToken } from '../../Utils/helpers'
import axios from 'axios'
import { money } from './adminHelpers'

const PURPLE = '#7e3d84'
const MAX_BARS = 8

const centered = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a73', fontSize: '0.9rem', textAlign: 'center', padding: '0 1rem' }
const axisProps = { tick: { fontSize: 11, fill: '#6b5a73' }, stroke: '#cdbbd6' }

const UserSalesChart = () => {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${getToken()}` }, withCredentials: true }
                const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/customer-sales`, config)
                setSales(
                    (data.customerSales || [])
                        .map(s => ({ name: s.userDetails?.name || 'Unknown', total: Number(s.total) || 0 }))
                        .sort((a, b) => b.total - a.total)
                        .slice(0, MAX_BARS)
                )
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
    if (sales.length === 0) return <div style={centered}>No customer sales yet.</div>

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sales} margin={{ top: 10, right: 16, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#e9dff0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" {...axisProps} interval={0} />
                <YAxis {...axisProps} width={72} tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} />
                <Tooltip
                    cursor={{ fill: 'rgba(126, 61, 132, 0.08)' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e6d8ef', fontSize: 12 }}
                    formatter={(value) => [money(value), 'Spent']}
                />
                <Bar dataKey="total" fill={PURPLE} radius={[6, 6, 0, 0]} maxBarSize={72} />
            </BarChart>
        </ResponsiveContainer>
    )
}
export default UserSalesChart
