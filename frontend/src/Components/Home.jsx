import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import MetaData from './Layout/MetaData'
import Product from './Product/Product'
import Loader from './Layout/Loader'
import Slider from '@mui/material/Slider'
import Pagination from '@mui/material/Pagination'
import { useDispatch, useSelector } from 'react-redux'

import { getProducts, setProductFilters, resetProductFilters } from '../actions/productActions'

const PURPLE = '#7e3d84'

const Home = () => {
    const { loading, products, resPerPage, filteredProductsCount } = useSelector(state => state.products);
    // rating + review-count filters live in the Redux store
    const { minRating, minReviews } = useSelector(state => state.productFilters);
    // `price` is what we fetch with; `priceDraft` follows the slider while it is being dragged
    const [price, setPrice] = useState([1, 1000]);
    const [priceDraft, setPriceDraft] = useState([1, 1000]);
    const [currentPage, setCurrentPage] = useState(1)
    let { keyword } = useParams();
    const dispatch = useDispatch();

    // Total products matching the current search and price filter
    const count = filteredProductsCount

    useEffect(() => {
        dispatch(getProducts(currentPage, keyword, price, '', { minRating, minReviews }))
    }, [currentPage, keyword, price, minRating, minReviews]);

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

    const clearAllFilters = () => {
        setCurrentPage(1)
        setPriceDraft([1, 1000])
        setPrice([1, 1000])
        dispatch(resetProductFilters())
    }

    const anyFilter = priceIsFiltered || minRating > 0 || minReviews > 0

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

                    {!loading && resPerPage < count && (
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