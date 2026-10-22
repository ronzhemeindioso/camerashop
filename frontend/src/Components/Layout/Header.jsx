import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'
import Search from './Search'

const navLinks = [
    { to: '/', hash: '', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/#about', hash: '#about', label: 'About' },
    { to: '/#contact', hash: '#contact', label: 'Contact' },
]

const ANNOUNCE_KEY = 'announceDismissed'

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname, hash } = useLocation();
    const { user } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)
    const [open, setOpen] = useState(false)

    // Account menu is controlled by React (no Bootstrap/jQuery dropdown), so nothing
    // outside React touches this part of the DOM and it can't go stale after logout
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => { setMenuOpen(false) }, [pathname])

    useEffect(() => {
        if (!menuOpen) return
        const onOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
        }
        document.addEventListener('pointerdown', onOutside)
        return () => document.removeEventListener('pointerdown', onOutside)
    }, [menuOpen])

    // the top announcement stays until the visitor closes it, then it never shows again on this browser
    const [showAnnounce, setShowAnnounce] = useState(() => {
        try { return localStorage.getItem(ANNOUNCE_KEY) !== '1' } catch (e) { return true }
    })
    const dismissAnnounce = () => {
        setShowAnnounce(false)
        try { localStorage.setItem(ANNOUNCE_KEY, '1') } catch (e) { /* storage blocked: it just comes back next visit */ }
    }

    const closeMenu = () => setOpen(false)

    // Admin pages use their own top bar
    if (pathname.startsWith('/admin') || pathname === '/dashboard') return null

    const isActive = (link) =>
        link.to === '/shop'
            ? pathname === '/shop'
            : pathname === '/' && hash === link.hash

    // highlight the account menu while the user is on one of their account pages
    const onAccountPage = pathname === '/me' || pathname.startsWith('/me/')
        || pathname.startsWith('/orders/') || pathname.startsWith('/order/')
        || pathname === '/password/update'

    const logoutHandler = async () => {
        closeMenu();
        setMenuOpen(false);
        // wait until the session is cleared, then go to the login page
        await dispatch(logout());
        toast.success('log out', {
            position: 'bottom-right'
        });
        navigate('/login');
    }

    return (
        <>
        {showAnnounce && (
            <div className="announce-bar">
                <span>Secure checkout on every order</span>
                <button type="button" className="announce-close" aria-label="Dismiss announcement" onClick={dismissAnnounce}>
                    <i className="fa fa-times" aria-hidden="true"></i>
                </button>
            </div>
        )}
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

                    <Search />

                    <div className="nav-actions">
                        {user ? (
                            <div className="dropdown" key="user-menu" ref={menuRef}>
                                <a href="#!" className={`user-toggle dropdown-toggle ${onAccountPage ? 'active' : ''}`} id="dropDownMenuButton" aria-haspopup="true" aria-expanded={menuOpen}
                                    onClick={(e) => { e.preventDefault(); setMenuOpen(o => !o) }}>
                                    <figure className="avatar avatar-nav">
                                        <img
                                            src={user.avatar && user.avatar.url}
                                            alt={user.name}
                                            className="rounded-circle"
                                        />
                                    </figure>
                                    <span className="user-name">{user.name}</span>
                                </a>

                                <div className={`dropdown-menu dropdown-menu-right ${menuOpen ? 'show' : ''}`} aria-labelledby="dropDownMenuButton">
                                    {user.role === 'admin' && (
                                        <Link className="dropdown-item" to="/dashboard">
                                            <i className="fa fa-tachometer" aria-hidden="true"></i>Dashboard
                                        </Link>
                                    )}
                                    <Link className="dropdown-item" to="/me">
                                        <i className="fa fa-user" aria-hidden="true"></i>My profile
                                    </Link>
                                    <Link className="dropdown-item" to="/orders/me">
                                        <i className="fa fa-shopping-bag" aria-hidden="true"></i>My orders
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button type="button" className="dropdown-item text-danger" onClick={logoutHandler}>
                                        <i className="fa fa-sign-out" aria-hidden="true"></i>Sign out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="auth-links" key="auth-links">
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
        </>
    )
}

export default Header