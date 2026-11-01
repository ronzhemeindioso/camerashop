import React from 'react'
import { Link } from 'react-router-dom'
import MetaData from './Layout/MetaData'
import PageBanner from './PageBanner'

// Our three promises, named after the exposure triangle
const PROMISES = [
    { big: 'f/', title: 'Aperture: a clear view', text: 'Clear prices, clear order statuses and honest reviews, so you can see exactly what you are getting.' },
    { big: '1/s', title: 'Shutter: quick and smooth', text: 'A short checkout and an email update each time your order moves along.' },
    { big: 'ISO', title: 'ISO: we pick up the signal', text: 'Reviews and questions from customers help us keep the shop useful.' },
]

const About = () => (
    <>
        <MetaData title={'About Us'} />
        <PageBanner crumb="About" title="Behind the lens" text="An online camera shop built for a simple, dependable buying experience." />

        <section className="sf-full sf-section">
            <div className="sf-container">
                <div className="sf-split">
                    <div>
                        <span className="sf-tag">Our story</span>
                        <h2>Made for people who love taking pictures</h2>
                        <p>
                            Aperture is an online store for cameras, lenses, lighting and accessories.
                            We built it so that choosing gear, paying for it and following your order
                            all feel straightforward.
                        </p>
                        <p>
                            Every order has a visible status, and you get an email with an itemized
                            summary and a PDF receipt whenever it changes.
                        </p>
                        <Link to="/shop" className="sf-btn">Browse the shop</Link>
                    </div>

                    <div>
                    {/* swap scene.svg for your own photo, e.g. /images/shop.jpg (put it in frontend/public/images) */}
                    <img className="sf-photo" src="/images/scene.svg" alt="A photo of the shop" />
                    <div className="sf-panel">
                        <h3>Inside the shop</h3>
                        <ul>
                            <li><strong>Eight categories</strong>From cameras to batteries and chargers.</li>
                            <li><strong>Easy filtering</strong>By category, price, rating and review count.</li>
                            <li><strong>Order updates</strong>Items, subtotal and grand total by email.</li>
                            <li><strong>Real feedback</strong>Only customers who received a product can review it.</li>
                        </ul>
                    </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="sf-full sf-section alt">
            <div className="sf-container">
                <div className="sf-section-head">
                    <div>
                        <span className="sf-tag">What we promise</span>
                        <h2>Our exposure triangle</h2>
                    </div>
                </div>
                <div className="sf-triangle">
                    {PROMISES.map((p, i) => (
                        <div className={`sf-card c${i + 1}`} key={p.title}>
                            <div className="big">{p.big}</div>
                            <h3>{p.title}</h3>
                            <p>{p.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="sf-full sf-section">
            <div className="sf-container">
                <div className="sf-cta-card">
                    <h2>Questions? We're happy to help.</h2>
                    <p>Reach out about an order, a product or your account.</p>
                    <Link to="/contact" className="sf-btn white">Contact us</Link>
                    <img className="sf-cta-img" src="/images/camera.svg" alt="" />
                </div>
            </div>
        </section>
    </>
)

export default About
