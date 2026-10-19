import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { money, LOW_STOCK_LIMIT } from './adminHelpers'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import {
    getAdminProducts,
    deleteProduct,
    bulkDeleteProducts,
    clearErrors,
} from '../../actions/productActions'
import { DELETE_PRODUCT_RESET } from '../../constants/productConstants'

const stockPill = (stock) => {
    if (stock <= 0) return <span className="adm-pill red dot">Out of stock</span>
    if (stock <= LOW_STOCK_LIMIT) return <span className="adm-pill amber dot">{stock} left</span>
    return <span className="adm-pill green dot">{stock} in stock</span>
}

const ProductsList = () => {
    const dispatch = useDispatch();
    const { loading, error, products } = useSelector(state => state.products)
    const { error: deleteError, isDeleted } = useSelector(state => state.product)

    const [category, setCategory] = useState('')
    const [stockFilter, setStockFilter] = useState('')
    const [selected, setSelected] = useState([])   // ids ticked in the checkbox column

    useEffect(() => {
        dispatch(getAdminProducts())

        if (error) {
            toast.error(error, { position: 'bottom-right' });
            dispatch(clearErrors())
        }

        if (deleteError) {
            toast.error(deleteError, { position: 'bottom-right' });
            dispatch(clearErrors())
        }

        if (isDeleted) {
            toast.success('Product deleted successfully', { position: 'bottom-right' })
            setSelected([])
            dispatch({ type: DELETE_PRODUCT_RESET })
        }
    }, [error, deleteError, isDeleted,])

    const softDeleteHandler = (id, name) => {
        if (window.confirm(`Move "${name}" to trash? You can restore it later.`)) {
            dispatch(deleteProduct(id))
        }
    }

    const bulkDeleteHandler = () => {
        if (selectedInView.length === 0) return
        if (window.confirm(`Move ${selectedInView.length} selected product(s) to trash? You can restore them later.`)) {
            dispatch(bulkDeleteProducts(selectedInView))
        }
    }

    const list = products || []
    const categories = useMemo(() => [...new Set(list.map(p => p.category).filter(Boolean))].sort(), [list])
    const totalUnits = list.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
    const lowStock = list.filter(p => p.stock <= LOW_STOCK_LIMIT).length

    const rows = list.filter(p => {
        if (category && p.category !== category) return false
        if (stockFilter === 'in' && !(p.stock > LOW_STOCK_LIMIT)) return false
        if (stockFilter === 'low' && !(p.stock > 0 && p.stock <= LOW_STOCK_LIMIT)) return false
        if (stockFilter === 'out' && p.stock > 0) return false
        return true
    })

    // Only act on ticked rows that are still shown (a filter may have hidden some)
    const shownIds = new Set(rows.map(p => p._id))
    const selectedInView = selected.filter(id => shownIds.has(id))

    const columns = [
        { key: 'name', label: 'Product', sortable: true, render: (p) => <span className="adm-strong">{p.name}</span> },
        { key: 'costPrice', label: 'Cost Price', sortable: true, render: (p) => <span className="adm-price">{money(p.costPrice ?? 0)}</span> },
        { key: 'price', label: 'Sell Price', sortable: true, render: (p) => <span className="adm-price">{money(p.price)}</span> },
        { key: 'stock', label: 'Stock', sortable: true, render: (p) => stockPill(p.stock) },
        { key: 'category', label: 'Category', render: (p) => <span className="adm-pill tag">{p.category}</span> },
        {
            key: 'images', label: 'Images',
            render: (p) => {
                const imgs = p.images || []
                return (
                    <div className="adm-imgs">
                        {imgs.slice(0, 3).map(img => <img key={img.public_id || img.url} src={img.url} alt={p.name} />)}
                        {imgs.length > 3 && <span className="more">+{imgs.length - 3}</span>}
                    </div>
                )
            }
        },
        {
            key: 'actions', label: '',
            render: (p) => (
                <div className="adm-actions">
                    <Link to={`/admin/product/${p._id}`} className="adm-icon-btn" title="Edit">
                        <i className="fa fa-pencil"></i>
                    </Link>
                    <button
                        className="adm-icon-btn danger"
                        title="Delete"
                        onClick={() => softDeleteHandler(p._id, p.name)}
                    >
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'All Products'} />
            <AdminLayout
                title="Products"
                subtitle={<><b>{list.length}</b> total, proceed to manage them</>}
                actions={
                    <Link to="/admin/products/trash" className="adm-btn">
                        View deleted
                    </Link>
                }
            >
                {loading ? <Loader /> : (
                    <>
                        <div className="adm-stats">
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-cube"></i></div>
                                <div><div className="adm-stat-value">{list.length}</div><div className="adm-stat-label">Products</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-shopping-bag"></i></div>
                                <div><div className="adm-stat-value">{totalUnits}</div><div className="adm-stat-label">Units in stock</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-tag"></i></div>
                                <div><div className="adm-stat-value">{categories.length}</div><div className="adm-stat-label">Categories</div></div>
                            </div>
                            <div className="adm-stat adm-stat-warn">
                                <div className="adm-stat-icon"><i className="fa fa-exclamation-triangle"></i></div>
                                <div><div className="adm-stat-value">{lowStock}</div><div className="adm-stat-label">Low stock</div></div>
                            </div>
                        </div>

                        <DataTable
                            title="All products"
                            columns={columns}
                            rows={rows}
                            rowKey={(p) => p._id}
                            searchText={(p) => `${p.name} ${p.description || ''} ${p.category || ''}`}
                            searchPlaceholder="Search products..."
                            emptyText="No products found."
                            filters={
                                <>
                                    <select className="adm-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="">All categories</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select className="adm-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                                        <option value="">All stock</option>
                                        <option value="in">In stock</option>
                                        <option value="low">Low stock</option>
                                        <option value="out">Out of stock</option>
                                    </select>
                                </>
                            }
                            selectable
                            selectedIds={selectedInView}
                            onSelectionChange={setSelected}
                            actions={
                                <div className="adm-head-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {selectedInView.length > 0 && (
                                        <button
                                            type="button"
                                            className="adm-btn"
                                            style={{ background: '#d32f2f', borderColor: '#d32f2f', color: '#fff', fontWeight: 600 }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#b71c1c' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#d32f2f' }}
                                            onClick={bulkDeleteHandler}
                                        >
                                            <i className="fa fa-trash"></i> Delete selected ({selectedInView.length})
                                        </button>
                                    )}
                                    <Link to="/admin/product" className="adm-btn adm-btn-primary">+ Add product</Link>
                                </div>
                            }
                        />
                    </>
                )}
            </AdminLayout>
        </>
    )
}

export default ProductsList
