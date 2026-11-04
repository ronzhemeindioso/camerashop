import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { createOrder } from '../../actions/orderActions'
import { clearCart } from '../../actions/cartActions';
import { peso } from '../../Utils/helpers'
import './checkout.css'

// 1234567890123456 -> 1234 5678 9012 3456
const formatCardNumber = (value) =>
    value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')

// 1226 -> 12/26
const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

const Payment = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector(state => state.cart)

    const [submitting, setSubmitting] = useState(false)
    const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })
    const [errors, setErrors] = useState({})

    // saved on the Confirm Order page, together with the prices
    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'));
    const isCard = orderInfo && orderInfo.paymentMethod === 'card'
    const total = orderInfo ? peso(orderInfo.totalPrice) : ''

    const order = {
        orderItems: cartItems,
        shippingInfo
    }
    if (orderInfo) {
        order.itemsPrice = orderInfo.itemsPrice
        order.shippingPrice = orderInfo.shippingPrice
        order.taxPrice = orderInfo.taxPrice
        order.totalPrice = orderInfo.totalPrice
        if (orderInfo.voucherCode) {
            order.voucherCode = orderInfo.voucherCode
        }
    }

    const placeOrder = async (paymentMethod) => {
        setSubmitting(true)
        const payload = {
            ...order,
            paymentMethod,
            // COD: nothing is paid yet - the customer pays the courier on delivery
            paymentInfo: paymentMethod === 'COD'
                ? { id: 'COD', status: 'pending' }
                : { id: 'pi_1DpdYh2eZvKYlo2CYIynhU32', status: 'succeeded' }
        }

        const result = await dispatch(createOrder(payload))
        if (!result || !result.success) {
            // e.g. the voucher expired or was used up while the customer was paying
            toast.error((result && result.message) || 'Could not place the order', {
                position: 'bottom-right'
            })
            setSubmitting(false)
            return
        }
        toast.success('Order placed', { position: 'bottom-right' })
        sessionStorage.removeItem('orderInfo')
        dispatch(clearCart())
        navigate('/success', { state: { method: paymentMethod, total: order.totalPrice } })
    }

    const validateCard = () => {
        const next = {}
        const digits = card.number.replace(/\s+/g, '')
        if (!/^\d{13,19}$/.test(digits)) next.number = 'Enter a valid card number'
        const m = card.expiry.match(/^(\d{2})\/(\d{2})$/)
        if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
            next.expiry = 'Use the format MM/YY'
        } else {
            const exp = new Date(2000 + Number(m[2]), Number(m[1]), 1) // first day after the expiry month
            if (exp <= new Date()) next.expiry = 'This card has expired'
        }
        if (!/^\d{3,4}$/.test(card.cvc)) next.cvc = 'Enter a valid CVC'
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const submitCard = (e) => {
        e.preventDefault()
        if (!validateCard()) return
        placeOrder('Card')
    }

    const submitCOD = (e) => {
        e.preventDefault()
        placeOrder('COD')
    }

    const updateCard = (field, format = (v) => v) => (e) => {
        setCard(prev => ({ ...prev, [field]: format(e.target.value) }))
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // someone opened /payment directly, without confirming an order first
    if (!orderInfo) {
        return (
            <>
                <MetaData title={'Payment'} />
                <CheckoutSteps shipping confirmOrder payment />
                <div className="co-page co-page--narrow">
                    <div className="co-card">
                        <h1 className="co-title">Payment</h1>
                        <p className="co-note">Your order summary is missing. Please confirm your order first.</p>
                        <Link to="/confirm" className="co-btn">Back to Confirm Order</Link>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <MetaData title={'Payment'} />
            <CheckoutSteps shipping confirmOrder payment />
            <div className="co-page co-page--narrow">
                {isCard ? (
                    <form className="co-card" onSubmit={submitCard} noValidate>
                        <h1 className="co-title">Card Information</h1>
                        <p className="co-subtitle">Enter your card details to complete the payment.</p>

                        <div className="co-field">
                            <label className="co-label" htmlFor="card_num_field">Card number</label>
                            <input
                                type="text"
                                id="card_num_field"
                                className={`co-input${errors.number ? ' is-invalid' : ''}`}
                                inputMode="numeric"
                                autoComplete="cc-number"
                                placeholder="1234 5678 9012 3456"
                                value={card.number}
                                onChange={updateCard('number', formatCardNumber)}
                            />
                            {errors.number && <div className="co-error">{errors.number}</div>}
                        </div>

                        <div className="co-row-2">
                            <div className="co-field">
                                <label className="co-label" htmlFor="card_exp_field">Expiry date</label>
                                <input
                                    type="text"
                                    id="card_exp_field"
                                    className={`co-input${errors.expiry ? ' is-invalid' : ''}`}
                                    inputMode="numeric"
                                    autoComplete="cc-exp"
                                    placeholder="MM/YY"
                                    value={card.expiry}
                                    onChange={updateCard('expiry', formatExpiry)}
                                />
                                {errors.expiry && <div className="co-error">{errors.expiry}</div>}
                            </div>

                            <div className="co-field">
                                <label className="co-label" htmlFor="card_cvc_field">CVC</label>
                                <input
                                    type="text"
                                    id="card_cvc_field"
                                    className={`co-input${errors.cvc ? ' is-invalid' : ''}`}
                                    inputMode="numeric"
                                    autoComplete="cc-csc"
                                    placeholder="123"
                                    maxLength={4}
                                    value={card.cvc}
                                    onChange={updateCard('cvc', (v) => v.replace(/\D/g, ''))}
                                />
                                {errors.cvc && <div className="co-error">{errors.cvc}</div>}
                            </div>
                        </div>

                        <div className="co-due">
                            <span>Amount due</span>
                            <strong>{total}</strong>
                        </div>

                        <button id="pay_btn" type="submit" className="co-btn" disabled={submitting} style={{ marginTop: 0 }}>
                            {submitting ? 'Processing...' : `Pay ${total}`}
                        </button>
                        <Link to="/confirm" className="co-btn co-btn--ghost">Change payment method</Link>
                    </form>
                ) : (
                    <form className="co-card" onSubmit={submitCOD}>
                        <h1 className="co-title">Cash on Delivery</h1>
                        <p className="co-subtitle">Review your payment details before placing the order.</p>

                        <p className="co-note">
                            You will pay in cash when your order is delivered. Please prepare the exact amount
                            if possible.
                        </p>

                        <div className="co-due">
                            <span>Amount to pay on delivery</span>
                            <strong>{total}</strong>
                        </div>

                        <button id="pay_btn" type="submit" className="co-btn" disabled={submitting} style={{ marginTop: 0 }}>
                            {submitting ? 'Placing order...' : 'Place Order'}
                        </button>
                        <Link to="/confirm" className="co-btn co-btn--ghost">Change payment method</Link>
                    </form>
                )}
            </div>
        </>
    )
}

export default Payment
