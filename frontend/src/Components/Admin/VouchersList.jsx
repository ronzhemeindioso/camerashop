import React, { useEffect, useState } from 'react'
import axios from 'axios'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { formatDate, money } from './adminHelpers'
import { errMsg, successMsg } from '../../Utils/helpers'

const EMPTY_FORM = {
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minPurchase: '0',
    maxDiscount: '0',
    usageLimit: '0',
    perUserLimit: '1',
    startsAt: '',
    expiresAt: '',
    isActive: true,
}

// <input type="date"> works with local "YYYY-MM-DD" strings
const toInputDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const getStatus = (v) => {
    const now = new Date()
    if (!v.isActive) return { label: 'Disabled', tone: 'red' }
    if (v.expiresAt && new Date(v.expiresAt) < now) return { label: 'Expired', tone: 'amber' }
    if (v.startsAt && new Date(v.startsAt) > now) return { label: 'Scheduled', tone: 'blue' }
    if (v.usageLimit > 0 && v.usedCount >= v.usageLimit) return { label: 'Used up', tone: 'amber' }
    return { label: 'Active', tone: 'green' }
}

const VouchersList = () => {
    const [loading, setLoading] = useState(true)
    const [vouchers, setVouchers] = useState([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const config = {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
    }

    const loadVouchers = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/vouchers`, config)
            setVouchers(data.vouchers)
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadVouchers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

    const openNew = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setModalOpen(true)
    }

    const openEdit = (v) => {
        setEditingId(v._id)
        setForm({
            code: v.code,
            description: v.description || '',
            discountType: v.discountType,
            discountValue: String(v.discountValue),
            minPurchase: String(v.minPurchase || 0),
            maxDiscount: String(v.maxDiscount || 0),
            usageLimit: String(v.usageLimit || 0),
            perUserLimit: String(v.perUserLimit ?? 1),
            startsAt: toInputDate(v.startsAt),
            expiresAt: toInputDate(v.expiresAt),
            isActive: v.isActive,
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        if (!saving) setModalOpen(false)
    }

    const save = async (e) => {
        e.preventDefault()
        const value = Number(form.discountValue)
        if (!form.code.trim()) return errMsg('Please enter a voucher code')
        if (!(value > 0)) return errMsg('Discount value must be greater than 0')
        if (form.discountType === 'percent' && value > 100) return errMsg('A percentage discount cannot be more than 100')
        if (form.startsAt && form.expiresAt && form.expiresAt < form.startsAt) {
            return errMsg('The end date must be after the start date')
        }

        const body = {
            code: form.code.trim().toUpperCase(),
            description: form.description.trim(),
            discountType: form.discountType,
            discountValue: value,
            minPurchase: Number(form.minPurchase) || 0,
            maxDiscount: form.discountType === 'percent' ? (Number(form.maxDiscount) || 0) : 0,
            usageLimit: Number(form.usageLimit) || 0,
            perUserLimit: Number(form.perUserLimit) || 0,
            // start of the first day / end of the last day, in the admin's local time
            startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : '',
            expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : '',
            isActive: form.isActive,
        }

        setSaving(true)
        try {
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API}/admin/voucher/${editingId}`, body, config)
                successMsg('Voucher updated')
            } else {
                await axios.post(`${import.meta.env.VITE_API}/admin/voucher/new`, body, config)
                successMsg('Voucher created')
            }
            setModalOpen(false)
            await loadVouchers()
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (v) => {
        try {
            await axios.put(`${import.meta.env.VITE_API}/admin/voucher/${v._id}`, { isActive: !v.isActive }, config)
            setVouchers(prev => prev.map(x => x._id === v._id ? { ...x, isActive: !v.isActive } : x))
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        }
    }

    const remove = async (v) => {
        if (!window.confirm(`Delete voucher "${v.code}"? Orders that already used it keep their discount.`)) return
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/voucher/${v._id}`, config)
            setVouchers(prev => prev.filter(x => x._id !== v._id))
            successMsg('Voucher deleted')
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        }
    }

    const columns = [
        {
            key: 'code', label: 'Code', sortable: true,
            render: (v) => (
                <div>
                    <span className="adm-strong" style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{v.code}</span>
                    {v.description && <div className="adm-muted" style={{ fontSize: '0.85rem' }}>{v.description}</div>}
                </div>
            )
        },
        {
            key: 'discountValue', label: 'Discount', sortable: true,
            render: (v) => v.discountType === 'percent'
                ? <span>{v.discountValue}%{v.maxDiscount > 0 && <span className="adm-muted"> (max {money(v.maxDiscount)})</span>}</span>
                : <span>{money(v.discountValue)}</span>
        },
        {
            key: 'minPurchase', label: 'Min. spend', sortable: true,
            render: (v) => <span className="adm-muted">{v.minPurchase > 0 ? money(v.minPurchase) : '—'}</span>
        },
        {
            key: 'usedCount', label: 'Used', sortable: true,
            render: (v) => <span>{v.usedCount}{v.usageLimit > 0 ? ` / ${v.usageLimit}` : ''}</span>
        },
        {
            key: 'expiresAt', label: 'Valid until', sortable: true,
            sortValue: (v) => (v.expiresAt ? new Date(v.expiresAt).getTime() : Number.MAX_SAFE_INTEGER),
            render: (v) => <span className="adm-muted">{v.expiresAt ? formatDate(v.expiresAt) : 'No expiry'}</span>
        },
        {
            key: 'status', label: 'Status', sortValue: (v) => getStatus(v).label,
            render: (v) => {
                const s = getStatus(v)
                return <span className={`adm-pill dot ${s.tone}`}>{s.label}</span>
            }
        },
        {
            key: 'actions', label: '',
            render: (v) => (
                <div className="adm-actions">
                    <button className="adm-icon-btn" title={v.isActive ? 'Disable' : 'Enable'} onClick={() => toggleActive(v)}>
                        <i className={`fa ${v.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                    <button className="adm-icon-btn" title="Edit" onClick={() => openEdit(v)}>
                        <i className="fa fa-pencil"></i>
                    </button>
                    <button className="adm-icon-btn danger" title="Delete" onClick={() => remove(v)}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'Vouchers'} />
            <AdminLayout
                title="Vouchers"
                subtitle={<><b>{vouchers.length}</b> total, create discount codes for your customers</>}
            >
                {loading ? <Loader /> : (
                    <DataTable
                        title="All vouchers"
                        columns={columns}
                        rows={vouchers}
                        searchText={(v) => `${v.code} ${v.description || ''}`}
                        searchPlaceholder="Search vouchers..."
                        emptyText="No vouchers yet. Create one to get started."
                        actions={<button type="button" className="adm-btn adm-btn-primary" onClick={openNew}>+ New voucher</button>}
                    />
                )}
            </AdminLayout>

            {modalOpen && (
                <div className="adm-modal-backdrop" onClick={closeModal}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={save}>
                            <div className="adm-modal-head">
                                <div>
                                    <h2>{editingId ? 'Edit voucher' : 'New voucher'}</h2>
                                    <p>Customers enter the code at checkout.</p>
                                </div>
                                <button type="button" className="adm-modal-close" onClick={closeModal} aria-label="Close">×</button>
                            </div>

                            <div className="adm-modal-body">
                                <div className="adm-form-grid">
                                    <div className="adm-field">
                                        <label htmlFor="voucher_code">Code</label>
                                        <input id="voucher_code" className="form-control" value={form.code} maxLength={30}
                                            placeholder="e.g. WELCOME10"
                                            onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/\s/g, ''))} />
                                    </div>
                                    <div className="adm-field">
                                        <label htmlFor="voucher_type">Discount type</label>
                                        <select id="voucher_type" className="form-control" value={form.discountType}
                                            onChange={(e) => setField('discountType', e.target.value)}>
                                            <option value="percent">Percentage (%)</option>
                                            <option value="fixed">Fixed amount</option>
                                        </select>
                                    </div>

                                    <div className="adm-field full">
                                        <label htmlFor="voucher_desc">Description (shown to customers)</label>
                                        <input id="voucher_desc" className="form-control" value={form.description} maxLength={200}
                                            onChange={(e) => setField('description', e.target.value)} />
                                    </div>

                                    <div className="adm-field">
                                        <label htmlFor="voucher_value">{form.discountType === 'percent' ? 'Percent off' : 'Amount off'}</label>
                                        <input id="voucher_value" type="number" min="0" step="0.01" className="form-control" value={form.discountValue}
                                            onChange={(e) => setField('discountValue', e.target.value)} />
                                    </div>
                                    <div className="adm-field">
                                        <label htmlFor="voucher_min">Minimum spend (0 = none)</label>
                                        <input id="voucher_min" type="number" min="0" step="0.01" className="form-control" value={form.minPurchase}
                                            onChange={(e) => setField('minPurchase', e.target.value)} />
                                    </div>

                                    {form.discountType === 'percent' && (
                                        <div className="adm-field full">
                                            <label htmlFor="voucher_max">Maximum discount (0 = no cap)</label>
                                            <input id="voucher_max" type="number" min="0" step="0.01" className="form-control" value={form.maxDiscount}
                                                onChange={(e) => setField('maxDiscount', e.target.value)} />
                                        </div>
                                    )}

                                    <div className="adm-field">
                                        <label htmlFor="voucher_limit">Total uses (0 = unlimited)</label>
                                        <input id="voucher_limit" type="number" min="0" step="1" className="form-control" value={form.usageLimit}
                                            onChange={(e) => setField('usageLimit', e.target.value)} />
                                    </div>
                                    <div className="adm-field">
                                        <label htmlFor="voucher_peruser">Uses per customer (0 = unlimited)</label>
                                        <input id="voucher_peruser" type="number" min="0" step="1" className="form-control" value={form.perUserLimit}
                                            onChange={(e) => setField('perUserLimit', e.target.value)} />
                                    </div>

                                    <div className="adm-field">
                                        <label htmlFor="voucher_start">Starts (optional)</label>
                                        <input id="voucher_start" type="date" className="form-control" value={form.startsAt}
                                            onChange={(e) => setField('startsAt', e.target.value)} />
                                    </div>
                                    <div className="adm-field">
                                        <label htmlFor="voucher_end">Expires (optional)</label>
                                        <input id="voucher_end" type="date" className="form-control" value={form.expiresAt}
                                            onChange={(e) => setField('expiresAt', e.target.value)} />
                                    </div>

                                    <div className="adm-field full">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
                                            Active (customers can use this voucher)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="adm-modal-foot">
                                <button type="button" className="adm-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingId ? 'Save changes' : 'Create voucher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default VouchersList
