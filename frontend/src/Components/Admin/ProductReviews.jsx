import React, { useState, useEffect } from 'react'


import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
// import Toast from '../Layout/Toast'
import Swal from 'sweetalert2'
import { getToken, errMsg, successMsg } from '../../Utils/helpers'
import axios from 'axios'

const ProductReviews = () => {
    const [productId, setProductId] = useState('')
    const [listReviews, setListReviews] = useState([])
    const [refreshKey, setRefreshKey] = useState(0)
    const [products, setProducts] = useState([])

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    }

    const getProductReviews = async (id) => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/reviews?id=${id}`, config)
            setListReviews(data.reviews)
        } catch (error) {
            setListReviews([])
        }
    }

    const deleteReview = async (id, productId) => {
        try {
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/reviews?id=${id}&productId=${productId}`, config)
            if (data.success) {
                successMsg('Review deleted successfully')
                setRefreshKey((k) => k + 1)
            }
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        }
    }

    const deleteReviewHandler = (id) => {
        Swal.fire({
            title: 'Delete Review',
            icon: 'info',
            text: 'Do you want to delete this review',
            confirmButtonText: 'Delete',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                deleteReview(id, productId.trim())
            }
        })
    }

    // product list for the dropdown (reloaded after a delete so the review counts stay right)
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`, config)
                setProducts(data.products || [])
            } catch (error) {
                setProducts([])
            }
        }
        loadProducts()
    }, [refreshKey])

    // Search automatically: once the box holds a complete product ID (24 hex characters),
    // look it up after a short pause. Anything else just clears the list.
    useEffect(() => {
        const id = productId.trim()
        if (!/^[a-f\d]{24}$/i.test(id)) {
            setListReviews([])
            return
        }
        const timer = setTimeout(() => getProductReviews(id), 300)
        return () => clearTimeout(timer)
    }, [productId, refreshKey])

    const columns = [
        {
            key: 'id', label: 'Review ID', sortValue: (r) => r._id,
            render: (r) => <span className="adm-mono" title={r._id}>#{r._id.slice(-8)}</span>
        },
        {
            key: 'rating', label: 'Rating', sortable: true, sortValue: (r) => Number(r.rating),
            render: (r) => <span className="adm-pill amber">{r.rating} <i className="fa fa-star"></i></span>
        },
        { key: 'comment', label: 'Comment', render: (r) => <div className="adm-truncate" style={{ maxWidth: 360 }}>{r.comment}</div> },
        { key: 'name', label: 'User', sortable: true, render: (r) => <span className="adm-strong">{r.name}</span> },
        {
            key: 'actions', label: '',
            render: (r) => (
                <div className="adm-actions">
                    <button className="adm-icon-btn danger" title="Delete" onClick={() => deleteReviewHandler(r._id)}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ];

    return (
        <>
            <MetaData title={'Product Reviews'} />
            <AdminLayout title="Reviews" subtitle="Choose a product to manage its reviews">
                <div className="adm-card">
                    <div className="adm-card-head">
                        <h2>Find reviews</h2>
                        <div className="adm-toolbar">
                            <select
                                id="productId_field"
                                className="adm-select"
                                style={{ minWidth: 320 }}
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            >
                                <option value="">Select a product...</option>
                                {products.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} ({p.numOfReviews || 0} {p.numOfReviews === 1 ? 'review' : 'reviews'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {listReviews && listReviews.length > 0 ? (
                    <DataTable
                        title="Reviews"
                        columns={columns}
                        rows={listReviews}
                        rowKey={(r) => r._id}
                        searchText={(r) => `${r.name} ${r.comment}`}
                        searchPlaceholder="Search reviews..."
                    />
                ) : (
                    <div className="adm-card"><div className="adm-card-body adm-empty">{productId ? 'This product has no reviews.' : 'Select a product to see its reviews.'}</div></div>
                )}
            </AdminLayout>
        </>
    )
}

export default ProductReviews