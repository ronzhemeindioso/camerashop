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

const API = import.meta.env.VITE_API

const TrashProducts = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

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

    const restore = async (id) => {
        try {
            await axios.put(`${API}/admin/product/${id}/restore`, {}, { withCredentials: true })
            toast.success('Product restored', { position: 'bottom-right' })
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

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
                    <button className="adm-icon-btn" title="Restore" onClick={() => restore(p._id)}>
                        <i className="fa fa-undo"></i>
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
                subtitle={<><b>{products.length}</b> in trash · <Link to="/admin/products">Back to products</Link></>}
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
                    />
                )}
            </AdminLayout>
        </>
    )
}

export default TrashProducts
