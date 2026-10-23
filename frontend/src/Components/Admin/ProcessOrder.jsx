import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import { money, formatDateTime, formatShortDateTime } from './adminHelpers'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { getOrderDetails, updateOrder, clearErrors } from '../../actions/orderActions'
import { UPDATE_ORDER_RESET } from '../../constants/orderConstants'
import './ProcessOrder.css'

const STATUS_FLOW = ['Processing', 'Shipped', 'Delivered']

// where an order can go from each status (must match the backend). Refunded is final.
const NEXT_STATUS = {
    Processing: ['Shipped', 'Delivered'],
    Shipped: ['Delivered'],
    Delivered: ['Returned', 'Refunded'],
    Returned: ['Refunded'],
    Refunded: [],
}

// one-line explanation shown under each option in the status dropdown
const STATUS_HINT = {
    Shipped: 'The order is on its way (you can add a tracking number)',
    Delivered: 'The customer received the order',
    Returned: 'Items go back into stock',
    Refunded: 'Final - locks the order',
}
const needsStock = (status) => status === 'Shipped' || status === 'Delivered'

const statusColor = (status = '') => {
    if (status.includes('Refunded')) return 'maroon'
    if (status.includes('Returned')) return 'red'
    if (status.includes('Delivered')) return 'green'
    if (status.includes('Shipped')) return 'blue'
    return 'amber'
}

const shortId = (id = '') => id.slice(-6).toUpperCase()

// shown when a product photo is missing or fails to load
const IMAGE_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="#f3eaf7"/>' +
    '<path d="M16 38l9-11 7 8 4-5 6 8z" fill="#cdb4d8"/><circle cx="21" cy="20" r="4" fill="#cdb4d8"/></svg>'
)

const ProcessOrder = () => {
    const dispatch = useDispatch();
    const { id: orderId } = useParams();

    const { loading, order = {} } = useSelector(state => state.orderDetails)
    const { error, isUpdated, emailSent, emailMessage } = useSelector(state => state.order)
    const {
        shippingInfo, orderItems = [], paymentInfo, user, orderStatus, statusHistory = [], trackingNumber,
        itemsPrice, shippingPrice, taxPrice, totalPrice, discountPrice, voucher, createdAt, paidAt, deliveredAt, stockDeducted,
    } = order

    const [saving, setSaving] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' });
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' });

    // load the order when the page opens
    useEffect(() => {
        dispatch(getOrderDetails(orderId))
    }, [dispatch, orderId])

    // messages after an update (the order itself is refreshed by the updateOrder action)
    useEffect(() => {
        if (error) {
            errMsg(error);
            dispatch(clearErrors())
        }
        if (isUpdated) {
            // the steps are already updated; show the messages right away
            successMsg('Order updated')
            // tell the admin whether the customer was emailed the receipt
            if (emailSent) successMsg(emailMessage || 'Receipt emailed to the customer')
            else if (emailMessage && emailMessage !== 'Status unchanged') toast.warn(`Order updated, but the customer email was not sent: ${emailMessage}`, { position: 'bottom-right' })
            dispatch({ type: UPDATE_ORDER_RESET })
        }
    }, [error, isUpdated])

    // close the "..." menu when clicking elsewhere or pressing Escape
    useEffect(() => {
        if (!menuOpen) return
        const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
        document.addEventListener('mousedown', onDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [menuOpen])

    const nextOptions = NEXT_STATUS[orderStatus] || []
    const menuOptions = nextOptions
    const isRefunded = orderStatus === 'Refunded'
    const isPaid = !!(paymentInfo && paymentInfo.status === 'succeeded')

    // items that cannot be shipped yet because the shop does not have enough in stock
    const shortItems = stockDeducted ? [] : orderItems.filter(item => typeof item.stock === 'number' && item.stock < item.quantity)
    const stockShort = shortItems.length > 0

    const copyText = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text)
            successMsg(`${label} copied`)
        } catch {
            errMsg('Could not copy to the clipboard')
        }
    }

    const changeStatus = async (status) => {
        if (saving) return
        setMenuOpen(false)
        if (stockShort && needsStock(status)) {
            errMsg('Restock the missing items before shipping this order')
            return
        }
        // confirmation popup: icon tile, title, short text, Cancel + Confirm side by side
        const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
        const ICONS = {
            check: svg('<circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
            alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.4" r=".6" fill="currentColor"/>'),
            undo: svg('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
            truck: svg('<rect x="1" y="4" width="14" height="11"/><polygon points="15 8 19 8 22 11 22 15 15 15 15 8"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="18" cy="17.5" r="2"/>'),
        }
        // tone: '' (green) | 'warn' (orange) | 'danger' (red)
        const askConfirm = (icon, tone, title, text, extra = {}) => Swal.fire({
            html: `<div class="po-swal-icon ${tone}">${ICONS[icon]}</div>` +
                `<h3 class="po-swal-title">${title}</h3><p class="po-swal-text">${text}</p>`,
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            buttonsStyling: false,
            reverseButtons: false,
            customClass: {
                container: 'po-swal-bg',
                popup: 'po-swal',
                htmlContainer: 'po-swal-body',
                closeButton: 'po-swal-close',
                actions: 'po-swal-actions',
                confirmButton: `po-swal-confirm ${tone}`,
                cancelButton: 'po-swal-cancel',
                input: 'po-swal-input',
            },
            ...extra,
        })

        const confirmText = {
            Delivered: ['check', '', 'Mark as delivered?', 'The customer will be emailed.'],
            Returned: ['undo', 'warn', 'Mark as returned?', 'Items go back into stock.'],
            Refunded: ['alert', 'danger', 'Record this refund?', 'Final. This sends no money, so refund in Stripe first.'],
        }[status]
        if (confirmText) {
            const result = await askConfirm(...confirmText)
            if (!result.isConfirmed) return
        }
        const payload = { status }
        if (status === 'Shipped') {
            // shipping asks for the optional tracking number here
            const result = await askConfirm('truck', '', 'Mark as shipped?', 'The customer will be emailed.', {
                input: 'text',
                inputPlaceholder: 'Tracking number (optional)',
                inputAttributes: { maxlength: 100 },
            })
            if (!result.isConfirmed) return
            if ((result.value || '').trim()) payload.trackingNumber = result.value.trim()
        }
        setSaving(true)
        await dispatch(updateOrder(order._id, payload))
        setSaving(false)
    }

    // ----- when each step was reached (falls back to the order dates for older orders) -----
    const stepTime = (step) => {
        const entry = [...statusHistory].reverse().find(e => e.status === step)
        if (entry) return entry.at
        if (step === 'Processing') return createdAt
        if (step === 'Delivered') return deliveredAt
        return null
    }
    // Returned / Refunded steps only appear once the order has gone there
    const reached = statusHistory.map(e => e.status)
    const steps = [...STATUS_FLOW]
    if (orderStatus === 'Returned' || reached.includes('Returned')) steps.push('Returned')
    if (orderStatus === 'Refunded' || reached.includes('Refunded')) steps.push('Refunded')
    const currentIdx = steps.indexOf(orderStatus)
    const fill = currentIdx < 0 ? 0 : currentIdx / (steps.length - 1)

    // ----- totals (falls back to the item sum for older orders) -----
    const itemsSum = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemsTotal = itemsPrice || itemsSum
    const otherCharges = Math.max(0, Number((totalPrice - itemsTotal - (shippingPrice || 0) - (taxPrice || 0) + (discountPrice || 0)).toFixed(2)) || 0)
    const taxRate = itemsTotal > 0 && taxPrice > 0 ? Math.round((taxPrice / itemsTotal) * 1000) / 10 : 0

    const stockNote = (item) => {
        if (typeof item.stock !== 'number') return <span className="po-stock">No longer in the catalog</span>
        if (stockDeducted) return <span className="po-stock">{item.stock} left in stock</span>
        if (item.stock < item.quantity) return <span className="po-stock bad">Only {item.stock} in stock</span>
        return <span className="po-stock">{item.stock} in stock</span>
    }

    return (
        <>
            <MetaData title={`Process Order # ${order && order._id}`} />
            <AdminLayout
                above={<Link to="/admin/orders" className="po-back"><i className="fa fa-arrow-left" aria-hidden="true"></i> Orders</Link>}
                title={order._id ? (
                    <span className="po-title">
                        <span>Order <span className="adm-mono">#{shortId(order._id)}</span></span>
                        <button type="button" className="po-copy po-no-print" title="Copy full order ID" aria-label="Copy full order ID"
                            onClick={() => copyText(order._id, 'Order ID')}>
                            <i className="fa fa-clipboard" aria-hidden="true"></i>
                        </button>
                    </span>
                ) : 'Order'}
                subtitle={createdAt ? `Placed ${formatDateTime(createdAt)}` : undefined}
                actions={
                    <div className="po-page-actions">
                        {orderStatus && (menuOptions.length > 0 ? (
                            <div className="po-more po-no-print" ref={menuRef}>
                                <button type="button" className={`adm-pill dot ${statusColor(orderStatus)} po-status-btn`}
                                    aria-haspopup="menu" aria-expanded={menuOpen} title="Change status"
                                    onClick={() => setMenuOpen(open => !open)}>
                                    {orderStatus} <i className="fa fa-chevron-down po-caret" aria-hidden="true"></i>
                                </button>
                                {menuOpen && (
                                    <div className="po-menu" role="menu">
                                        <p className="po-menu-title">Change status to</p>
                                        {menuOptions.map(option => (
                                            <button key={option} type="button" role="menuitem"
                                                className={option === 'Refunded' ? 'danger' : ''}
                                                disabled={saving || (stockShort && needsStock(option))}
                                                onClick={() => changeStatus(option)}>
                                                <span className="po-menu-label">{option}</span>
                                                <span className="po-menu-hint">{STATUS_HINT[option]}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className={`adm-pill dot ${statusColor(orderStatus)} po-status-static`}>{orderStatus}</span>
                        ))}
                        <button type="button" className="adm-btn" onClick={() => window.print()}>
                            <i className="fa fa-print" aria-hidden="true"></i> Print packing slip
                        </button>
                    </div>
                }
            >
                {loading ? <Loader /> : (
                    <>
                        <p className="po-print-title">Packing slip - order #{shortId(order._id)}, placed {formatDateTime(createdAt)}</p>

                        <div className="po-grid">
                            {/* ---------- left: customer ---------- */}
                            <aside className="po-info">
                                <section className="po-card">
                                    <h3 className="po-card-title">Customer</h3>

                                    <div className="po-section">
                                        <h4 className="po-sub">Contact</h4>
                                        <dl className="po-kv">
                                            <dt>Name</dt>
                                            <dd>{user && user.name}</dd>
                                            <dt>Email</dt>
                                            <dd>{user && user.email ? <a href={`mailto:${user.email}`}>{user.email}</a> : '—'}</dd>
                                        </dl>
                                    </div>

                                    <div className="po-section">
                                        <h4 className="po-sub">Shipping</h4>
                                        {shippingInfo && (
                                            <dl className="po-kv">
                                                <dt>Address</dt>
                                                <dd className="po-copyline po-top">
                                                    <span>
                                                        {shippingInfo.address}<br />
                                                        {shippingInfo.city}, {shippingInfo.postalCode}<br />
                                                        {shippingInfo.country}
                                                    </span>
                                                    <button type="button" className="po-copy po-no-print" title="Copy address" aria-label="Copy address"
                                                        onClick={() => copyText(`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`, 'Address')}>
                                                        <i className="fa fa-clipboard" aria-hidden="true"></i>
                                                    </button>
                                                </dd>
                                                <dt>Phone</dt>
                                                <dd><a href={`tel:${shippingInfo.phoneNo}`}>{shippingInfo.phoneNo}</a></dd>
                                            </dl>
                                        )}
                                    </div>
                                </section>
                            </aside>

                            {/* ---------- right: progress + actions + items + payment ---------- */}
                            <div className="po-main">
                                <section className="po-card">
                                    <div className="po-progress po-no-print">
                                    <ol className="po-steps" style={{ '--po-fill': fill, '--po-n': steps.length }} aria-label="Order progress">
                                        {steps.map((step, i) => {
                                            const done = i < currentIdx || (i === currentIdx && (step === 'Delivered' || step === 'Refunded'))
                                            const current = i === currentIdx && !done
                                            const time = done || current ? stepTime(step) : null
                                            return (
                                                <li key={step} className={done ? 'done' : current ? 'current' : ''} aria-current={current ? 'step' : undefined}>
                                                    <span className="po-dot">{done ? <i className="fa fa-check" aria-hidden="true"></i> : i + 1}</span>
                                                    <span className="po-step-label">{step}</span>
                                                    <span className="po-step-time">{time ? formatShortDateTime(time) : '\u00a0'}</span>
                                                </li>
                                            )
                                        })}
                                    </ol>

                                    {trackingNumber && (
                                        <p className="po-tracking">
                                            <span className="po-label">Tracking number</span>
                                            <b className="adm-mono">{trackingNumber}</b>
                                        </p>
                                    )}

                                    {nextOptions.length > 0 && (
                                        <>
                                            {stockShort && nextOptions.some(needsStock) && (
                                                <p className="po-warn po-actions-warn" role="alert">
                                                    <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                                                    Not enough stock to ship: {shortItems.map(item => `${item.name} (${item.stock} left, ordered ${item.quantity})`).join(', ')}. Restock before shipping.
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {isRefunded && (
                                        <p className="po-locked-inline po-no-print">
                                            <i className="fa fa-lock" aria-hidden="true"></i>
                                            {stepTime('Refunded') ? `Refunded on ${formatDateTime(stepTime('Refunded'))}. This order is locked.` : 'Refunded. This order is locked.'}
                                        </p>
                                    )}

                                    </div>

                                    <h3 className="po-card-title">Order items <span className="po-count">{orderItems.length}</span></h3>
                                    <div className="po-table-wrap">
                                        <table className="po-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th className="num po-money">Price</th>
                                                    <th className="num">Qty</th>
                                                    <th className="num po-money">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map(item => (
                                                    <tr key={item.product}>
                                                        <td>
                                                            <div className="po-product">
                                                                <img
                                                                    src={item.image || IMAGE_PLACEHOLDER}
                                                                    alt={item.name}
                                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_PLACEHOLDER }}
                                                                />
                                                                <div className="po-product-info">
                                                                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                                    <span className="po-no-print">{stockNote(item)}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="num po-money" data-label="Price">{money(item.price)}</td>
                                                        <td className="num" data-label="Qty">{item.quantity}</td>
                                                        <td className="num po-strong po-money" data-label="Subtotal">{money(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <dl className="po-totals po-money">
                                        <div><dt>Items subtotal</dt><dd>{money(itemsTotal)}</dd></div>
                                        {discountPrice > 0 && <div><dt>Voucher{voucher && voucher.code ? ` (${voucher.code})` : ''}</dt><dd>-{money(discountPrice)}</dd></div>}
                                        <div><dt>Shipping</dt><dd>{shippingPrice ? money(shippingPrice) : 'Free'}</dd></div>
                                        <div><dt>Tax{taxRate ? ` (${taxRate}%)` : ''}</dt><dd>{money(taxPrice)}</dd></div>
                                        {otherCharges > 0 && <div><dt>Other charges</dt><dd>{money(otherCharges)}</dd></div>}
                                        <div className="po-grand"><dt>Grand total</dt><dd>{money(totalPrice)}</dd></div>
                                    </dl>

                                    <div className="po-payline po-money">
                                        <span className={`adm-pill dot ${isRefunded ? 'maroon' : isPaid ? 'green' : 'red'}`}>{isRefunded ? 'Refunded' : isPaid ? 'Paid' : 'Not paid'}</span>
                                        {paidAt && <span>Paid on {formatDateTime(paidAt)}</span>}
                                        {paymentInfo && paymentInfo.id && (
                                            <span className="po-payid">Payment ID <span className="adm-mono po-break">{paymentInfo.id}</span></span>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </>
                )}
            </AdminLayout>
        </>
    )
}

export default ProcessOrder
