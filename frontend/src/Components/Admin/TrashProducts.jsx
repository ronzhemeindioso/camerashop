import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { money } from './adminHelpers'
import { confirmRestore, confirmPermanent } from '../../Utils/confirmDialog'

const API = import.meta.env.VITE_API

const RED = '#d32f2f'
const RED_DARK = '#b71c1c'

const TrashProducts = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState([])

    const load = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/admin/products?deleted=true`, { withCredentials: true })
            setProducts(data.products || [])
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const restore = async (id, name) => {
        if (!(await confirmRestore(`Restore "${name}"?`, 'It will go back to the products list.'))) return
        try {
            await axios.put(`${API}/admin/product/${id}/restore`, {}, { withCredentials: true })
            toast.success('Product restored', { position: 'bottom-right' })
            setSelected(prev => prev.filter(x => x !== id))
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    // Permanent delete for one or many products (ids = array of _id)
    const permanentDelete = async (ids, label) => {
        const ok = await confirmPermanent(
            'Delete permanently?',
            `${label} will be removed for good, including its photos. This cannot be undone.`,
        )
        if (!ok) return

        try {
            const { data } = await axios.delete(`${API}/admin/products/permanent`, {
                data: { ids },
                withCredentials: true,
            })
            toast.success(data.message || 'Permanently deleted', { position: 'bottom-right' })
            setSelected(prev => prev.filter(x => !ids.includes(x)))
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    // only act on ticked rows that still exist in the list
    const shownIds = new Set(products.map(p => p._id))
    const selectedInView = selected.filter(id => shownIds.has(id))

    const columns = [
        { key: 'name', label: 'Product', sortable: true, render: (p) => <span className="adm-strong">{p.name}</span> },
        { key: 'price', label: 'Sell Price', sortable: true, render: (p) => <span className="adm-price">{money(p.price)}</span> },
        { key: 'category', label: 'Category', render: (p) => <span className="adm-pill tag">{p.category}</span> },
        {
            key: 'deletedAt', label: 'Deleted', sortable: true,
            render: (p) => new Date(p.deletedAt).toLocaleString()
        },
        {
            key: 'actions', label: '',
            render: (p) => (
                <div className="adm-actions">
                    <button className="adm-icon-btn" title="Restore" onClick={() => restore(p._id, p.name)}>
                        <i className="fa fa-undo"></i>
                    </button>
                    <button
                        className="adm-icon-btn danger"
                        title="Delete permanently"
                        onClick={() => permanentDelete([p._id], `"${p.name}"`)}
                    >
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'Deleted Products'} />
            <AdminLayout
                title="Deleted products"
                subtitle={<><b>{products.length}</b> in trash</>}
                actions={
                    <Link to="/admin/products" className="adm-btn">
                        Back to products
                    </Link>
                }
            >
                {loading ? <Loader /> : (
                    <DataTable
                        title="Trash"
                        columns={columns}
                        rows={products}
                        rowKey={(p) => p._id}
                        searchText={(p) => `${p.name} ${p.category || ''}`}
                        searchPlaceholder="Search deleted products..."
                        emptyText="Trash is empty."
                        selectable
                        selectedIds={selectedInView}
                        onSelectionChange={setSelected}
                        actions={
                            selectedInView.length > 0 && (
                                <button
                                    type="button"
                                    className="adm-btn"
                                    style={{ background: RED, borderColor: RED, color: '#fff', fontWeight: 600 }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = RED_DARK }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = RED }}
                                    onClick={() => permanentDelete(selectedInView, `${selectedInView.length} selected product(s)`)}
                                >
                                    <i className="fa fa-trash"></i> Delete selected permanently ({selectedInView.length})
                                </button>
                            )
                        }
                    />
                )}
            </AdminLayout>
        </>
    )
}

export default TrashProducts
