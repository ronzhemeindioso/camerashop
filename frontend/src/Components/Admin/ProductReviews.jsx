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
        { key: 'user', label: 'User', sortable: true, render: (r) => <span className="adm-strong">{r.user}</span> },
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
            <AdminLayout title="Reviews" subtitle="Look up a product by its ID to manage its reviews">
                <div className="adm-card">
                    <div className="adm-card-head">
                        <h2>Find reviews</h2>
                        <div className="adm-toolbar">
                            <input
                                type="text"
                                id="productId_field"
                                className="adm-input"
                                style={{ width: 320 }}
                                placeholder="Paste a product ID to load its reviews"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {listReviews && listReviews.length > 0 ? (
                    <DataTable
                        title="Reviews"
                        columns={columns}
                        rows={listReviews}
                        rowKey={(r) => r._id}
                        searchText={(r) => `${r.user} ${r.comment}`}
                        searchPlaceholder="Search reviews..."
                    />
                ) : (
                    <div className="adm-card"><div className="adm-card-body adm-empty">No reviews.</div></div>
                )}
            </AdminLayout>
        </>
    )
}

export default ProductReviews