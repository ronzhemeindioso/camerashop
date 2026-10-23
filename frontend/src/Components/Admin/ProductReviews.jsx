import React, { useState, useEffect } from 'react'
import axios from 'axios'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { getToken, errMsg, successMsg } from '../../Utils/helpers'
import { confirmDialog } from '../../Utils/confirmDialog'

const ProductReviews = () => {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [productFilter, setProductFilter] = useState('')
    const [ratingFilter, setRatingFilter] = useState('')

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        withCredentials: true
    }

    // every review of every product, loaded from the products list
    const loadReviews = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`, config)
            setProducts(data.products || [])
        } catch (error) {
            setProducts([])
            errMsg(error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReviews()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // flatten: one row per review, remembering which product it belongs to
    const allReviews = products.flatMap(p =>
        (p.reviews || []).map(r => ({ ...r, productId: p._id, productName: p.name }))
    )

    const rows = allReviews.filter(r => {
        if (productFilter && r.productId !== productFilter) return false
        if (ratingFilter && Math.round(Number(r.rating)) !== Number(ratingFilter)) return false
        return true
    })

    const productsWithReviews = products.filter(p => (p.reviews || []).length > 0)

    const remove = async (r) => {
        const ok = await confirmDialog({
            icon: 'alert',
            tone: 'danger',
            title: 'Delete this review?',
            text: `The review by ${r.name} on "${r.productName}" will be removed. This cannot be undone.`,
            confirmText: 'Delete review',
        })
        if (!ok) return
        try {
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/reviews?id=${r._id}&productId=${r.productId}`, config)
            if (data.success) {
                successMsg('Review deleted successfully')
                await loadReviews()
            }
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        }
    }

    const columns = [
        {
            key: 'productName', label: 'Product', sortable: true,
            render: (r) => <span className="adm-strong">{r.productName}</span>
        },
        {
            key: 'rating', label: 'Rating', sortable: true, sortValue: (r) => Number(r.rating),
            render: (r) => <span className="adm-pill amber">{r.rating} <i className="fa fa-star"></i></span>
        },
        { key: 'comment', label: 'Comment', render: (r) => <div className="adm-truncate" style={{ maxWidth: 360 }}>{r.comment}</div> },
        { key: 'name', label: 'User', sortable: true, render: (r) => <span className="adm-muted">{r.name}</span> },
        {
            key: 'actions', label: '',
            render: (r) => (
                <div className="adm-actions">
                    <button className="adm-icon-btn danger" title="Delete" onClick={() => remove(r)}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'Product Reviews'} />
            <AdminLayout
                title="Reviews"
                subtitle={<><b>{allReviews.length}</b> total, see what customers say about your products</>}
            >
                {loading ? <Loader /> : (
                    <DataTable
                        title="All reviews"
                        columns={columns}
                        rows={rows}
                        rowKey={(r) => r._id}
                        searchText={(r) => `${r.productName} ${r.name} ${r.comment}`}
                        searchPlaceholder="Search reviews..."
                        emptyText="No reviews yet."
                        filters={
                            <>
                                <select className="adm-select" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                                    <option value="">All products</option>
                                    {productsWithReviews.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.reviews.length})</option>
                                    ))}
                                </select>
                                <select className="adm-select" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                                    <option value="">All ratings</option>
                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                                </select>
                            </>
                        }
                    />
                )}
            </AdminLayout>
        </>
    )
}

export default ProductReviews
