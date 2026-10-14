import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'

const navLinks = [
    { to: '/', hash: '', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/#about', hash: '#about', label: 'About' },
    { to: '/#contact', hash: '#contact', label: 'Contact' },
]

const Header = () => {
    const dispatch = useDispatch();
    const { pathname, hash } = useLocation();
    const { user } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)
    const [open, setOpen] = useState(false)

    const closeMenu = () => setOpen(false)

    // Admin pages use their own top bar
    if (pathname.startsWith('/admin') || pathname === '/dashboard') return null

    const isActive = (link) =>
        link.to === '/shop'
            ? pathname === '/shop'
            : pathname === '/' && hash === link.hash

    const logoutHandler = () => {
        dispatch(logout());
        toast.success('log out', {
            position: 'bottom-right'
        });
    }

    return (
        <header className="site-header">
            <div className="site-nav">
                <Link to="/" className="brand" onClick={closeMenu}>
                    <span className="brand-icon"><i className="fa fa-camera" aria-hidden="true"></i></span>
                    Aperture
                </Link>

                <button
                    type="button"
                    className="nav-toggle"
                    aria-label="Toggle navigation"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    <i className={`fa ${open ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
                </button>

                <nav className={`nav-menu ${open ? 'open' : ''}`}>
                    <ul className="nav-links">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <Link
                                    to={link.to}
                                    className={isActive(link) ? 'active' : ''}
                                    onClick={closeMenu}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="nav-actions">
                        {user ? (
                            <div className="dropdown">
                                <Link to="#!" className="user-toggle dropdown-toggle" id="dropDownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <figure className="avatar avatar-nav">
                                        <img
                                            src={user.avatar && user.avatar.url}
                                            alt={user.name}
                                            className="rounded-circle"
                                        />
                                    </figure>
                                    <span className="user-name">{user.name}</span>
                                </Link>

                                <div className="dropdown-menu dropdown-menu-right" aria-labelledby="dropDownMenuButton">
                                    {user.role === 'admin' && (
                                        <Link className="dropdown-item" to="/dashboard">Dashboard</Link>
                                    )}
                                    <Link className="dropdown-item" to="/orders/me">Orders</Link>
                                    <Link className="dropdown-item" to="/me">Profile</Link>
                                    <Link className="dropdown-item text-danger" to="/" onClick={logoutHandler}>
                                        Logout
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="auth-links">
                                <Link to="/login" className="auth-login" id="login_btn" onClick={closeMenu}>Login</Link>
                                <Link to="/register" className="auth-signup" onClick={closeMenu}>Sign Up</Link>
                            </div>
                        )}

                        <Link to="/cart" className="cart-link" aria-label="Cart" onClick={closeMenu}>
                            <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                            <span id="cart_count">{cartItems ? cartItems.length : 0}</span>
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    )
}

export default Header