import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { errMsg, successMsg, peso, TAX_RATE } from '../../Utils/helpers'
import './checkout.css'

const describeVoucher = (v) => {
    const off = v.discountType === 'percent' ? `${v.discountValue}% off` : `${peso(v.discountValue)} off`
    return v.minPurchase > 0 ? `${off} · min. ${peso(v.minPurchase)}` : off
}
const ConfirmOrder = () => {
    let navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const { user } = useSelector(state => state.auth)
    // Calculate Order Prices
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingPrice = itemsPrice > 200 ? 0 : 25
    const taxPrice = Number((TAX_RATE * itemsPrice).toFixed(2))

    // Voucher (the server checks it again when the order is placed)
    const [voucherInput, setVoucherInput] = useState('')
    const [appliedVoucher, setAppliedVoucher] = useState(null) // { code, discount }
    const [applying, setApplying] = useState(false)
    const [availableVouchers, setAvailableVouchers] = useState([])
    // 'cod' (cash on delivery) or 'card'
    const [paymentMethod, setPaymentMethod] = useState(() => {
        try { return (JSON.parse(sessionStorage.getItem('orderInfo')) || {}).paymentMethod || 'cod' } catch { return 'cod' }
    })
    const discountPrice = appliedVoucher ? appliedVoucher.discount : 0
    const totalPrice = Math.max(0, itemsPrice + shippingPrice + taxPrice - discountPrice).toFixed(2)

    const apiConfig = { headers: { 'Content-Type': 'application/json' }, withCredentials: true }

    useEffect(() => {
        const loadAvailable = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API}/vouchers/available`, apiConfig)
                setAvailableVouchers(data.vouchers || [])
            } catch (error) {
                // the list is only a convenience - typing a code still works
            }
        }
        loadAvailable()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const applyVoucher = async (code = voucherInput) => {
        const trimmed = String(code).trim()
        if (!trimmed) return errMsg('Please enter a voucher code')
        setApplying(true)
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API}/voucher/validate`,
                { code: trimmed, itemsPrice },
                apiConfig
            )
            setAppliedVoucher({ code: data.voucher.code, discount: data.discount })
            setVoucherInput('')
            successMsg(`Voucher ${data.voucher.code} applied`)
        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        } finally {
            setApplying(false)
        }
    }

    const removeVoucher = () => setAppliedVoucher(null)

    const processToPayment = () => {
        const data = {
            itemsPrice: itemsPrice.toFixed(2),
            shippingPrice,
            taxPrice,
            totalPrice,
            paymentMethod
        }
        if (appliedVoucher) {
            data.voucherCode = appliedVoucher.code
            data.discountPrice = appliedVoucher.discount
        }

        sessionStorage.setItem('orderInfo', JSON.stringify(data))
        navigate('/payment')
    }

    const fullAddress = [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country]
        .filter(Boolean).join(', ')

    return (
        <>
            <MetaData title={'Confirm Order'} />
            <CheckoutSteps shipping confirmOrder />
            <div className="co-page">
                <h1 className="co-title">Confirm Order</h1>
                <p className="co-subtitle">Review your details and choose how you want to pay.</p>

                <div className="co-confirm-layout">
                    <div className="co-stack">
                        <section className="co-card">
                            <div className="co-card-head">
                                <h2 className="co-card-title">Shipping Information</h2>
                                <Link to="/shipping" className="co-link">Edit</Link>
                            </div>
                            <dl className="co-details">
                                <dt>Name</dt>
                                <dd>{(user && user.name) || '-'}</dd>
                                <dt>Phone</dt>
                                <dd>{shippingInfo.phoneNo || '-'}</dd>
                                <dt>Address</dt>
                                <dd>{fullAddress || '-'}</dd>
                            </dl>
                        </section>

                        <section className="co-card">
                            <div className="co-card-head">
                                <h2 className="co-card-title">Order Items ({cartItems.length})</h2>
                                <Link to="/cart" className="co-link">Edit cart</Link>
                            </div>
                            <ul className="co-items">
                                {cartItems.map(item => (
                                    <li className="co-item" key={item.product}>
                                        <img src={item.image} alt={item.name} />
                                        <div>
                                            <Link to={`/products/${item.product}`} className="co-item-name">{item.name}</Link>
                                            <span className="co-item-meta">{item.quantity} x {peso(item.price)}</span>
                                        </div>
                                        <span className="co-item-total">{peso(item.quantity * item.price)}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    <aside className="co-card">
                        <h2 className="co-summary-title">Order Summary</h2>

                        <div className="co-summary-line">
                            <span>Subtotal</span>
                            <span>{peso(itemsPrice)}</span>
                        </div>
                        {appliedVoucher && (
                            <div className="co-summary-line co-summary-discount">
                                <span>Voucher ({appliedVoucher.code})</span>
                                <span>-{peso(discountPrice)}</span>
                            </div>
                        )}
                        <div className="co-summary-line">
                            <span>Shipping</span>
                            <span>{shippingPrice ? peso(shippingPrice) : 'Free'}</span>
                        </div>
                        <div className="co-summary-line">
                            <span>Tax ({Math.round(TAX_RATE * 100)}%)</span>
                            <span>{peso(taxPrice)}</span>
                        </div>
                        <div className="co-summary-line co-summary-total">
                            <span>Total</span>
                            <span>{peso(totalPrice)}</span>
                        </div>

                        <hr className="co-divider" />

                        {appliedVoucher ? (
                            <div className="co-voucher-applied">
                                <span><b>{appliedVoucher.code}</b> applied</span>
                                <button type="button" className="co-voucher-remove" onClick={removeVoucher}>Remove</button>
                            </div>
                        ) : (
                            <>
                                <label htmlFor="voucher_field" className="co-label">Voucher code</label>
                                <div className="co-voucher-row">
                                    <input
                                        type="text"
                                        id="voucher_field"
                                        className="co-input"
                                        placeholder="Enter code"
                                        value={voucherInput}
                                        maxLength={30}
                                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyVoucher() } }}
                                    />
                                    <button type="button" className="co-btn-sm" onClick={() => applyVoucher()} disabled={applying}>
                                        {applying ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {availableVouchers.length > 0 && (
                                    <div className="co-voucher-list">
                                        <small>Available for you:</small>
                                        {availableVouchers.map(v => (
                                            <button type="button" key={v.code} className="co-voucher-chip" onClick={() => applyVoucher(v.code)} disabled={applying} title={v.description || ''}>
                                                <b>{v.code}</b>
                                                <span>{describeVoucher(v)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        <hr className="co-divider" />

                        <fieldset className="co-methods">
                            <legend>Payment method</legend>
                            <label className={`co-method${paymentMethod === 'cod' ? ' is-selected' : ''}`} htmlFor="pay_cod">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    id="pay_cod"
                                    value="cod"
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => setPaymentMethod('cod')}
                                />
                                <span>
                                    <span className="co-method-name">Cash on Delivery</span>
                                    <span className="co-method-desc">Pay in cash when your order arrives.</span>
                                </span>
                            </label>
                            <label className={`co-method${paymentMethod === 'card' ? ' is-selected' : ''}`} htmlFor="pay_card">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    id="pay_card"
                                    value="card"
                                    checked={paymentMethod === 'card'}
                                    onChange={() => setPaymentMethod('card')}
                                />
                                <span>
                                    <span className="co-method-name">Credit / Debit Card</span>
                                    <span className="co-method-desc">You will enter your card details next.</span>
                                </span>
                            </label>
                        </fieldset>

                        <button id="checkout_btn" type="button" className="co-btn" onClick={processToPayment}>
                            {paymentMethod === 'card' ? 'Continue to Card Info' : 'Continue with COD'}
                        </button>
                    </aside>
                </div>
            </div>
        </>
    )
}

export default ConfirmOrder
