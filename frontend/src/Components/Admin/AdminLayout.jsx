import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { logout } from '../../actions/userActions'
import './admin.css'

const links = [
    { to: '/dashboard', label: 'Home', match: (p) => p === '/dashboard' },
    { to: '/admin/users', label: 'Users', match: (p) => p.startsWith('/admin/user') },
    { to: '/admin/orders', label: 'Orders', match: (p) => p.startsWith('/admin/order') },
    { to: '/admin/products', label: 'Products', match: (p) => p.startsWith('/admin/product') },
    { to: '/admin/reviews', label: 'Reviews', match: (p) => p.startsWith('/admin/reviews') },
]

const AdminLayout = ({ title, subtitle, actions, children }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { pathname } = useLocation()

    // Lets the admin theme set the page background and hide the store footer
    useEffect(() => {
        document.body.classList.add('admin-mode')
        return () => document.body.classList.remove('admin-mode')
    }, [])

    const logoutHandler = async () => {
        await dispatch(logout())
        toast.success('Logged out', { position: 'bottom-right' })
        navigate('/')
    }

    return (
        <div className="admin-page">
            <header className="adm-topbar">
                <div className="adm-topbar-inner">
                    <Link to="/dashboard" className="adm-brand">
                        <span className="adm-brand-icon"><i className="fa fa-shopping-bag" aria-hidden="true"></i></span>
                        Store Admin
                    </Link>

                    <nav className="adm-nav">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={link.match(pathname) ? 'active' : ''}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link to="/">Storefront</Link>
                        <button type="button" className="adm-logout" onClick={logoutHandler}>Logout</button>
                    </nav>
                </div>
            </header>

            <main className="adm-container">
                {(title || actions) && (
                    <div className="adm-page-head">
                        <div>
                            {title && <h1>{title}</h1>}
                            {subtitle && <p>{subtitle}</p>}
                        </div>
                        {actions && <div className="adm-toolbar">{actions}</div>}
                    </div>
                )}
                {children}
            </main>
        </div>
    )
}

export default AdminLayout
