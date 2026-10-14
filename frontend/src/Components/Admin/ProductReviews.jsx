import React, { useState, useEffect } from 'react'


import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
// import Toast from '../Layout/Toast'
import Swal from 'sweetalert2'
import { getUser, getToken, errMsg } from '../../Utils/helpers'
import axios from 'axios'

const ProductReviews = () => {
    const [productId, setProductId] = useState('')
    const [error, setError] = useState('')
    const [listReviews, setListReviews] = useState([])
    const [deleteError, setDeleteError] = useState('')
    const [isDeleted, setIsDeleted] = useState(false)
    const [user, setUser] = useState(getUser())

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
            setError(error.response.data.message)
        }
    }
    const deleteReview = async (id, productId) => {
        try {
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/reviews?id=${id}&productId=${productId}`, config)
            setIsDeleted(data.success)

        } catch (error) {
            setDeleteError(error.response.data.message);
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
                deleteReview(id, productId)
            }
        })

    }
    useEffect(() => {
        if (error) {
            setError('')
        }

        if (deleteError) {
            setDeleteError('')
        }
        if (productId !== '') {
            getProductReviews(productId)
        }

        if (isDeleted) {
            errMsg('Review deleted successfully', 'success');
            setIsDeleted(false)
        }
    }, [error, productId, isDeleted, deleteError])

    const submitHandler = (e) => {
        e.preventDefault();
        getProductReviews(productId)
    }

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
                        <form className="adm-toolbar" onSubmit={submitHandler}>
                            <input
                                type="text"
                                id="productId_field"
                                className="adm-input"
                                style={{ width: 320 }}
                                placeholder="Enter product ID"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                            <button id="search_button" type="submit" className="adm-btn adm-btn-primary">Search</button>
                        </form>
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