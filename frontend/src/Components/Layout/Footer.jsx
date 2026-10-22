import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Footer = () => {
    const { isAuthenticated } = useSelector(state => state.auth)

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-brand-simple">
                    <strong>Aperture</strong>
                    <span>Camera gear, made simple.</span>
                </div>

                <nav className="footer-links" aria-label="Footer">
                    <Link to="/shop">Shop</Link>
                    {isAuthenticated
                        ? <Link to="/orders/me">Your orders</Link>
                        : <Link to="/login">Log in</Link>}
                    <Link to="/#about">About</Link>
                    <Link to="/#contact">Contact</Link>
                </nav>
            </div>

            <div className="footer-bottom">
                <span>&copy; {new Date().getFullYear()} Aperture. All rights reserved.</span>
                <a href="mailto:support@aperture.com">support@aperture.com</a>
            </div>
        </footer>
    )
}

export default Footer
