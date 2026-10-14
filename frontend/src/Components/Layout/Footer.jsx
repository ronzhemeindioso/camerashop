import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <span className="brand-icon"><i className="fa fa-camera" aria-hidden="true"></i></span>
                    <div>
                        <strong>Aperture</strong>
                        <p>Camera gear, lenses and accessories with a simple, dependable checkout.</p>
                    </div>
                </div>

                <div>
                    <h6>Shop</h6>
                    <ul>
                        <li><Link to="/shop">All products</Link></li>
                        <li><Link to="/cart">Your cart</Link></li>
                    </ul>
                </div>

                <div>
                    <h6>Account</h6>
                    <ul>
                        <li><Link to="/login">Log in</Link></li>
                        <li><Link to="/orders/me">Your orders</Link></li>
                        <li><Link to="/me">Profile</Link></li>
                    </ul>
                </div>

                <div>
                    <h6>Help</h6>
                    <ul>
                        <li><Link to="/#about">About us</Link></li>
                        <li><Link to="/#contact">Contact us</Link></li>
                        <li>support@aperture.com</li>
                    </ul>
                </div>
            </div>

            <p className="footer-copy">&copy; {new Date().getFullYear()} Aperture. All rights reserved.</p>
        </footer>
    )
}

export default Footer