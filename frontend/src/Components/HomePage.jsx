import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import MetaData from './Layout/MetaData'

const HomePage = () => {
    const { hash } = useLocation()

    // Scroll to the section named in the URL (#about, #contact), or to the top
    useEffect(() => {
        if (hash) {
            const el = document.getElementById(hash.slice(1))
            if (el) el.scrollIntoView({ behavior: 'smooth' })
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [hash])

    return (
        <>
            <MetaData title={'Home'} />

            <section id="home" className="page-section hero">
                <h1>Quality Products, Delivered Reliably</h1>
                <p>Discover our latest range at fair prices, with secure checkout and dependable service.</p>
                <Link to="/shop" className="hero-btn">Shop Now</Link>
            </section>

            <section id="about" className="page-section section-block">
                <h2>About Us</h2>
                <p>
                    ShopIT is an online store committed to offering quality products at fair prices,
                    with a simple and dependable shopping experience from browsing to delivery.
                </p>
                <p>
                    Our team works to keep our catalogue current, our checkout secure, and our
                    customer support responsive.
                </p>
            </section>

            <section id="contact" className="page-section section-block section-alt">
                <h2>Contact Us</h2>
                <p>For questions about orders, products, or your account, please reach out to us.</p>
                <ul className="contact-list">
                    <li><strong>Email:</strong> support@shopit.com</li>
                    <li><strong>Phone:</strong> +63 900 000 0000</li>
                    <li><strong>Hours:</strong> Monday to Friday, 9:00 AM – 6:00 PM</li>
                </ul>
            </section>
        </>
    )
}

export default HomePage