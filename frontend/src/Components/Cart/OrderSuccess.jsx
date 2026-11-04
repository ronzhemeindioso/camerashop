import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { peso } from '../../Utils/helpers'
import './checkout.css'

const OrderSuccess = () => {
    // set by the Payment page: { method: 'COD' | 'Card', total }
    const { state } = useLocation()
    const isCOD = state && state.method === 'COD'

    // the order is placed, so clear the leftover checkout data
    useEffect(() => {
        sessionStorage.removeItem('orderInfo')
        localStorage.removeItem('cartItems')
        localStorage.removeItem('shippingInfo')
    }, [])

    return (
        <>
            <MetaData title={'Order Success'} />

            <div className="co-page co-page--narrow">
                <div className="co-card co-success">
                    <svg className="co-success-icon" viewBox="0 0 72 72" role="img" aria-label="Order placed">
                        <circle cx="36" cy="36" r="34" fill="#f1e7f7" stroke="#7e3d84" strokeWidth="2" />
                        <path d="M22 37l10 10 18-21" fill="none" stroke="#7e3d84" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <h1>Order placed successfully</h1>
                    <p className="co-note">
                        Thank you for your purchase. We have emailed you the order details, and you can follow
                        its progress in your orders.
                    </p>
                    {isCOD && state.total != null && (
                        <p className="co-note">
                            Please prepare <b>{peso(state.total)}</b> to pay in cash when your order is delivered.
                        </p>
                    )}

                    <div className="co-success-actions">
                        <Link to="/orders/me" className="co-btn">View my orders</Link>
                        <Link to="/" className="co-btn co-btn--ghost">Continue shopping</Link>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OrderSuccess
