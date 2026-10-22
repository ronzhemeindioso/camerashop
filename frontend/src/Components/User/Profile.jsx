import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-toastify'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import { myOrders } from '../../actions/orderActions'
import { logout } from '../../actions/userActions'
import { LOAD_USER_SUCCESS } from '../../constants/userConstants'
import './Profile.css'

const CURRENCY = '₱'
const money = (n) => `${CURRENCY}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

// "juan dela cruz" -> "Juan Dela Cruz" (keeps text readable when users type in lowercase)
const titleCase = (s = '') => s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

const statusTone = (status = '') => {
    const s = status.toLowerCase()
    if (s.includes('deliver')) return 'ok'
    if (s.includes('ship')) return 'info'
    if (s.includes('cancel')) return 'bad'
    return 'warn'
}

// a read-only row: label on the left, value on the right
const Row = ({ label, children, empty, action }) => (
    <div className="pc-row">
        <dt>{label}</dt>
        <dd className={empty ? 'empty' : ''}>{empty ? 'Not set' : children}</dd>
        {action}
    </div>
)

const Profile = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user, loading } = useSelector(state => state.auth)
    const { orders = [], loading: ordersLoading } = useSelector(state => state.myOrders)

    const [editingPhone, setEditingPhone] = useState(false)
    const [phone, setPhone] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        document.body.classList.add('profile-mode')
        return () => document.body.classList.remove('profile-mode')
    }, [])

    useEffect(() => { dispatch(myOrders()) }, [dispatch])

    const stats = useMemo(() => {
        const list = Array.isArray(orders) ? orders : []
        const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const spent = list
            .filter(o => !String(o.orderStatus || '').toLowerCase().includes('cancel'))
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
        return { count: list.length, spent, last: sorted[0], recent: sorted.slice(0, 3) }
    }, [orders])

    if (loading || !user) return <Loader />

    const isAdmin = user.role === 'admin'
    const fmtDate = (d, opts) => (d ? new Date(d).toLocaleDateString(undefined, opts) : '')
    const memberSince = fmtDate(user.createdAt, { year: 'numeric', month: 'short' })

    const addressLines = [
        titleCase([user.address, user.barangay].filter(Boolean).join(', ')),
        [titleCase([user.city, user.province].filter(Boolean).join(', ')), user.postalCode].filter(Boolean).join(' '),
        user.country,
    ].filter(Boolean)

    // profile completeness
    const checks = [
        { label: 'Profile photo', done: !!user.avatar?.url },
        { label: 'Phone number', done: !!user.phoneNo },
        { label: 'Street address', done: !!user.address },
        { label: 'City', done: !!user.city },
        { label: 'Postal code', done: !!user.postalCode },
    ]
    const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100)
    const missing = checks.filter(c => !c.done).map(c => c.label)

    const startPhoneEdit = () => { setPhone(user.phoneNo || ''); setEditingPhone(true) }

    const savePhone = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_API}/me/update`,
                { phoneNo: phone.trim() },
                { withCredentials: true }
            )
            dispatch({ type: LOAD_USER_SUCCESS, payload: data.user })
            setEditingPhone(false)
            toast.success('Phone number updated')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not update phone number')
        } finally {
            setSaving(false)
        }
    }

    const signOut = async () => {
        await dispatch(logout())
        navigate('/login')
    }

    return (
        <>
            <MetaData title={'My Profile'} />

            <div className="profile-page">
                <div className="profile-wrap">

                    {/* ---------- header card ---------- */}
                    <div className="profile-block has-cover">
                        <div className="pc-cover" aria-hidden="true" />

                        <div className="profile-inner">
                            <div className="pc-top">
                                <div className="pc-avatar">
                                    {user.avatar?.url
                                        ? <img src={user.avatar.url} alt={user.name} />
                                        : <span className="pc-initial">{user.name?.charAt(0).toUpperCase()}</span>}
                                </div>
                                <div className="pc-actions">
                                    <Link to="/me/update" className="profile-btn primary">Edit profile</Link>
                                </div>
                            </div>

                            <div className="pc-identity">
                                <div className="pc-name">
                                    <h1>{user.name}</h1>
                                    <span className={`pc-pill ${isAdmin ? 'admin' : ''}`}><i></i>{isAdmin ? 'Admin' : 'Customer'}</span>
                                </div>
                                <p className="pc-email">{user.email}</p>
                                {memberSince && <p className="pc-since">Member since {memberSince}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ---------- two columns ---------- */}
                    <div className="pc-columns">
                        <div className="pc-col">
                            <section className="profile-block pc-card">
                                <div className="profile-section-head"><h2>Personal information</h2></div>
                                <dl className="pc-rows">
                                    <div className="pc-row">
                                        <dt>Phone number</dt>
                                        {editingPhone ? (
                                            <dd>
                                                <form className="pc-inline" onSubmit={savePhone}>
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        maxLength={20}
                                                        autoFocus
                                                        aria-label="Phone number"
                                                        placeholder="+63 900 000 0000"
                                                    />
                                                    <button type="submit" className="pc-mini primary" disabled={saving}>
                                                        {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button type="button" className="pc-mini" onClick={() => setEditingPhone(false)}>
                                                        Cancel
                                                    </button>
                                                </form>
                                            </dd>
                                        ) : (
                                            <>
                                                <dd className={user.phoneNo ? '' : 'empty'}>{user.phoneNo || 'Not set'}</dd>
                                                <button type="button" className="pc-edit" onClick={startPhoneEdit}>
                                                    <i className={`fa ${user.phoneNo ? 'fa-pencil' : 'fa-plus'}`} aria-hidden="true"></i>
                                                    {user.phoneNo ? 'Edit' : 'Add'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <Row label="Email">{user.email}</Row>
                                </dl>
                            </section>

                            <section className="profile-block pc-card pc-grow">
                                <div className="profile-section-head">
                                    <h2>Shipping address</h2>
                                    <Link to="/me/update" className="pc-edit"><i className="fa fa-pencil" aria-hidden="true"></i>Edit</Link>
                                </div>
                                {addressLines.length === 0 ? (
                                    <p className="pc-empty">No address saved yet. <Link to="/me/update">Add one</Link> for faster checkout.</p>
                                ) : (
                                    <address className="pc-address">
                                        <i className="fa fa-map-marker" aria-hidden="true"></i>
                                        <div>{addressLines.map((line, i) => <span key={i}>{line}</span>)}</div>
                                    </address>
                                )}
                            </section>

                            <section className="profile-block pc-card">
                                <div className="profile-section-head"><h2>Security</h2></div>
                                <div className="pc-security">
                                    <Link to="/password/update" className="profile-btn outline">Change password</Link>
                                    <button type="button" className="pc-signout" onClick={signOut}>
                                        <i className="fa fa-sign-out" aria-hidden="true"></i>Sign out
                                    </button>
                                </div>
                            </section>
                        </div>

                        <div className="pc-col">
                            <section className="profile-block pc-card">
                                <div className="profile-section-head"><h2>Account summary</h2></div>
                                <div className="pc-stats">
                                    <div><b>{ordersLoading ? '–' : stats.count}</b><span>Orders</span></div>
                                    <div><b>{ordersLoading ? '–' : money(stats.spent)}</b><span>Total spent</span></div>
                                    <div>
                                        <b>{stats.last ? fmtDate(stats.last.createdAt, { month: 'short', day: 'numeric' }) : '—'}</b>
                                        <span>Last order</span>
                                    </div>
                                </div>
                                {pct < 100 && (
                                <div className="pc-progress">
                                    <div className="pc-progress-head">
                                        <span>Profile completeness</span><b>{pct}%</b>
                                    </div>
                                    <div className="pc-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                                        <i style={{ width: `${pct}%` }} />
                                    </div>
                                    {missing.length > 0 && (
                                        <p className="pc-hint">Add your {missing.slice(0, 2).join(' and ').toLowerCase()} to finish. <Link to="/me/update">Update profile</Link></p>
                                    )}
                                </div>
                                )}
                            </section>

                            <section className="profile-block pc-card pc-grow">
                                <div className="profile-section-head">
                                    <h2>Recent orders</h2>
                                    <Link to="/orders/me">View all</Link>
                                </div>
                                {ordersLoading ? (
                                    <div className="pc-skel"><i /><i /><i /></div>
                                ) : stats.recent.length === 0 ? (
                                    <div className="pc-empty-state">
                                        <i className="fa fa-shopping-bag" aria-hidden="true"></i>
                                        <p>No orders yet</p>
                                        <Link to="/shop" className="profile-btn primary">Browse the shop</Link>
                                    </div>
                                ) : (
                                    <ul className="pc-orders">
                                        {stats.recent.map(o => (
                                            <li key={o._id}>
                                                <Link to={`/order/${o._id}`}>
                                                    <div>
                                                        <strong>#{String(o._id).slice(-6).toUpperCase()}</strong>
                                                        <small>
                                                            {fmtDate(o.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            {' · '}{o.orderItems?.length || 0} item{(o.orderItems?.length || 0) === 1 ? '' : 's'}
                                                        </small>
                                                    </div>
                                                    <div className="pc-order-right">
                                                        <span className={`pc-status ${statusTone(o.orderStatus)}`}>{o.orderStatus || 'Processing'}</span>
                                                        <b>{money(o.totalPrice)}</b>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile
