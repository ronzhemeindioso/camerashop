import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import MetaData from './Layout/MetaData'
import Product from './Product/Product'
import Loader from './Layout/Loader'
import Slider from '@mui/material/Slider'
import Pagination from '@mui/material/Pagination'
import { useDispatch, useSelector } from 'react-redux'

import { getProducts, loadMoreProducts, setProductFilters, resetProductFilters } from '../actions/productActions'
import { PRODUCT_CATEGORIES } from '../validation/schemas'

const PURPLE = '#7e3d84'

const Home = () => {
    const { loading, loadingMore, products, resPerPage, filteredProductsCount } = useSelector(state => state.products);
    // rating + review-count filters live in the Redux store
    const { minRating, minReviews, category } = useSelector(state => state.productFilters);
    // `price` is what we fetch with; `priceDraft` follows the slider while it is being dragged
    const [price, setPrice] = useState([1, 1000]);
    const [priceDraft, setPriceDraft] = useState([1, 1000]);
    const [currentPage, setCurrentPage] = useState(1)
    // how the product list is paged: 'scroll' = infinite scroll, 'pages' = numbered pagination
    const [viewMode, setViewMode] = useState('scroll')
    const sentinelRef = useRef(null)
    let { keyword } = useParams();
    const dispatch = useDispatch();

    // a new search starts again from page 1
    const [prevKeyword, setPrevKeyword] = useState(keyword)
    if (keyword !== prevKeyword) {
        setPrevKeyword(keyword)
        setCurrentPage(1)
    }

    // Total products matching the current search and price filter
    const count = filteredProductsCount

    const filters = { minRating, minReviews }

    useEffect(() => {
        if (viewMode === 'scroll' && currentPage > 1) {
            // infinite scroll: add the next page to the list
            dispatch(loadMoreProducts(currentPage, keyword, price, category, filters))
        } else {
            dispatch(getProducts(currentPage, keyword, price, category, filters))
        }
    }, [currentPage, keyword, price, minRating, minReviews, category, viewMode]);

    // infinite scroll: when the marker at the bottom of the list comes into view, load the next page
    const hasMore = products.length < count
    useEffect(() => {
        if (viewMode !== 'scroll' || loading || loadingMore || !hasMore) return
        const el = sentinelRef.current
        if (!el) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) setCurrentPage(p => p + 1)
        }, { rootMargin: '300px' })
        observer.observe(el)
        return () => observer.disconnect()
    }, [viewMode, loading, loadingMore, hasMore, products.length]);

    const applyPrice = (event, value) => {
        setCurrentPage(1)
        setPrice(value)
    }

    const resetPrice = () => {
        setCurrentPage(1)
        setPriceDraft([1, 1000])
        setPrice([1, 1000])
    }

    const priceIsFiltered = price[0] !== 1 || price[1] !== 1000

    const applyRating = (value) => {
        setCurrentPage(1)
        dispatch(setProductFilters({ minRating: minRating === value ? 0 : value }))
    }

    const applyMinReviews = (value) => {
        setCurrentPage(1)
        dispatch(setProductFilters({ minReviews: Number(value) }))
    }

    const applyCategory = (value) => {
        setCurrentPage(1)
        dispatch(setProductFilters({ category: value }))
    }

    const changeViewMode = (mode) => {
        setCurrentPage(1)
        setViewMode(mode)
    }

    const clearAllFilters = () => {
        setCurrentPage(1)
        setPriceDraft([1, 1000])
        setPrice([1, 1000])
        dispatch(resetProductFilters())
    }

    const anyFilter = priceIsFiltered || minRating > 0 || minReviews > 0 || category !== ''

    return (
        <>
            <MetaData title={'shop Here'} />

            {!keyword && (
                <section className="store-hero">
                    <div className="store-hero-inner">
                        <div className="store-hero-copy">
                            <h1>Camera gear for every shot</h1>
                            <p>Cameras, lenses, lighting and accessories, with secure checkout and order tracking.</p>
                            <a href="#products" className="store-hero-btn">Shop latest products</a>
                        </div>
                        <div className="store-hero-lens" aria-hidden="true">
                            <span></span>
                        </div>
                    </div>
                </section>
            )}

            <div className="store-layout" id="products">
                <aside className="store-sidebar">
                    <div className="filter-card">
                        <h2>Category</h2>
                        <select
                            className="form-control"
                            value={category}
                            onChange={(e) => applyCategory(e.target.value)}
                            aria-label="Category"
                        >
                            <option value="">All categories</option>
                            {PRODUCT_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-card">
                        <h2>Price</h2>
                        <Slider
                            getAriaLabel={() => 'Price filter'}
                            value={priceDraft}
                            onChange={(e, v) => setPriceDraft(v)}
                            onChangeCommitted={applyPrice}
                            valueLabelDisplay="auto"
                            getAriaValueText={(v) => `$${v}`}
                            min={1}
                            max={1000}
                            sx={{ color: PURPLE, mt: 1 }}
                        />
                        <div className="filter-range">
                            <span>${priceDraft[0]}</span>
                            <span>${priceDraft[1]}</span>
                        </div>
                        {priceIsFiltered && (
                            <button type="button" className="filter-clear" onClick={resetPrice}>Clear price filter</button>
                        )}
                    </div>

                    <div className="filter-card">
                        <h2>Rating</h2>
                        {[4, 3, 2, 1].map(stars => (
                            <label key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                                <input
                                    type="radio"
                                    name="ratingFilter"
                                    checked={minRating === stars}
                                    onChange={() => applyRating(stars)}
                                    onClick={() => { if (minRating === stars) applyRating(stars) }}
                                />
                                <span aria-label={`${stars} stars and up`}>
                                    {'★'.repeat(stars)}<span style={{ color: '#ccc' }}>{'★'.repeat(5 - stars)}</span> &amp; up
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="filter-card">
                        <h2>Reviews</h2>
                        <select
                            className="form-control"
                            value={minReviews}
                            onChange={(e) => applyMinReviews(e.target.value)}
                            aria-label="Minimum number of reviews"
                        >
                            <option value={0}>Any number of reviews</option>
                            <option value={1}>1+ reviews</option>
                            <option value={5}>5+ reviews</option>
                            <option value={10}>10+ reviews</option>
                        </select>
                    </div>

                    {anyFilter && (
                        <button type="button" className="filter-clear" onClick={clearAllFilters}>Clear all filters</button>
                    )}
                </aside>

                <section className="store-results">
                    <div className="store-toolbar">
                        <h1 id="products_heading">{keyword ? `Results for "${keyword}"` : 'Latest Products'}</h1>
                        {!loading && <span className="store-count">{count} {count === 1 ? 'product' : 'products'}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 8, margin: '0 0 16px' }}>
                        {[['scroll', 'Infinite scroll'], ['pages', 'Pages']].map(([mode, label]) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => changeViewMode(mode)}
                                style={{
                                    padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 14,
                                    border: `1px solid ${PURPLE}`,
                                    background: viewMode === mode ? PURPLE : '#fff',
                                    color: viewMode === mode ? '#fff' : PURPLE,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="store-loading"><Loader /></div>
                    ) : products.length === 0 ? (
                        <div className="store-empty">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <h2>No products found</h2>
                            <p>Try a different search or loosen the filters.</p>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {products.map(product => (
                                <Product key={product._id} product={product} />
                            ))}
                        </div>
                    )}

                    {viewMode === 'scroll' && !loading && products.length > 0 && (
                        <div ref={sentinelRef} style={{ textAlign: 'center', padding: '24px 0', color: '#7e3d84' }}>
                            {loadingMore ? 'Loading more products...' : hasMore ? '' : "You've reached the end"}
                        </div>
                    )}

                    {viewMode === 'pages' && !loading && resPerPage < count && (
                        <div className="store-pagination">
                            <Pagination
                                count={Math.ceil(count / resPerPage)}
                                page={currentPage}
                                onChange={(event, value) => setCurrentPage(value)}
                                variant="outlined"
                                shape="rounded"
                                showFirstButton
                                showLastButton
                                size="large"
                                sx={{
                                    '& .MuiPaginationItem-root': { color: '#5a2a61', borderColor: '#e6d8ef', backgroundColor: '#fff' },
                                    '& .MuiPaginationItem-root.Mui-selected': { backgroundColor: PURPLE, color: '#fff', borderColor: PURPLE },
                                    '& .MuiPaginationItem-root.Mui-selected:hover': { backgroundColor: '#652f6b' },
                                }}
                            />
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}

export default Home