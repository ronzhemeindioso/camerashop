import React, { useState, useEffect } from 'react'
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

// Stripe dashboard link (test-mode link while running the dev server)
const stripePaymentUrl = (id) =>
    `https://dashboard.stripe.com/${import.meta.env.DEV ? 'test/' : ''}payments/${id}`

const ProcessOrder = () => {
    const dispatch = useDispatch();
    const { id: orderId } = useParams();

    const { loading, order = {} } = useSelector(state => state.orderDetails)
    const { error, isUpdated, emailSent, emailMessage } = useSelector(state => state.order)
    const {
        shippingInfo, orderItems = [], paymentInfo, user, orderStatus, statusHistory = [], trackingNumber,
        itemsPrice, shippingPrice, taxPrice, totalPrice, createdAt, paidAt, deliveredAt, stockDeducted,
    } = order

    const [status, setStatus] = useState('')
    const [tracking, setTracking] = useState('')
    const [saving, setSaving] = useState(false)

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-center' });
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-center' });

    useEffect(() => {
        dispatch(getOrderDetails(orderId))
        if (error) {
            errMsg(error);
            dispatch(clearErrors())
        }
        if (isUpdated) {
            // stay on the page so the progress steps show what changed
            successMsg('Order updated');
            // tell the admin whether the customer was emailed the receipt
            if (emailSent) successMsg(emailMessage || 'Receipt emailed to the customer')
            else if (emailMessage && emailMessage !== 'Status unchanged') toast.warn(`Order updated, but the customer email was not sent: ${emailMessage}`, { position: 'bottom-center' })
            dispatch({ type: UPDATE_ORDER_RESET })
            setTracking('')
        }
    }, [error, isUpdated, orderId])

    // start the dropdown on the order's current status
    useEffect(() => {
        if (orderStatus) setStatus(orderStatus)
    }, [orderStatus])

    const nextOptions = NEXT_STATUS[orderStatus] || []
    const statusOptions = [orderStatus, ...nextOptions]
    const isRefunded = orderStatus === 'Refunded'
    const isPaid = !!(paymentInfo && paymentInfo.status === 'succeeded')

    // items that cannot be shipped yet because the shop does not have enough in stock
    const shortItems = stockDeducted ? [] : orderItems.filter(item => typeof item.stock === 'number' && item.stock < item.quantity)
    const blocked = shortItems.length > 0 && (status === 'Shipped' || status === 'Delivered')

    const copyText = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text)
            successMsg(`${label} copied`)
        } catch {
            errMsg('Could not copy to the clipboard')
        }
    }

    const updateHandler = async () => {
        if (saving) return
        if (!status || status === orderStatus) {
            toast.info('Pick a different status first', { position: 'bottom-center' })
            return
        }
        if (blocked) {
            errMsg('Restock the missing items before shipping this order')
            return
        }
        const confirmText = {
            Delivered: ['Mark as delivered?', 'The customer will see this order as delivered.', 'Yes, mark delivered'],
            Returned: ['Mark as returned?', 'The items will be added back to stock.', 'Yes, mark returned'],
            Refunded: ['Record this refund?', 'This only records the refund in the store, it does not send any money. Refund the payment in Stripe first. Refunded is final and the order cannot be changed afterwards.', 'Yes, record refund'],
        }[status]
        if (confirmText) {
            const result = await Swal.fire({
                title: confirmText[0],
                text: confirmText[1],
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: confirmText[2],
                confirmButtonColor: '#7e3d84',
            })
            if (!result.isConfirmed) return
        }
        const payload = { status }
        if (status === 'Shipped' && tracking.trim()) payload.trackingNumber = tracking.trim()
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
    const otherCharges = Math.max(0, Number((totalPrice - itemsTotal - (shippingPrice || 0) - (taxPrice || 0)).toFixed(2)) || 0)
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
                title="Process order"
                subtitle="Review the order and update its status"
                actions={
                    <div className="po-page-actions">
                        <button type="button" className="adm-btn" onClick={() => window.print()}>
                            <i className="fa fa-print" aria-hidden="true"></i> Print packing slip
                        </button>
                        <Link to="/admin/orders" className="adm-btn"><i className="fa fa-arrow-left" aria-hidden="true"></i> Back to orders</Link>
                    </div>
                }
            >
                {loading ? <Loader /> : (
                    <>
                        <p className="po-print-title">Packing slip - order #{shortId(order._id)}, placed {formatDateTime(createdAt)}</p>

                        {/* ---------- header ---------- */}
                        <div className="po-head">
                            <div className="po-id">
                                <span className="po-label">Order</span>
                                <b className="adm-mono po-id-value">#{shortId(order._id)}</b>
                                <button type="button" className="po-copy po-no-print" title="Copy full order ID" aria-label="Copy full order ID"
                                    onClick={() => copyText(order._id, 'Order ID')}>
                                    <i className="fa fa-clipboard" aria-hidden="true"></i>
                                </button>
                            </div>
                            <span className={`adm-pill dot ${statusColor(orderStatus)}`}>{orderStatus}</span>
                            <span className="po-muted">Placed {formatDateTime(createdAt)}</span>
                            {nextOptions.length > 0 && (
                                <div className="po-head-actions po-no-print">
                                    {status === 'Shipped' && orderStatus !== 'Shipped' && (
                                        <input
                                            type="text"
                                            className="adm-input po-tracking-input"
                                            placeholder="Tracking number (optional)"
                                            aria-label="Tracking number (optional)"
                                            maxLength={100}
                                            value={tracking}
                                            onChange={(e) => setTracking(e.target.value)}
                                        />
                                    )}
                                    <select
                                        className="adm-select po-select"
                                        name="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        aria-label="New status"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    <button type="button" className="adm-btn adm-btn-primary po-update"
                                        disabled={blocked || saving || status === orderStatus} onClick={updateHandler}>
                                        {saving ? 'Saving...' : 'Update status'}
                                    </button>
                                </div>
                            )}
                            {nextOptions.length > 0 && blocked && (
                                <p className="po-warn po-head-warn po-no-print" role="alert">
                                    <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                                    Not enough stock to ship: {shortItems.map(item => `${item.name} (${item.stock} left, ordered ${item.quantity})`).join(', ')}. Restock before shipping.
                                </p>
                            )}
                        </div>

                        <div className="po-grid">
                            {/* ---------- left: customer + payment ---------- */}
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

                                <section className="po-card po-money">
                                    <h3 className="po-card-title">Payment</h3>
                                    <dl className="po-kv">
                                        <dt>Status</dt>
                                        <dd>
                                            <span className={`adm-pill dot ${isRefunded ? 'maroon' : isPaid ? 'green' : 'red'}`}>{isRefunded ? 'Refunded' : isPaid ? 'Paid' : 'Not paid'}</span>
                                            {isPaid && <span className="po-paid-amount">{money(totalPrice)}</span>}
                                        </dd>
                                        {paidAt && (<><dt>Paid on</dt><dd>{formatDateTime(paidAt)}</dd></>)}
                                        <dt className="po-full">Stripe payment</dt>
                                        <dd className="po-full po-copyline">
                                            <span className="adm-mono po-break">{paymentInfo && paymentInfo.id ? paymentInfo.id : '—'}</span>
                                            {paymentInfo && paymentInfo.id && (
                                                <>
                                                    <button type="button" className="po-copy" title="Copy Stripe ID" aria-label="Copy Stripe ID"
                                                        onClick={() => copyText(paymentInfo.id, 'Stripe ID')}>
                                                        <i className="fa fa-clipboard" aria-hidden="true"></i>
                                                    </button>
                                                    <a className="po-copy" href={stripePaymentUrl(paymentInfo.id)} target="_blank" rel="noopener noreferrer"
                                                        title="Open in Stripe" aria-label="Open this payment in Stripe">
                                                        <i className="fa fa-external-link" aria-hidden="true"></i>
                                                    </a>
                                                </>
                                            )}
                                        </dd>
                                    </dl>
                                </section>
                            </aside>

                            {/* ---------- right: status + items ---------- */}
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
                                            <button type="button" className="po-copy po-no-print" title="Copy tracking number" aria-label="Copy tracking number"
                                                onClick={() => copyText(trackingNumber, 'Tracking number')}>
                                                <i className="fa fa-clipboard" aria-hidden="true"></i>
                                            </button>
                                        </p>
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
                                        <div><dt>Shipping</dt><dd>{shippingPrice ? money(shippingPrice) : 'Free'}</dd></div>
                                        <div><dt>Tax{taxRate ? ` (${taxRate}%)` : ''}</dt><dd>{money(taxPrice)}</dd></div>
                                        {otherCharges > 0 && <div><dt>Other charges</dt><dd>{money(otherCharges)}</dd></div>}
                                        <div className="po-grand"><dt>Grand total</dt><dd>{money(totalPrice)}</dd></div>
                                    </dl>
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
