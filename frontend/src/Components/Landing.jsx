import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProducts } from '../actions/productActions'
import { PRODUCT_CATEGORIES } from '../validation/schemas'
import Product from './Product/Product'
import Loader from './Layout/Loader'
import MetaData from './Layout/MetaData'

// "What are you shooting?" - each idea links to a shop category.
// To use your own pictures, put them in frontend/public/images and change the image names below.
const SHOOTING = [
    { title: 'Portraits', text: 'Sharp lenses and a flattering look.', image: '/images/lens.svg', category: 'Lenses' },
    { title: 'Low light', text: 'Light up the scene your way.', image: '/images/light.svg', category: 'Lighting' },
    { title: 'On the road', text: 'Bags that carry the whole kit.', image: '/images/bag.svg', category: 'Bags & Cases' },
    { title: 'All-day shoots', text: 'Power and storage that last.', image: '/images/battery.svg', category: 'Batteries & Chargers' },
]

// the four steps of an order
const STEPS = [
    { title: 'Browse', text: 'Search the shop or filter by category, price and rating.' },
    { title: 'Order', text: 'Check out securely in a few steps.' },
    { title: 'Track', text: 'Get an email with a PDF receipt as your order status changes.' },
    { title: 'Review', text: 'Once it arrives, rate what you bought.' },
]

const Landing = () => {
    const dispatch = useDispatch()
    const { loading, products } = useSelector(state => state.products)

    // load the newest products (used for the photo collage and "Latest arrivals")
    useEffect(() => {
        dispatch(getProducts(1, '', [1, 1000], '', {}))
    }, [dispatch])

    const latest = (products || []).slice(0, 4)

    // products that have a picture, for the hero collage
    const shots = (products || []).filter(p => p.images && p.images[0]).slice(0, 3)

    // the word band scrolls, so the list is written twice for a seamless loop
    const words = [...PRODUCT_CATEGORIES, ...PRODUCT_CATEGORIES]

    return (
        <>
            <MetaData title={'Home'} />

            {/* ---------- hero ---------- */}
            <section className="sf-full sf-hero">
                <div className="sf-hero-inner">
                    <div className="sf-hero-copy">
                        <span className="sf-tag">Cameras &amp; accessories</span>
                        <h1>Gear up for your next <span className="hl">great shot.</span></h1>
                        <p>Cameras, lenses, lighting and accessories, with secure checkout and order tracking.</p>
                        <div className="sf-hero-actions">
                            <Link to="/shop" className="sf-btn">Shop gear</Link>
                            <Link to="/about" className="sf-btn ghost">Our story</Link>
                        </div>
                    </div>

                    {shots.length >= 2 ? (
                        <div className="sf-collage">
                            {shots.map((p, i) => (
                                <Link key={p._id} to={`/product/${p._id}`} className={`sf-print p${i + 1}`}>
                                    <img src={p.images[0].url} alt={p.name} />
                                </Link>
                            ))}
                            <span className="sf-chip c1"><i className="fa fa-star"></i>Honest reviews</span>
                            <span className="sf-chip c2"><i className="fa fa-truck"></i>Order tracking</span>
                            <img className="sf-sticker" src="/images/camera.svg" alt="" />
                        </div>
                    ) : (
                        <img className="sf-hero-art" src="/images/camera.svg" alt="Camera" />
                    )}
                </div>
            </section>

            {/* ---------- scrolling word band ---------- */}
            <div className="sf-full sf-marquee" aria-hidden="true">
                <div className="sf-marquee-track">
                    {words.map((w, i) => <span key={i}>{w}</span>)}
                </div>
            </div>

            {/* ---------- what are you shooting ---------- */}
            <section className="sf-full sf-section">
                <div className="sf-container">
                    <div className="sf-section-head">
                        <div>
                            <span className="sf-tag">Shop by passion</span>
                            <h2>What are you shooting?</h2>
                        </div>
                        <Link to="/shop" className="sf-link">Browse everything &rarr;</Link>
                    </div>

                    <div className="sf-shoot-grid">
                        {SHOOTING.map((item, i) => (
                            <Link key={item.title} to={`/shop?category=${encodeURIComponent(item.category)}`} className={`sf-shoot t${i + 1}`}>
                                <span className="num">0{i + 1}</span>
                                <img src={item.image} alt="" />
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                                <span className="go">Shop {item.category.toLowerCase()} &rarr;</span>
                            </Link>
                        ))}
                    </div>

                    <div className="sf-pills">
                        {PRODUCT_CATEGORIES.map(c => (
                            <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="sf-pill">{c}</Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- latest products ---------- */}
            <section className="sf-full sf-section alt">
                <div className="sf-container">
                    <div className="sf-section-head">
                        <div>
                            <span className="sf-tag">New in</span>
                            <h2>Latest arrivals</h2>
                        </div>
                        <Link to="/shop" className="sf-link">View all products &rarr;</Link>
                    </div>

                    {loading ? (
                        <div className="store-loading"><Loader /></div>
                    ) : latest.length === 0 ? (
                        <p>No products yet. Check back soon.</p>
                    ) : (
                        <div className="product-grid">
                            {latest.map(product => <Product key={product._id} product={product} />)}
                        </div>
                    )}
                </div>
            </section>

            {/* ---------- how an order works ---------- */}
            <section className="sf-full sf-section">
                <div className="sf-container">
                    <div className="sf-section-head">
                        <div>
                            <span className="sf-tag">How it works</span>
                            <h2>Your order, step by step</h2>
                        </div>
                    </div>
                    <div className="sf-frames">
                        {STEPS.map((s, i) => (
                            <div className="sf-frame" key={s.title}>
                                <div className="num">{i + 1}</div>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- call to action ---------- */}
            <section className="sf-full sf-section" style={{ paddingTop: 0 }}>
                <div className="sf-container">
                    <div className="sf-cta-card">
                        <h2>Your next great shot starts here.</h2>
                        <p>Browse the full catalogue and check out in minutes.</p>
                        <Link to="/shop" className="sf-btn white">Start shopping</Link>
                        <img className="sf-cta-img" src="/images/lens.svg" alt="" />
                    </div>
                </div>
            </section>
        </>
    )
}

export default Landing
