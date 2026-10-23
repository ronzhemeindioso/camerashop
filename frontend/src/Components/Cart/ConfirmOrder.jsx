import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { getUser } from '../../Utils/helpers'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { errMsg, successMsg } from '../../Utils/helpers'

const describeVoucher = (v) => {
    const off = v.discountType === 'percent' ? `${v.discountValue}% off` : `$${Number(v.discountValue).toFixed(2)} off`
    return v.minPurchase > 0 ? `${off} · min. $${Number(v.minPurchase).toFixed(2)}` : off
}
const ConfirmOrder = () => {
    // const [user, setUser] = useState(getUser() ? getUser() : {})
    let navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const { user } = useSelector(state => state.auth)
    // Calculate Order Prices
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingPrice = itemsPrice > 200 ? 0 : 25
    const taxPrice = Number((0.05 * itemsPrice).toFixed(2))

    // Voucher (the server checks it again when the order is placed)
    const [voucherInput, setVoucherInput] = useState('')
    const [appliedVoucher, setAppliedVoucher] = useState(null) // { code, discount }
    const [applying, setApplying] = useState(false)
    const [availableVouchers, setAvailableVouchers] = useState([])
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
            totalPrice
        }
        if (appliedVoucher) {
            data.voucherCode = appliedVoucher.code
            data.discountPrice = appliedVoucher.discount
        }

        sessionStorage.setItem('orderInfo', JSON.stringify(data))
        navigate('/payment')
    }

    return (
        <>
            <MetaData title={'Confirm Order'} />
            <CheckoutSteps shipping confirmOrder />
            <div className="row d-flex justify-content-between">
                <div className="col-12 col-lg-8 mt-5 order-confirm">
                    <h4 className="mb-3">Shipping Info</h4>
                    {user && <p><b>Name:</b> {user && user.name}</p>}
                    <p><b>Phone:</b> {shippingInfo.phoneNo}</p>
                    <p className="mb-4"><b>Address:</b> {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}</p>

                    <hr />
                    <h4 className="mt-4">Your Cart Items:</h4>

                    {cartItems.map(item => (
                        <>
                            <hr />
                            <div className="cart-item my-1" key={item.product}>
                                <div className="row">
                                    <div className="col-4 col-lg-2">
                                        <img src={item.image} alt="Laptop" height="45" width="65" />
                                    </div>

                                    <div className="col-5 col-lg-6">
                                        <Link to={`/product/${item.product}`}>{item.name}</Link>
                                    </div>


                                    <div className="col-4 col-lg-4 mt-4 mt-lg-0">
                                        <p>{item.quantity} x ${item.price} = <b>${(item.quantity * item.price).toFixed(2)}</b></p>
                                    </div>

                                </div>
                            </div>
                            <hr />
                        </>
                    ))}

                </div>

                <div className="col-12 col-lg-3 my-4">
                    <div id="order_summary">
                        <h4>Order Summary</h4>
                        <hr />
                        <p>Subtotal:  <span className="order-summary-values">${itemsPrice}</span></p>
                        {appliedVoucher && (
                            <p className="voucher-discount-line">Voucher ({appliedVoucher.code}): <span className="order-summary-values">-${discountPrice.toFixed(2)}</span></p>
                        )}
                        <p>Shipping: <span className="order-summary-values">${shippingPrice}</span></p>
                        <p>Tax:  <span className="order-summary-values">${taxPrice}</span></p>

                        <hr />

                        <div className="voucher-box">
                            {appliedVoucher ? (
                                <div className="voucher-applied">
                                    <span><i className="fa fa-ticket"></i> <b>{appliedVoucher.code}</b> applied</span>
                                    <button type="button" className="voucher-remove" onClick={removeVoucher}>Remove</button>
                                </div>
                            ) : (
                                <>
                                    <label htmlFor="voucher_field" className="voucher-label">Have a voucher?</label>
                                    <div className="voucher-input-row">
                                        <input
                                            type="text"
                                            id="voucher_field"
                                            className="form-control"
                                            placeholder="Enter code"
                                            value={voucherInput}
                                            maxLength={30}
                                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyVoucher() } }}
                                        />
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyVoucher()} disabled={applying}>
                                            {applying ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {availableVouchers.length > 0 && (
                                        <div className="voucher-list">
                                            <small>Available for you:</small>
                                            {availableVouchers.map(v => (
                                                <button type="button" key={v.code} className="voucher-chip" onClick={() => applyVoucher(v.code)} disabled={applying} title={v.description || ''}>
                                                    <b>{v.code}</b>
                                                    <span>{describeVoucher(v)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <hr />

                        <p>Total: <span className="order-summary-values">${totalPrice}</span></p>

                        <hr />
                        <button id="checkout_btn" className="btn btn-primary btn-block" onClick={processToPayment}>Proceed to Payment</button>
                    </div>
                </div>


            </div>

        </>
    )
}

export default ConfirmOrder