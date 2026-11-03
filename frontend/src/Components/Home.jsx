import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import MetaData from './Layout/MetaData'
import Product from './Product/Product'
import Loader from './Layout/Loader'
import Slider from '@mui/material/Slider'
import Pagination from '@mui/material/Pagination'
import { useDispatch, useSelector } from 'react-redux'

import { getProducts, loadMoreProducts, setProductFilters, resetProductFilters } from '../actions/productActions'
import { PRODUCT_CATEGORIES } from '../validation/schemas'
import PageBanner from './PageBanner'

const PURPLE = '#7e3d84'

const Home = () => {
    const { loading, loadingMore, products, resPerPage, filteredProductsCount } = useSelector(state => state.products);
    // rating + review-count filters live in the Redux store
    const { minRating, minReviews, category } = useSelector(state => state.productFilters);
    // `price` is what we fetch with; `priceDraft` follows the slider while it is being dragged
    const [price, setPrice] = useState([1, 100000]);
    const [priceDraft, setPriceDraft] = useState([1, 100000]);
    const [currentPage, setCurrentPage] = useState(1)
    // how the product list is paged: 'scroll' = infinite scroll, 'pages' = numbered pagination
    const [viewMode, setViewMode] = useState('scroll')
    const sentinelRef = useRef(null)
    let { keyword } = useParams();
    const [searchParams] = useSearchParams();
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

    // arriving from a category tile on the home page (/shop?category=Lenses)
    const categoryFromUrl = searchParams.get('category')
    useEffect(() => {
        if (categoryFromUrl && PRODUCT_CATEGORIES.includes(categoryFromUrl)) {
            dispatch(setProductFilters({ category: categoryFromUrl }))
        }
    }, [categoryFromUrl, dispatch]);

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
        setPriceDraft([1, 100000])
        setPrice([1, 100000])
    }

    const priceIsFiltered = price[0] !== 1 || price[1] !== 100000

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
        setPriceDraft([1, 100000])
        setPrice([1, 100000])
        dispatch(resetProductFilters())
    }

    const anyFilter = priceIsFiltered || minRating > 0 || minReviews > 0 || category !== ''

    // one small tag for each filter that is switched on
    const chips = []
    if (category) chips.push({ label: category, remove: () => applyCategory('') })
    if (priceIsFiltered) chips.push({ label: `$${price[0]} - $${price[1]}`, remove: resetPrice })
    if (minRating > 0) chips.push({ label: `${minRating}+ stars`, remove: () => applyRating(minRating) })
    if (minReviews > 0) chips.push({ label: `${minReviews}+ reviews`, remove: () => applyMinReviews(0) })

    return (
        <>
            <MetaData title={'shop Here'} />

            <PageBanner
                crumb={keyword ? 'Search' : 'Shop'}
                title={keyword ? `Results for "${keyword}"` : category ? category : 'Shop all products'}
                text={keyword ? 'Products matching your search.' : 'Filter by category, price, rating and reviews.'}
            />

            <div className="store-layout" id="products">
                <aside className="store-sidebar">
                    <div className="shop-filters">
                        <div className="shop-filters-head">
                            <h2>Filters</h2>
                            {anyFilter && <button type="button" onClick={clearAllFilters}>Clear all</button>}
                        </div>

                        {/* each section opens and closes when you click its title */}
                        <details className="shop-filter" open>
                            <summary>Category</summary>
                            <ul className="shop-list">
                                <li><button type="button" className={category === '' ? 'on' : ''} onClick={() => applyCategory('')}>All categories</button></li>
                                {PRODUCT_CATEGORIES.map(c => (
                                    <li key={c}>
                                        <button type="button" className={category === c ? 'on' : ''} onClick={() => applyCategory(c)}>{c}</button>
                                    </li>
                                ))}
                            </ul>
                        </details>

                        <details className="shop-filter" open>
                            <summary>Price</summary>
                            <Slider
                                getAriaLabel={() => 'Price filter'}
                                value={priceDraft}
                                onChange={(e, v) => setPriceDraft(v)}
                                onChangeCommitted={applyPrice}
                                valueLabelDisplay="auto"
                                getAriaValueText={(v) => `$${v}`}
                                min={1}
                                max={100000}
                                sx={{ color: PURPLE, mt: 1 }}
                            />
                            <div className="filter-range">
                                <span>${priceDraft[0]}</span>
                                <span>${priceDraft[1]}</span>
                            </div>
                        </details>

                        <details className="shop-filter" open>
                            <summary>Rating</summary>
                            <ul className="shop-list">
                                {[4, 3, 2, 1].map(stars => (
                                    <li key={stars}>
                                        <button type="button" className={minRating === stars ? 'on' : ''} onClick={() => applyRating(stars)} aria-label={`${stars} stars and up`}>
                                            <span className="stars-gold">{'★'.repeat(stars)}<span className="off">{'★'.repeat(5 - stars)}</span></span>
                                            <span>&amp; up</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </details>

                        <details className="shop-filter" open>
                            <summary>Reviews</summary>
                            <div className="shop-seg">
                                {[[0, 'Any'], [1, '1+'], [5, '5+'], [10, '10+']].map(([n, label]) => (
                                    <button key={n} type="button" className={minReviews === n ? 'on' : ''} onClick={() => applyMinReviews(n)}>{label}</button>
                                ))}
                            </div>
                        </details>
                    </div>
                </aside>

                <section className="store-results">
                    <div className="shop-bar">
                        <div>
                            <h2 className="shop-title">{keyword ? `Results for "${keyword}"` : category || 'All products'}</h2>
                            {!loading && <p className="shop-count">{count} {count === 1 ? 'product' : 'products'}</p>}
                        </div>
                        <div className="shop-view">
                            <span>View</span>
                            <div className="shop-seg">
                                <button type="button" className={viewMode === 'scroll' ? 'on' : ''} onClick={() => changeViewMode('scroll')}>Infinite scroll</button>
                                <button type="button" className={viewMode === 'pages' ? 'on' : ''} onClick={() => changeViewMode('pages')}>Pages</button>
                            </div>
                        </div>
                    </div>

                    {/* the filters that are switched on, click one to remove it */}
                    {chips.length > 0 && (
                        <div className="shop-chips">
                            {chips.map(chip => (
                                <button key={chip.label} type="button" className="shop-chip" onClick={chip.remove}>
                                    {chip.label} <b>&times;</b>
                                </button>
                            ))}
                        </div>
                    )}

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
                        <div ref={sentinelRef} className="shop-end">
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
                                    '& .MuiPaginationItem-root': { color: '#5a2a61', borderColor: '#e8dfd0', backgroundColor: '#fff', borderRadius: '2px' },
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